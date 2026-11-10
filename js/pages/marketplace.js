import { supabase } from "../lib/supabase.js";
import { getTheme, setTheme } from "../components/storage.js";
import { initMotion, initMarketMenu } from "../components/interactions.js";
initMotion();
initMarketMenu();


const initialParams = new URLSearchParams(window.location.search);
const initialQuery = (initialParams.get("q") || "").trim();
const state = { user: null, products: [], categories: [], saved: new Set(), category: "all", query: initialQuery, sort: "newest" };
const normalizeSearch = (value = "") => String(value).normalize("NFKD").replace(/[\\u0300-\\u036f]/g, "").toLocaleLowerCase("id-ID").trim();
const el = (id) => document.getElementById(id);
const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const formatPrice = (value, currency = "IDR") => {
  try { return new Intl.NumberFormat("id-ID", { style:"currency", currency, maximumFractionDigits:0 }).format(Number(value || 0)); }
  catch { return String(value || 0) + " " + currency; }
};
let toastTimer;

function toast(message) {
  const node = el("toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove("show"), 2400);
}

function setThemeUI(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.setAttribute("aria-label", theme === "dark" ? "Ganti ke tema terang" : "Ganti ke tema gelap");
  });
}

async function loadIdentity() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return;
  state.user = user;
  if (!user) return;

  el("signInLink").hidden = true;
  el("accountLink").hidden = false;
  el("accountLink").textContent = user.user_metadata?.display_name || user.email?.split("@")[0] || "Akun";
  if (user.app_metadata?.role === "admin") el("adminLink").hidden = false;

  const { data, error: savedError } = await supabase
    .from("saved_products").select("product_id").eq("user_id", user.id);
  if (!savedError) state.saved = new Set((data || []).map((row) => row.product_id));
}

async function loadCatalog() {
  el("resultText").textContent = "Memuat katalog...";
  const [categoryResult, productResult] = await Promise.all([
    supabase.from("categories").select("id,name,slug,description").eq("is_active", true).order("name"),
    supabase.from("products").select("id,seller_id,product_type_id,category_id,title,slug,description,price,currency,created_at").eq("status", "published").order("created_at", { ascending:false }),
  ]);
  if (categoryResult.error) throw categoryResult.error;
  if (productResult.error) throw productResult.error;
  state.categories = categoryResult.data || [];
  state.products = productResult.data || [];

  const productIds = state.products.map((p) => p.id);
  if (productIds.length) {
    const sellerIds = [...new Set(state.products.map((p) => p.seller_id))];
    const typeIds = [...new Set(state.products.map((p) => p.product_type_id))];
    const [assetResult, profileResult, typeResult] = await Promise.all([
      supabase.from("product_assets").select("product_id,asset_path,asset_kind,sort_order").in("product_id", productIds).eq("asset_kind", "cover"),
      supabase.from("profiles").select("id,display_name").in("id", sellerIds),
      supabase.from("product_types").select("id,name").in("id", typeIds),
    ]);
    if (!assetResult.error) {
      const signed = await Promise.all((assetResult.data || []).map(async (asset) => {
        const { data } = await supabase.storage.from("product-assets").createSignedUrl(asset.asset_path, 3600);
        return [asset.product_id, data?.signedUrl || null];
      }));
      const assetMap = new Map(signed);
      state.products.forEach((p) => { p.cover_url = assetMap.get(p.id) || null; });
    }
    const sellers = new Map((profileResult.data || []).map((p) => [p.id, p.display_name]));
    const types = new Map((typeResult.data || []).map((t) => [t.id, t.name]));
    state.products.forEach((p) => {
      p.seller_name = sellers.get(p.seller_id) || "Kreator Gicomm";
      p.type_name = types.get(p.product_type_id) || "Produk digital";
    });
  }
  renderCategories();
  renderProducts();
}

