import { supabase } from "../lib/supabase.js";
import { initMotion } from "../components/interactions.js";
initMotion();


const form = document.querySelector("#loginForm");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const displayNameInput = document.querySelector("#displayName");
const confirmPasswordInput = document.querySelector("#confirmPassword");
const message = document.querySelector("#authMessage");
const submitButton = form.querySelector('button[type="submit"], button:not([type])');
const signupLink = document.querySelector("#signup");
const forgotLink = document.querySelector("#forgot");
const bottomLabel = document.querySelector("#authBottomLabel");
const togglePasswordButton = document.querySelector("#togglePassword");

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
    isSignup ? "BUAT AKUN GICOMM" : isRecovery ? "BUAT PASSWORD BARU" :
    isResetRequest ? "PEMULIHAN PASSWORD" : "SELAMAT DATANG KEMBALI";
  document.querySelector(".auth-card h1").textContent =
    isSignup ? "Bergabung dengan Gicomm." : isRecovery ? "Atur password baru." :
    isResetRequest ? "Reset password." : "Masuk ke Gicomm.";
  document.querySelector(".auth-heading > .muted").textContent =
    isSignup ? "Buat akun untuk menjelajahi dan mengelola produk digital." :
    isRecovery ? "Pilih password baru untuk akun Gicomm milikmu." :
    isResetRequest ? "Masukkan email akun untuk menerima tautan pemulihan." :
    "Akses koleksi, wishlist, dan ruang akun Gicomm milikmu.";
  document.querySelector("#displayNameField").hidden = !isSignup;
  document.querySelector("#emailField").hidden = isRecovery;
  document.querySelector("#passwordField").hidden = isResetRequest;
  document.querySelector("#confirmPasswordField").hidden = !(isSignup || isRecovery);
  document.querySelector("#confirmPasswordLabel").textContent =
    isRecovery ? "Konfirmasi password baru" : "Konfirmasi password";
  document.querySelector("#passwordLabel").textContent =
    isRecovery ? "Password baru" : "Password";
  document.querySelector("#passwordHint").hidden = !isSignup && !isRecovery;
  togglePasswordButton.hidden = isResetRequest;
  passwordInput.autocomplete = isRecovery || isSignup ? "new-password" : "current-password";
  passwordInput.required = !isResetRequest;
  passwordInput.minLength = isSignup || isRecovery ? 8 : 0;
  emailInput.required = !isRecovery;
  confirmPasswordInput.required = isSignup || isRecovery;
  confirmPasswordInput.value = "";
  document.querySelector(".auth-row").hidden = isSignup || isRecovery || isResetRequest;
  forgotLink.hidden = isSignup || isRecovery || isResetRequest;
  signupLink.parentElement.hidden = isRecovery;
  signupLink.textContent = isSignup ? "Masuk di sini" : isResetRequest ? "Kembali masuk" : "Buat akun";
  bottomLabel.textContent = isSignup ? "Sudah punya akun?" : isResetRequest ? "" : "Belum punya akun?";
  submitButton.textContent = isSignup ? "Create account" : isRecovery ? "Update password" :
    isResetRequest ? "Send recovery link" : "Continue";
  showMessage("");
}

function setBusy(busy) {
  submitButton.disabled = busy;
  submitButton.textContent = busy ? "Please wait…" :
    mode === "signup" ? "Create account" : mode === "recovery" ? "Update password" :
    mode === "reset-request" ? "Send recovery link" : "Continue";
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
      if (!displayName) throw new Error("Masukkan nama tampilan terlebih dahulu.");
      if (password.length < 8) throw new Error("Password harus terdiri dari minimal 8 karakter.");
      if (password !== confirmPasswordInput.value) throw new Error("Konfirmasi password belum sama.");
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
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
      showMessage("Bila email terdaftar, tautan pemulihan password akan dikirimkan.", "success");
      return;
    }
    if (mode === "recovery") {
      if (password !== confirmPasswordInput.value) throw new Error("Password dan konfirmasi belum sama.");
      if (password.length < 8) throw new Error("Gunakan password minimal 8 karakter.");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      setMode("signin");
      showMessage("Password berhasil diperbarui. Silakan masuk menggunakan password baru.", "success");
    }
  } catch (error) {
    showMessage(error?.message || "Autentikasi gagal. Silakan periksa kembali data akunmu.", "error");
  } finally {
    setBusy(false);
  }
}

form.addEventListener("submit", submit);
togglePasswordButton.addEventListener("click", () => {
  const reveal = passwordInput.type === "password";
  passwordInput.type = reveal ? "text" : "password";
  togglePasswordButton.textContent = reveal ? "Sembunyikan" : "Tampilkan";
  togglePasswordButton.setAttribute("aria-label", reveal ? "Sembunyikan password" : "Tampilkan password");
  togglePasswordButton.setAttribute("aria-pressed", String(reveal));
});
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

async function redirectIfAlreadyAuthenticated() {
  if (mode === "recovery" || mode === "reset-request") return;
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return;
    const destination = nextPath
      ? safeNext
      : user.app_metadata?.role === "admin" ? "admin.html" : "dashboard.html";
    window.location.replace(destination);
  } catch (error) {
    console.warn("Could not check the existing Gicomm session:", error);
  }
}
await redirectIfAlreadyAuthenticated();
