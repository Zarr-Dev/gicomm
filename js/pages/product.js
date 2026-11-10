import { supabase } from "../lib/supabase.js";
import { getTheme, setTheme } from "../components/storage.js";
import { initMotion } from "../components/interactions.js";
initMotion();


const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
const state = { user: null, product: null, saved: false };
const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, (c) => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));
const money = (value, currency = "IDR") => {
  try {
    return new Intl.NumberFormat("id-ID", { style:"currency", currency, maximumFractionDigits:0 }).format(Number(value || 0));
  } catch {
    return String(value || 0) + " " + currency;
  }
};

document.body.classList.toggle("dark", getTheme() === "dark");

async function loadIdentity() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  state.user = user;
  if (!user) return;
  $("productSignIn").hidden = true;
  $("productAccount").hidden = false;
  $("productAccount").textContent = user.user_metadata?.display_name || user.email?.split("@")[0] || "Akun";
}

async function loadProduct() {
  if (!productId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(productId)) {
    throw new Error("Tautan produk tidak valid.");
  }

  const { data: product, error } = await supabase
    .from("products")
    .select("id,seller_id,product_type_id,category_id,title,slug,description,price,currency,created_at")
    .eq("id", productId)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!product) throw new Error("Produk tidak ditemukan atau belum dipublikasikan.");

  const [category, type, seller, asset] = await Promise.all([
    supabase.from("categories").select("name").eq("id", product.category_id).maybeSingle(),
    supabase.from("product_types").select("name").eq("id", product.product_type_id).maybeSingle(),
    supabase.from("profiles").select("display_name").eq("id", product.seller_id).maybeSingle(),
    supabase.from("product_assets").select("asset_path").eq("product_id", product.id).eq("asset_kind", "cover").maybeSingle(),
  ]);

  $("productTitle").textContent = product.title;
  $("productDescription").textContent = product.description || "Kreator belum menambahkan deskripsi untuk produk ini.";
  $("productPrice").textContent = money(product.price, product.currency);
  $("productType").textContent = type.data?.name || "Produk digital";
  $("productCategory").textContent = category.data?.name || "Digital";
  $("productSeller").textContent = "Dibuat oleh " + (seller.data?.display_name || "Kreator Gicomm");

  if (asset.data?.asset_path) {
    const { data: signed, error: signedError } = await supabase.storage
      .from("product-assets").createSignedUrl(asset.data.asset_path, 3600);
    if (!signedError && signed?.signedUrl) {
      $("productCover").innerHTML = '<img src="' + escapeHTML(signed.signedUrl) + '" alt="' + escapeHTML(product.title) + '">';
    }
  }

  state.product = product;
  if (state.user) {
    const { data: saved, error: savedError } = await supabase
      .from("saved_products").select("product_id")
      .eq("user_id", state.user.id).eq("product_id", product.id).maybeSingle();
    if (savedError) throw savedError;
    state.saved = Boolean(saved);
  }
  updateSaveButton();
  $("productStatus").hidden = true;
  $("productDetail").hidden = false;
}

function updateSaveButton() {
  $("saveProduct").textContent = state.saved ? "♥ Tersimpan di wishlist" : "♡ Simpan ke wishlist";
}

async function toggleSaved() {
  if (!state.user) {
    const next = "/product.html?id=" + encodeURIComponent(productId);
    window.location.href = "login.html?next=" + encodeURIComponent(next);
    return;
  }
  if (!state.product) return;

  const result = state.saved
    ? await supabase.from("saved_products").delete()
        .eq("user_id", state.user.id).eq("product_id", state.product.id)
    : await supabase.from("saved_products").insert({
        user_id: state.user.id,
        product_id: state.product.id,
      });
  if (result.error) {
    $("productStatus").hidden = false;
    $("productStatus").textContent = result.error.message;
    return;
  }
  state.saved = !state.saved;
  updateSaveButton();
}

$("saveProduct").addEventListener("click", toggleSaved);
document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const next = document.body.classList.contains("dark") ? "light" : "dark";
    setTheme(next);
    document.body.classList.toggle("dark", next === "dark");
  });
});

try {
  await loadIdentity();
  await loadProduct();
} catch (error) {
  $("productStatus").textContent = error?.message || "Detail produk gagal dimuat.";
}
