import { getTheme, setTheme } from "../components/storage.js";
import { requireUser, signOut } from "../lib/auth.js";

const authContext = await requireUser();
if (!authContext) throw new Error("Redirecting to sign in.");
const displayName =
  authContext.profile?.display_name ||
  authContext.user.user_metadata?.display_name ||
  authContext.user.email?.split("@")[0] || "Gicomm user";
const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2)
  .map((part) => part[0].toUpperCase()).join("") || "G";

document.querySelector("#accountWelcome").textContent = `, ${displayName}.`;
document.querySelector("#dashboardAvatar").textContent = initials;
document.querySelector("#profileAvatar").textContent = initials;
document.querySelector("#profileDisplayName").textContent = displayName;
document.querySelector("#profileEmail").textContent = authContext.user.email || "";

const sections = {
  Overview: {
    title: "Account overview",
    subtitle: "Your Gicomm account is authenticated with Supabase.",
    content: "<div><b>Authentication connected</b><p>Your account session has been verified. Marketplace data will be connected in the next phase.</p></div>",
  },
  "My Library": {
    title: "My Library",
    subtitle: "Digital library integration is scheduled for a later backend phase.",
    content: "<p>Your purchased digital products will appear here after order and entitlement workflows are implemented.</p>",
  },
  Saved: {
    title: "Saved products",
    subtitle: "Persistent wishlist integration is scheduled for the product-data phase.",
    content: "<p>Your saved products will appear here after the marketplace catalog is connected.</p>",
  },
  Orders: {
    title: "Orders",
    subtitle: "Order management is not enabled yet. No payment is being processed.",
    content: "<p>Order history will appear here after the order lifecycle is implemented and tested.</p>",
  },
  Selling: {
    title: "Seller workspace",
    subtitle: "Seller product management will be connected in the next backend phase.",
    content: "<p>Product creation, editing, and moderation will be enabled after catalog integration.</p>",
  },
  Settings: {
    title: "Account settings",
    subtitle: "Profile editing and preferences will be connected in a later phase.",
    content: "<p>Your authenticated identity is active. Profile management is not enabled yet.</p>",
  },
};

const tabTitle = document.querySelector("#tabTitle");
const tabSubtitle = document.querySelector("#tabSub");
const activitiesContainer = document.querySelector(".activities");
document.querySelectorAll("[data-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    const tabData = sections[button.dataset.tab];
    if (!tabData) return;
    tabTitle.textContent = tabData.title;
    tabSubtitle.textContent = tabData.subtitle;
    if (activitiesContainer) activitiesContainer.innerHTML = tabData.content;
  });
});

document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
    setTheme(nextTheme);
    document.body.classList.toggle("dark", nextTheme === "dark");
  });
});

document.querySelector("#logout").addEventListener("click", async () => {
  const button = document.querySelector("#logout");
  button.disabled = true;
  try {
    await signOut();
    window.location.replace("index.html");
  } catch (error) {
    console.error("Gicomm sign-out failed:", error);
    button.disabled = false;
    window.alert("Could not sign out. Please try again.");
  }
});
document.body.classList.toggle("dark", getTheme() === "dark");