function renderCategories() {
  const all = [{ id:"all", name:"Semua kategori" }, ...state.categories];
  el("categoryList").innerHTML = all.map((cat) =>
    '<button type="button" class="category-pill ' + (state.category === cat.id ? "active" : "") +
    '" data-category="' + escapeHTML(cat.id) + '">' + escapeHTML(cat.name) + "</button>"
  ).join("");
}

function visibleProducts() {
  const tokens = normalizeSearch(state.query).split(/\\s+/).filter(Boolean);
  const items = state.products.filter((p) => {
    const cat = state.categories.find((c) => c.id === p.category_id);
    const haystack = normalizeSearch([p.title,p.slug,p.description,p.type_name,p.seller_name,cat?.name].join(" "));
    const matchesEveryTerm = tokens.every((term) => haystack.includes(term));
    return matchesEveryTerm && (state.category === "all" || p.category_id === state.category);
  });
  if (state.sort === "title") items.sort((a,b) => a.title.localeCompare(b.title,"id"));
  if (state.sort === "price-low") items.sort((a,b) => Number(a.price)-Number(b.price));
  if (state.sort === "price-high") items.sort((a,b) => Number(b.price)-Number(a.price));
  if (state.sort === "newest") items.sort((a,b) => new Date(b.created_at)-new Date(a.created_at));
  return items;
}

function renderProducts() {
  const items = visibleProducts();
  const hasFilters = Boolean(state.query) || state.category !== "all";
  el("resultText").textContent = state.products.length
    ? (hasFilters ? items.length + " produk ditemukan" : state.products.length + " produk tersedia")
    : "Etalase sedang disiapkan";
  const clearInput = el("clearSearchInput");
  if (clearInput) clearInput.hidden = !state.query;
  el("emptyState").hidden = state.products.length > 0 || hasFilters;
  el("searchEmpty").hidden = state.products.length > 0
    ? items.length > 0
    : !hasFilters;

  // Never display decorative placeholder cards as if they were real products.
  if (!state.products.length) {
    el("productGrid").innerHTML = "";
    return;
  }

  el("productGrid").innerHTML = items.map((p) => {
    const category = state.categories.find((c) => c.id === p.category_id)?.name || "Digital";
    const cover = p.cover_url
      ? '<img src="' + escapeHTML(p.cover_url) + '" alt="' + escapeHTML(p.title) + '">'
      : "<span>G</span>";
    return '<article class="market-product-card">' +
      '<div class="market-product-cover">' + cover + '</div>' +
      '<div class="market-product-info"><div class="market-product-tags"><span>' + escapeHTML(p.type_name) +
      '</span><span>' + escapeHTML(category) + '</span></div><h3>' + escapeHTML(p.title) +
      '</h3><p>' + escapeHTML(p.description) + '</p><div class="market-product-bottom">' +
      '<span class="market-product-price">' + formatPrice(p.price,p.currency) + '</span>' +
      '<div class="market-product-actions"><button type="button" data-view="' + p.id + '">Detail</button>' +
      '<button type="button" data-save="' + p.id + '" aria-label="Simpan produk">' +
      (state.saved.has(p.id) ? "♥" : "♡") + '</button></div></div>' +
      '<span class="market-product-seller">Oleh ' + escapeHTML(p.seller_name) + '</span></div></article>';
  }).join("");
}

function openProduct(productId) {
  const p = state.products.find((item) => item.id === productId);
  if (!p) return;
  const category = state.categories.find((c) => c.id === p.category_id)?.name || "Digital";
  el("modalCategory").textContent = (p.type_name || "Produk digital") + " · " + category;
  el("modalTitle").textContent = p.title;
  el("modalDescription").textContent = p.description || "Belum ada deskripsi.";
  el("modalPrice").textContent = formatPrice(p.price,p.currency);
  el("modalSeller").textContent = "Dibuat oleh " + p.seller_name;
  el("modalImage").innerHTML = p.cover_url
    ? '<img src="' + escapeHTML(p.cover_url) + '" alt="' + escapeHTML(p.title) + '">'
    : "<span>G</span>";
  el("modalSave").dataset.save = p.id;
  el("modalSave").textContent = state.saved.has(p.id) ? "Hapus dari wishlist" : "Simpan ke wishlist";
  el("productModal").hidden = false;
}

