import { supabase } from "../lib/supabase.js";
import { requireUser, signOut } from "../lib/auth.js";
import { getTheme, setTheme } from "../components/storage.js";

const context = await requireUser();
if (!context) throw new Error("Redirecting to sign in.");
const user = context.user;
const profileName = context.profile?.display_name || user.user_metadata?.display_name || user.email?.split("@")[0] || "Kreator";
const $ = (id) => document.getElementById(id);
const esc = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[char]));
const slugify = (value = "") => String(value).normalize("NFKD").toLowerCase()
  .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const formatMoney = (value) => new Intl.NumberFormat("id-ID", {
  style:"currency",currency:"IDR",maximumFractionDigits:0
}).format(Number(value || 0));
const formatDate = (value) => new Intl.DateTimeFormat("id-ID", {
  dateStyle:"medium",timeStyle:"short"
}).format(new Date(value));
const state = { products:[], types:[], categories:[], mappings:[], revisions:[], covers:new Map() };
let toastTimer;

$("sellerName").textContent = profileName;
$("sellerAvatar").textContent = profileName.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0].toUpperCase()).join("") || "G";
document.body.classList.toggle("dark", getTheme() === "dark");

function notify(message) {
  const node = $("sellerToast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove("show"), 3600);
}

function statusLabel(status) {
  return ({
    draft:"Draft",pending_review:"Menunggu review",published:"Diterbitkan",
    rejected:"Perlu perbaikan",archived:"Diarsipkan",approved:"Disetujui"
  })[status] || status;
}

function statusClass(status) {
  return ["draft","pending_review","published","rejected","archived","approved"].includes(status) ? status : "draft";
}

async function loadTaxonomy() {
  const [types,categories,mappings] = await Promise.all([
    supabase.from("product_types").select("id,name,is_active").eq("is_active",true).order("name"),
    supabase.from("categories").select("id,name,is_active").eq("is_active",true).order("name"),
    supabase.from("product_type_categories").select("product_type_id,category_id")
  ]);
  if(types.error) throw types.error;
  if(categories.error) throw categories.error;
  if(mappings.error) throw mappings.error;
  state.types = types.data || [];
  state.categories = categories.data || [];
  state.mappings = mappings.data || [];
  populateTaxonomy($("sellerType"),$("sellerCategory"));
  populateTaxonomy($("revisionType"),$("revisionCategory"));
}

function populateTaxonomy(typeSelect,categorySelect,selectedType="",selectedCategory="") {
  typeSelect.innerHTML = state.types.map(type=>'<option value="'+esc(type.id)+'">'+esc(type.name)+'</option>').join("");
  if(selectedType && state.types.some(type=>type.id===selectedType)) typeSelect.value=selectedType;
  const renderCategories = () => {
    const allowed = new Set(state.mappings.filter(m=>m.product_type_id===typeSelect.value).map(m=>m.category_id));
    const options = state.categories.filter(category=>allowed.has(category.id));
    categorySelect.innerHTML = options.map(category=>'<option value="'+esc(category.id)+'">'+esc(category.name)+'</option>').join("");
    if(selectedCategory && options.some(category=>category.id===selectedCategory)) categorySelect.value=selectedCategory;
    if(!options.length) categorySelect.innerHTML='<option value="">Belum ada kategori untuk jenis ini</option>';
  };
  typeSelect.onchange = () => { selectedCategory=""; renderCategories(); };
  renderCategories();
}

async function loadWorkspace() {
  const [products,revisions] = await Promise.all([
    supabase.from("products")
      .select("id,seller_id,product_type_id,category_id,title,slug,description,price,currency,status,created_at,updated_at")
      .eq("seller_id",user.id).order("updated_at",{ascending:false}),
    supabase.from("product_revisions")
      .select("id,product_id,proposed_title,status,review_note,seller_note,created_at,updated_at,reviewed_at")
      .eq("seller_id",user.id).order("created_at",{ascending:false})
  ]);
  if(products.error) throw products.error;
  if(revisions.error) throw revisions.error;
  state.products = products.data || [];
  state.revisions = revisions.data || [];
  state.covers = new Map();
  const ids = state.products.map(product=>product.id);
  if(ids.length) {
    const {data,error} = await supabase.from("product_assets")
      .select("product_id,asset_path,alt_text").in("product_id",ids).eq("asset_kind","cover");
    if(error) throw error;
    await Promise.all((data||[]).map(async asset=>{
      const signed = await supabase.storage.from("product-assets").createSignedUrl(asset.asset_path,600);
      if(!signed.error) state.covers.set(asset.product_id,{url:signed.data.signedUrl,alt:asset.alt_text||""});
    }));
  }
  renderWorkspace();
}

function renderWorkspace() {
  const count = (status) => state.products.filter(product=>product.status===status).length;
  $("sellerTotal").textContent = state.products.length;
  $("sellerDrafts").textContent = count("draft") + count("rejected");
  $("sellerPending").textContent = count("pending_review");
  $("sellerPublished").textContent = count("published");
  $("sellerListHint").textContent = state.products.length
    ? state.products.length+" produk ditemukan."
    : "Belum ada produk. Buat draft pertamamu untuk memulai.";
  renderProducts();
  renderRevisions();
}

function renderProducts() {
  const query = $("sellerSearch").value.trim().toLowerCase();
  const items = state.products.filter(product=>(product.title+" "+product.slug).toLowerCase().includes(query));
  const pendingRevisionIds = new Set(state.revisions.filter(revision=>revision.status==="pending_review").map(revision=>revision.product_id));
  if(!items.length) {
    $("sellerProductGrid").innerHTML = '<div class="seller-empty"><span>✳</span><h3>'+(query?"Produk tidak ditemukan":"Etalase kreatormu dimulai dari sini")+'</h3><p>'+(query?"Coba kata kunci lain.":"Buat draft produk digital, lengkapi detailnya, lalu kirim ke Admin untuk ditinjau.")+'</p></div>';
    return;
  }
  const typeNames = new Map(state.types.map(type=>[type.id,type.name]));
  const categoryNames = new Map(state.categories.map(category=>[category.id,category.name]));
  $("sellerProductGrid").innerHTML = items.map(product=>{
    const cover = state.covers.get(product.id);
    let action = "";
    if(["draft","rejected"].includes(product.status)) {
      action = '<button class="seller-secondary" data-edit-product="'+esc(product.id)+'">Edit draft</button><button class="seller-primary" data-submit-product="'+esc(product.id)+'">Kirim review</button>';
    } else if(product.status==="published") {
      action = pendingRevisionIds.has(product.id)
        ? '<button class="seller-secondary" disabled>Perubahan sedang ditinjau</button>'
        : '<button class="seller-secondary" data-revise-product="'+esc(product.id)+'">Ajukan perubahan</button>';
    } else if(product.status==="pending_review") {
      action = '<button class="seller-secondary" disabled>Menunggu keputusan Admin</button>';
    }
    return '<article class="seller-product-card"><div class="seller-product-cover">'+(cover?'<img src="'+esc(cover.url)+'" alt="'+esc(cover.alt)+'">':'<span>G</span>')+'</div><div class="seller-product-body"><div class="seller-product-meta"><span class="seller-status '+statusClass(product.status)+'">'+esc(statusLabel(product.status))+'</span><small>'+esc(typeNames.get(product.product_type_id)||"Produk digital")+' · '+esc(categoryNames.get(product.category_id)||"Kategori")+'</small></div><h4>'+esc(product.title)+'</h4><p>'+esc(product.description||"Belum ada deskripsi.")+'</p><div class="seller-product-bottom"><strong>'+formatMoney(product.price)+'</strong><small>Diperbarui '+formatDate(product.updated_at)+'</small></div><div class="seller-product-actions">'+action+'</div></div></article>';
  }).join("");
}

function renderRevisions() {
  if(!state.revisions.length) {
    $("sellerRevisionList").innerHTML = '<div class="seller-empty compact"><h3>Belum ada riwayat perubahan</h3><p>Pengajuan perubahan untuk produk terbit akan tercatat di sini.</p></div>';
    return;
  }
  $("sellerRevisionList").innerHTML = state.revisions.map(revision=>
    '<article class="seller-revision-item"><div><strong>'+esc(revision.proposed_title)+'</strong><small>'+formatDate(revision.created_at)+'</small></div><span class="seller-status '+statusClass(revision.status)+'">'+esc(statusLabel(revision.status))+'</span><p>'+(revision.review_note?'<b>Catatan Admin:</b> '+esc(revision.review_note):revision.seller_note?'<b>Catatan pengajuan:</b> '+esc(revision.seller_note):"Belum ada catatan moderasi.")+'</p></article>'
  ).join("");
}

function openProductForm(product=null) {
  $("sellerProductEditor").reset();
  $("sellerProductForm").hidden=false;
  $("sellerFormTitle").textContent=product?"Edit draft produk":"Buat produk baru";
  $("sellerProductId").value=product?.id||"";
  $("sellerTitle").value=product?.title||"";
  $("sellerSlug").value=product?.slug||"";
  $("sellerDescription").value=product?.description||"";
  $("sellerPrice").value=product?.price??0;
  $("sellerCover").value="";
  $("sellerSlug").dataset.edited="";
  populateTaxonomy($("sellerType"),$("sellerCategory"),product?.product_type_id||"",product?.category_id||"");
  $("sellerProductForm").scrollIntoView({behavior:"smooth",block:"start"});
}

function closeProductForm() {
  $("sellerProductForm").hidden=true;
  $("sellerProductEditor").reset();
}

function safeFileName(name) {
  return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/^-+|-+$/g,"").slice(-160)||"cover";
}

