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
    isSignup ? "CREATE YOUR ACCOUNT" : isRecovery ? "CHOOSE A NEW PASSWORD" :
    isResetRequest ? "PASSWORD RECOVERY" : "WELCOME BACK";
  document.querySelector(".auth-card h1").textContent =
    isSignup ? "Join Gicomm." : isRecovery ? "Set a new password." :
    isResetRequest ? "Reset your password." : "Sign in to Gicomm.";
  document.querySelector(".auth-card > .muted").textContent =
    isSignup ? "Create an account to discover and manage digital products." :
    isRecovery ? "Choose a new password for your Gicomm account." :
    isResetRequest ? "Enter your account email and we will send a recovery link." :
    "Access your library, saved products, and dashboard.";
  document.querySelector("#displayNameField").hidden = !isSignup;
  document.querySelector("#emailField").hidden = isRecovery;
  document.querySelector("#passwordField").hidden = isResetRequest;
  document.querySelector("#confirmPasswordField").hidden = !isRecovery;
  document.querySelector("#passwordLabel").textContent = isRecovery ? "New password" : "Password";
  passwordInput.autocomplete = isRecovery || isSignup ? "new-password" : "current-password";
  passwordInput.required = !isResetRequest;
  confirmPasswordInput.required = isRecovery;
  document.querySelector(".auth-row").hidden = isSignup || isRecovery || isResetRequest;
  forgotLink.hidden = isSignup || isRecovery || isResetRequest;
  signupLink.parentElement.hidden = isRecovery || isResetRequest;
  signupLink.textContent = isSignup ? "Sign in instead" : "Create account";
  signupLink.parentElement.firstChild.textContent = isSignup ? "Already have an account? " : "Need an account? ";
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
      if (!displayName) throw new Error("Please enter your display name.");
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: { display_name: displayName } },
      });
      if (error) throw error;
      if (data.session) window.location.assign(safeNext);
      else {
        setMode("signin");
        showMessage("Account created. Check your email to confirm the address, then sign in.", "success");
      }
      return;
    }
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.assign(safeNext);
      return;
    }
    if (mode === "reset-request") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login.html?mode=recovery`,
      });
      if (error) throw error;
      showMessage("If an account exists for that email, a password recovery link has been sent.", "success");
      return;
    }
    if (mode === "recovery") {
      if (password !== confirmPasswordInput.value) throw new Error("The passwords do not match.");
      if (password.length < 8) throw new Error("Use a password with at least 8 characters.");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      setMode("signin");
      showMessage("Password updated. You can now sign in with your new password.", "success");
    }
  } catch (error) {
    showMessage(error?.message || "Authentication failed. Please try again.", "error");
  } finally {
    setBusy(false);
  }
}

form.addEventListener("submit", submit);
signupLink.addEventListener("click", (event) => {
  event.preventDefault();
  setMode(mode === "signup" ? "signin" : "signup");
});
forgotLink.addEventListener("click", (event) => {
  event.preventDefault();
  setMode("reset-request");
});
if (mode === "recovery") setMode("recovery");
else if (params.get("mode") === "signup" || params.get("mode") === "creator") setMode("signup");
else setMode("signin");