async function toggleSaved(productId) {
  if (!state.user) {
    window.location.href = "login.html?next=" + encodeURIComponent(window.location.pathname + window.location.search);
    return;
  }
  const exists = state.saved.has(productId);
  const result = exists
    ? await supabase.from("saved_products").delete().eq("user_id",state.user.id).eq("product_id",productId)
    : await supabase.from("saved_products").insert({user_id:state.user.id,product_id:productId});
  if (result.error) { toast(result.error.message); return; }
  if (exists) state.saved.delete(productId); else state.saved.add(productId);
  renderProducts();
  if (!el("productModal").hidden) el("modalSave").textContent = state.saved.has(productId) ? "Hapus dari wishlist" : "Simpan ke wishlist";
  toast(exists ? "Produk dihapus dari wishlist." : "Produk disimpan ke wishlist.");
}

el("search").value = initialQuery;
el("marketSearchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  state.query = el("search").value.trim();
  const url = new URL(window.location.href);
  if (state.query) url.searchParams.set("q", state.query);
  else url.searchParams.delete("q");
  history.replaceState({}, "", url.pathname + url.search + url.hash);
  renderProducts();
  el("catalog").scrollIntoView({ behavior: "smooth", block: "start" });
});
el("search").addEventListener("input", (event) => {
  state.query = event.target.value.trim();
  if (!state.query && state.category === "all") {
    const url = new URL(window.location.href);
    url.searchParams.delete("q");
    history.replaceState({}, "", url.pathname + url.search + url.hash);
  }
  renderProducts();
});
el("clearSearchInput").addEventListener("click", () => {
  el("search").value = "";
  state.query = "";
  const url = new URL(window.location.href);
  url.searchParams.delete("q");
  history.replaceState({}, "", url.pathname + url.search + url.hash);
  renderProducts();
  el("search").focus();
});
el("categoryList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  renderCategories();
  renderProducts();
});
el("sort").addEventListener("change", (event) => { state.sort = event.target.value; renderProducts(); });
el("productGrid").addEventListener("click", (event) => {
  const view = event.target.closest("[data-view]");
  const save = event.target.closest("[data-save]");
  if (view) window.location.href = "product.html?id=" + encodeURIComponent(view.dataset.view);
  if (save) toggleSaved(save.dataset.save);
});
el("modalSave").addEventListener("click", () => toggleSaved(el("modalSave").dataset.save));
document.querySelectorAll("[data-close-modal]").forEach((node) => node.addEventListener("click", () => { el("productModal").hidden = true; }));
el("clearSearch").addEventListener("click", () => {
  state.query = "";
  state.category = "all";
  el("search").value = "";
  renderCategories();
  renderProducts();
});
document.querySelectorAll("[data-theme-toggle]").forEach((button) => button.addEventListener("click", () => {
  const next = document.body.classList.contains("dark") ? "light" : "dark";
  setTheme(next);
  setThemeUI(next);
}));

setThemeUI(getTheme());
try {
  await loadIdentity();
  await loadCatalog();
} catch (error) {
  console.error("Gicomm catalog failed to load:", error);
  el("resultText").textContent = "Katalog belum dapat dimuat";
  el("productGrid").innerHTML = "";
  el("emptyState").hidden = true;
  el("searchEmpty").hidden = false;
  el("searchEmpty").querySelector("h3").textContent = "Koneksi katalog belum tersedia.";
  el("searchEmpty").querySelector("p").textContent = "Silakan coba beberapa saat lagi.";
}