async function replaceCover(product,file) {
  if(!file) return;
  const allowed = ["image/jpeg","image/png","image/webp","image/avif"];
  if(!allowed.includes(file.type)||file.size<=0||file.size>10*1024*1024) {
    throw new Error("Sampul harus JPG, PNG, WebP, atau AVIF dan maksimal 10 MB.");
  }
  if(!["draft","rejected"].includes(product.status)) {
    throw new Error("Sampul hanya dapat diubah saat produk berstatus draft atau rejected.");
  }
  const path = user.id+"/"+product.id+"/"+crypto.randomUUID()+"-"+safeFileName(file.name);
  const bucket = supabase.storage.from("product-assets");
  const upload = await bucket.upload(path,file,{contentType:file.type,upsert:false});
  if(upload.error) throw upload.error;
  const old = await supabase.from("product_assets").select("id,asset_path")
    .eq("product_id",product.id).eq("asset_kind","cover").maybeSingle();
  if(old.error) { await bucket.remove([path]); throw old.error; }
  const insert = await supabase.from("product_assets").insert({
    product_id:product.id,asset_path:path,asset_kind:"cover",alt_text:product.title,sort_order:0
  });
  if(insert.error) { await bucket.remove([path]); throw insert.error; }
  if(old.data) {
    const removed = await supabase.from("product_assets").delete().eq("id",old.data.id);
    if(!removed.error) await bucket.remove([old.data.asset_path]);
  }
}

