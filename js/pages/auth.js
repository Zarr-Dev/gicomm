import { supabase } from "../lib/supabase.js";

const form = document.querySelector("#loginForm");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const displayNameInput = document.querySelector("#displayName");
const confirmPasswordInput = document.querySelector("#confirmPassword");
const message = document.querySelector("#authMessage");
const submitButton = form.querySelector('button[type="submit"], button:not([type])');
const signupLink = document.querySelector("#signup");
const forgotLink = document.querySelector("#forgot");

const params = new URLSearchParams(window.location.search);
const nextPath = params.get("next");
const safeNext = nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
  ? nextPath
  : "dashboard.html";
let mode = params.get("mode") === "recovery" ? "recovery" : "signin";

function showMessage(text, kind = "info") {
  message.hidden = !text;
  message.textContent = text;
  message.dataset.kind = kind;
}

function setMode(nextMode) {
  mode = nextMode;
  const isSignup = mode === "signup";
  const isRecovery = mode === "recovery";
  const isResetRequest = mode === "reset-request";
  document.querySelector(".auth-card .eyebrow").textContent =
    isSignup ? "BUAT AKUN BARU" : isRecovery ? "BUAT KATA SANDI BARU" :
    isResetRequest ? "PEMULIHAN AKUN" : "SELAMAT DATANG KEMBALI";
  document.querySelector(".auth-card h1").textContent =
    isSignup ? "Bergabung dengan Gicomm." : isRecovery ? "Atur kata sandi baru." :
    isResetRequest ? "Pulihkan kata sandi." : "Masuk ke Gicomm.";
  document.querySelector(".auth-card > .muted").textContent =
    isSignup ? "Buat akun untuk menjelajahi dan mengelola produk digital." :
    isRecovery ? "Pilih kata sandi baru untuk akun Gicomm-mu." :
    isResetRequest ? "Masukkan email akunmu untuk menerima tautan pemulihan." :
    "Akses koleksi, produk tersimpan, dan dashboard akunmu.";
  document.querySelector("#displayNameField").hidden = !isSignup;
  document.querySelector("#emailField").hidden = isRecovery;
  document.querySelector("#passwordField").hidden = isResetRequest;
  document.querySelector("#confirmPasswordField").hidden = !isRecovery;
  document.querySelector("#passwordLabel").textContent = isRecovery ? "Kata sandi baru" : "Kata sandi";
  passwordInput.autocomplete = isRecovery || isSignup ? "new-password" : "current-password";
  passwordInput.required = !isResetRequest;
  emailInput.required = !isRecovery;
  confirmPasswordInput.required = isRecovery;
  document.querySelector(".auth-row").hidden = isSignup || isRecovery || isResetRequest;
  forgotLink.hidden = isSignup || isRecovery || isResetRequest;
  signupLink.parentElement.hidden = isRecovery;
  signupLink.textContent = isSignup ? "Kembali masuk" : isResetRequest ? "Kembali masuk" : "Buat akun";
  signupLink.parentElement.firstChild.textContent = isSignup ? "Sudah punya akun? " : isResetRequest ? "" : "Belum punya akun? ";
  submitButton.textContent = isSignup ? "Buat akun" : isRecovery ? "Update password" :
    isResetRequest ? "Send recovery link" : "Masuk";
  showMessage("");
}

function setBusy(busy) {
  submitButton.disabled = busy;
  submitButton.textContent = busy ? "Memproses…" :
    mode === "signup" ? "Buat akun" : mode === "recovery" ? "Update password" :
    mode === "reset-request" ? "Send recovery link" : "Masuk";
}

async function submit(event) {
  event.preventDefault();
  showMessage("");
  setBusy(true);
  try {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (mode === "signup") {
      const displayName = displayNameInput.value.trim();
      if (!displayName) throw new Error("Masukkan nama tampilan.");
      if (password.length < 8) throw new Error("Gunakan kata sandi minimal 8 karakter.");
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: { display_name: displayName } },
      });
      if (error) throw error;
      if (data.session) window.location.assign(safeNext);
      else {
        setMode("signin");
        showMessage("Akun berhasil dibuat. Periksa email untuk mengonfirmasi alamat, lalu masuk.", "success");
      }
      return;
    }
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: { user } } = await supabase.auth.getUser();
      const destination = nextPath ? safeNext :
        user?.app_metadata?.role === "admin" ? "admin.html" : safeNext;
      window.location.assign(destination);
      return;
    }
    if (mode === "reset-request") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login.html?mode=recovery`,
      });
      if (error) throw error;
      showMessage("Jika email terdaftar, tautan pemulihan telah dikirim.", "success");
      return;
    }
    if (mode === "recovery") {
      if (password !== confirmPasswordInput.value) throw new Error("Kata sandi tidak cocok.");
      if (password.length < 8) throw new Error("Gunakan kata sandi minimal 8 karakter.");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      setMode("signin");
      showMessage("Kata sandi diperbarui. Silakan masuk kembali.", "success");
    }
  } catch (error) {
    showMessage(error?.message || "Autentikasi gagal. Silakan coba lagi.", "error");
  } finally {
    setBusy(false);
  }
}

form.addEventListener("submit", submit);
signupLink.addEventListener("click", (event) => {
  event.preventDefault();
  setMode(mode === "signup" || mode === "reset-request" ? "signin" : "signup");
});
forgotLink.addEventListener("click", (event) => {
  event.preventDefault();
  setMode("reset-request");
});
if (mode === "recovery") setMode("recovery");
else if (params.get("mode") === "signup" || params.get("mode") === "creator") setMode("signup");
else setMode("signin");
