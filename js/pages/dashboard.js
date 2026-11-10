import { getTheme, setTheme } from "../components/storage.js";
import { requireUser, signOut } from "../lib/auth.js";
import { initMotion } from "../components/interactions.js";

initMotion();

const authContext = await requireUser();
if (!authContext) throw new Error("Dialihkan ke halaman masuk.");

const user = authContext.user;
const displayName =
  authContext.profile?.display_name ||
  user.user_metadata?.display_name ||
  user.email?.split("@")[0] ||
  "Pengguna Gicomm";
const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2)
  .map((part) => part[0].toUpperCase()).join("") || "G";
const isAdmin = user.app_metadata?.role === "admin";

document.querySelector("#accountWelcome").textContent = `, ${displayName}.`;
document.querySelector("#dashboardAvatar").textContent = initials;
document.querySelector("#profileAvatar").textContent = initials;
document.querySelector("#profileDisplayName").textContent = displayName;
document.querySelector("#profileEmail").textContent = user.email || "";
document.querySelector("#dashboardRole").textContent = isAdmin ? "Admin utama" : "Member";
document.querySelector("#dashboardAdminLink").hidden = !isAdmin;

const sections = {
  Overview: {
    title: "Ringkasan akun",
    subtitle: "Sesi akun Gicomm berhasil diverifikasi.",
    content: `<div><i></i><b>Akun terhubung</b><span>Sesi masuk dan identitas akun telah diverifikasi.</span><time>Sekarang</time></div><div><i></i><b>Etalase digital</b><span>Gunakan pencarian dan kategori untuk menemukan karya.</span><time>Marketplace</time></div>`,
  },
  "My Library": {
    title: "Koleksi digital",
    subtitle: "Koleksi akan aktif setelah proses pesanan dan hak akses digital tersedia.",
    content: `<div><i></i><b>Koleksi belum tersedia</b><span>Checkout, pembayaran, dan pengiriman akses digital belum diaktifkan.</span><time>Menunggu fitur</time></div>`,
  },
  Saved: {
    title: "Wishlist",
    subtitle: "Simpan produk dari marketplace untuk menemukannya kembali.",
    content: `<div><i></i><b>Wishlist tersedia di marketplace</b><span>Buka etalase, lalu gunakan ikon hati pada produk untuk menyimpan pilihan.</span><time>Siap digunakan</time></div>`,
  },
  Orders: {
    title: "Pesanan",
    subtitle: "Belum ada proses pembayaran yang berjalan di Gicomm.",
    content: `<div><i></i><b>Transaksi belum diaktifkan</b><span>Riwayat pesanan akan tersedia setelah alur order dan pembayaran selesai dibangun.</span><time>Belum aktif</time></div>`,
  },
  Selling: {
    title: "Ruang kreator",
    subtitle: "Manajemen etalase kreator sedang dipersiapkan.",
    content: `<div><i></i><b>Fitur penjualan belum tersedia untuk Member</b><span>Pengelolaan produk, revisi, dan moderasi akan dibuka setelah alur kreator siap.</span><time>Persiapan</time></div>`,
  },
  Settings: {
    title: "Pengaturan akun",
    subtitle: "Identitas login dikelola melalui Supabase Authentication.",
    content: `<div><i></i><b>Keamanan akun</b><span>Jangan bagikan kata sandi. Gunakan fitur lupa password pada halaman masuk bila diperlukan.</span><time>Keamanan</time></div>`,
  },
};

const tabTitle = document.querySelector("#tabTitle");
const tabSubtitle = document.querySelector("#tabSub");
const activitiesContainer = document.querySelector(".activities");
document.querySelectorAll("[data-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach((item) => {
      item.classList.remove("active");
      item.removeAttribute("aria-current");
    });
    button.classList.add("active");
    button.setAttribute("aria-current", "page");
    const tabData = sections[button.dataset.tab];
    if (!tabData) return;
    tabTitle.textContent = tabData.title;
    tabSubtitle.textContent = tabData.subtitle;
    activitiesContainer.innerHTML = tabData.content;
  });
});

function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  document.querySelector("[data-theme-toggle]")?.setAttribute(
    "aria-label",
    theme === "dark" ? "Ganti ke tema terang" : "Ganti ke tema gelap",
  );
}
document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  });
});
applyTheme(getTheme());

document.querySelector("#logout").addEventListener("click", async () => {
  const button = document.querySelector("#logout");
  button.disabled = true;
  try {
    await signOut();
    window.location.replace("index.html");
  } catch (error) {
    console.error("Gicomm sign-out failed:", error);
    button.disabled = false;
    window.alert("Tidak dapat keluar. Silakan coba kembali.");
  }
});