$("newSellerProduct").addEventListener("click",()=>openProductForm());
$("closeSellerForm").addEventListener("click",closeProductForm);
$("cancelSellerForm").addEventListener("click",closeProductForm);
$("sellerTitle").addEventListener("input",()=>{
  if(!$("sellerSlug").dataset.edited) $("sellerSlug").value=slugify($("sellerTitle").value);
});
$("sellerSlug").addEventListener("input",()=>{$("sellerSlug").dataset.edited="true";});
$("sellerProductEditor").addEventListener("submit",async event=>{
  event.preventDefault();
  const button=$("saveSellerProduct");
  button.disabled=true;button.textContent="Menyimpan...";
  try {
    const title=$("sellerTitle").value.trim();
    const typeId=$("sellerType").value;
    const categoryId=$("sellerCategory").value;
    if(!typeId||!categoryId) throw new Error("Pilih jenis produk dan kategori yang tersedia.");
    const payload={
      product_type_id:typeId,category_id:categoryId,title,
      slug:slugify($("sellerSlug").value||title),
      description:$("sellerDescription").value.trim(),
      price:Number($("sellerPrice").value),currency:"IDR",status:"draft"
    };
    if(!Number.isFinite(payload.price)||payload.price<0) throw new Error("Harga tidak valid.");
    let saved;
    const productId=$("sellerProductId").value;
    if(productId) {
      const result=await supabase.from("products").update(payload)
        .eq("id",productId).eq("seller_id",user.id).in("status",["draft","rejected"])
        .select("id,seller_id,product_type_id,category_id,title,slug,description,price,currency,status,updated_at").single();
      if(result.error) throw result.error;
      saved=result.data;
    } else {
      const result=await supabase.from("products").insert({...payload,seller_id:user.id})
        .select("id,seller_id,product_type_id,category_id,title,slug,description,price,currency,status,updated_at").single();
      if(result.error) throw result.error;
      saved=result.data;
    }
    await replaceCover(saved,$("sellerCover").files[0]);
    closeProductForm();
    await loadWorkspace();
    notify("Draft produk berhasil disimpan.");
  } catch(error) {
    console.error("Seller product save failed:",error);
    notify(error.message||"Produk gagal disimpan.");
  } finally {
    button.disabled=false;button.textContent="Simpan sebagai draft";
  }
});

