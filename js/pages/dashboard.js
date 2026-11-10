import { getTheme, setTheme } from "../components/storage.js";
import { supabase } from "../lib/supabase.js";
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
    subtitle: "Produk digital yang kamu simpan dari marketplace.",
    content: "",
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
const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;",
}[char]));
const formatPrice = (value, currency = "IDR") => {
  try { return new Intl.NumberFormat("id-ID", {style:"currency",currency,maximumFractionDigits:0}).format(Number(value || 0)); }
  catch { return String(value || 0) + " " + currency; }
};

async function renderSavedProducts() {
  activitiesContainer.classList.add("saved-view");
  activitiesContainer.innerHTML = '<p class="dashboard-saved-loading">Memuat wishlist...</p>';
  try {
    const {data: savedRows,error: savedError} = await supabase
      .from("saved_products").select("product_id,created_at")
      .eq("user_id",user.id).order("created_at",{ascending:false});
    if (savedError) throw savedError;
    const ids = (savedRows || []).map((row) => row.product_id);
    document.querySelector("#dashboardSavedCount").textContent = String(ids.length);
    document.querySelector("#dashboardSavedCaption").textContent = ids.length === 1 ? "Produk tersimpan" : "Produk tersimpan";
    if (!ids.length) {
      activitiesContainer.innerHTML = '<div class="dashboard-saved-empty"><span>♡</span><b>Wishlist masih kosong</b><p>Simpan produk melalui ikon hati di etalase agar mudah ditemukan kembali.</p><a href="index.html#catalog">Jelajahi produk ↗</a></div>';
      return;
    }
    const {data: products,error: productsError} = await supabase
      .from("products")
      .select("id,title,slug,description,price,currency")
      .in("id",ids).eq("status","published");
    if (productsError) throw productsError;
    const order = new Map(ids.map((id,index) => [id,index]));
    const items = (products || []).sort((a,b) => order.get(a.id)-order.get(b.id));
    if (!items.length) {
      activitiesContainer.innerHTML = '<div class="dashboard-saved-empty"><span>♡</span><b>Produk belum tersedia</b><p>Produk yang kamu simpan mungkin sudah tidak dipublikasikan. Kembali ke etalase untuk menemukan karya lainnya.</p><a href="index.html#catalog">Buka etalase ↗</a></div>';
      return;
    }
    activitiesContainer.innerHTML = '<div class="dashboard-saved-grid">' + items.map((product) =>
      '<a class="dashboard-saved-card" href="product.html?id='+encodeURIComponent(product.id)+'">'+
      '<span class="dashboard-saved-mark">G</span><span class="dashboard-saved-copy"><b>'+escapeHTML(product.title)+'</b>'+
      '<small>'+escapeHTML((product.description||"Produk digital di Gicomm").slice(0,110))+'</small></span>'+
      '<strong>'+escapeHTML(formatPrice(product.price,product.currency))+'</strong></a>'
    ).join("") + '</div>';
  } catch (error) {
    document.querySelector("#dashboardSavedCount").textContent = "—";
    document.querySelector("#dashboardSavedCaption").textContent = "Belum dapat dimuat";
    activitiesContainer.innerHTML = '<div class="dashboard-saved-empty"><b>Wishlist belum dapat dimuat</b><p>'+escapeHTML(error.message||"Periksa koneksi lalu coba kembali.")+'</p><button type="button" id="retrySavedProducts">Coba lagi</button></div>';
    document.querySelector("#retrySavedProducts")?.addEventListener("click",renderSavedProducts,{once:true});
  }
}

document.querySelectorAll("[data-tab]").forEach((button) => {
  button.addEventListener("click", async () => {
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
    if (button.dataset.tab === "Saved") {
      await renderSavedProducts();
    } else {
      activitiesContainer.classList.remove("saved-view");
      activitiesContainer.innerHTML = tabData.content;
    }
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