async function submitForReview(productId) {
  const product=state.products.find(item=>item.id===productId);
  if(!product||!["draft","rejected"].includes(product.status)) return;
  if(!window.confirm("Kirim produk ini ke antrean moderasi Admin?")) return;
  const result=await supabase.from("products").update({status:"pending_review"})
    .eq("id",productId).eq("seller_id",user.id).in("status",["draft","rejected"])
    .select("id,status").maybeSingle();
  if(result.error) throw result.error;
  if(!result.data) throw new Error("Status produk berubah. Muat ulang lalu coba lagi.");
  await loadWorkspace();
  notify("Produk berhasil dikirim untuk ditinjau.");
}

function openRevisionForm(product) {
  $("sellerRevisionEditor").reset();
  $("revisionProductId").value=product.id;
  $("revisionTitle").value=product.title;
  $("revisionSlug").value=product.slug;
  $("revisionDescription").value=product.description||"";
  $("revisionPrice").value=product.price;
  $("revisionSlug").dataset.edited="";
  populateTaxonomy($("revisionType"),$("revisionCategory"),product.product_type_id,product.category_id);
  $("sellerRevisionForm").hidden=false;
  $("sellerRevisionForm").scrollIntoView({behavior:"smooth",block:"start"});
}
function closeRevisionForm() {
  $("sellerRevisionForm").hidden=true;
  $("sellerRevisionEditor").reset();
}
$("closeRevisionForm").addEventListener("click",closeRevisionForm);
$("cancelRevisionForm").addEventListener("click",closeRevisionForm);
$("revisionTitle").addEventListener("input",()=>{
  if(!$("revisionSlug").dataset.edited) $("revisionSlug").value=slugify($("revisionTitle").value);
});
$("revisionSlug").addEventListener("input",()=>{$("revisionSlug").dataset.edited="true";});
$("sellerRevisionEditor").addEventListener("submit",async event=>{
  event.preventDefault();
  const button=$("submitRevision");
  button.disabled=true;button.textContent="Mengirim...";
  try {
    const productId=$("revisionProductId").value;
    const existing=state.revisions.find(revision=>revision.product_id===productId&&revision.status==="pending_review");
    if(existing) throw new Error("Masih ada perubahan produk ini yang sedang ditinjau.");
    const title=$("revisionTitle").value.trim();
    const payload={
      product_id:productId,seller_id:user.id,
      proposed_product_type_id:$("revisionType").value,
      proposed_category_id:$("revisionCategory").value,
      proposed_title:title,proposed_slug:slugify($("revisionSlug").value||title),
      proposed_description:$("revisionDescription").value.trim(),
      proposed_price:Number($("revisionPrice").value),proposed_currency:"IDR",
      seller_note:$("revisionNote").value.trim()||null,status:"pending_review"
    };
    if(!payload.proposed_product_type_id||!payload.proposed_category_id) throw new Error("Jenis dan kategori wajib dipilih.");
    if(!Number.isFinite(payload.proposed_price)||payload.proposed_price<0) throw new Error("Harga tidak valid.");
    const result=await supabase.from("product_revisions").insert(payload).select("id").single();
    if(result.error) throw result.error;
    closeRevisionForm();
    await loadWorkspace();
    notify("Perubahan berhasil dikirim untuk moderasi.");
  } catch(error) {
    console.error("Seller revision submit failed:",error);
    notify(error.message||"Pengajuan perubahan gagal.");
  } finally {
    button.disabled=false;button.textContent="Kirim perubahan";
  }
});

$("sellerProductGrid").addEventListener("click",async event=>{
  const edit=event.target.closest("[data-edit-product]");
  const submit=event.target.closest("[data-submit-product]");
  const revise=event.target.closest("[data-revise-product]");
  try {
    if(edit) {
      const product=state.products.find(item=>item.id===edit.dataset.editProduct);
      if(product) openProductForm(product);
    } else if(submit) {
      await submitForReview(submit.dataset.submitProduct);
    } else if(revise) {
      const product=state.products.find(item=>item.id===revise.dataset.reviseProduct);
      if(product) openRevisionForm(product);
    }
  } catch(error) {
    notify(error.message||"Aksi tidak dapat diselesaikan.");
  }
});
$("sellerSearch").addEventListener("input",renderProducts);
$("sellerLogout").addEventListener("click",async()=>{
  const button=$("sellerLogout");
  button.disabled=true;
  try { await signOut(); window.location.replace("index.html"); }
  catch(error) { console.error(error);notify("Tidak dapat keluar. Coba lagi.");button.disabled=false; }
});

await loadTaxonomy();
await loadWorkspace();
