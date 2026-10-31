import { supabase } from "../lib/supabase.js";
import { requireAdmin, signOut } from "../lib/auth.js";

const context = await requireAdmin();
if (!context) throw new Error("Admin authorization required.");
const currentUser = context.user;
const state = { products:[], categories:[], types:[], mappings:[], revisions:[], users:[], editingProduct:null };
const $ = (id) => document.getElementById(id);
const esc = (v="") => String(v).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const slugify = (v="") => String(v).normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const money = (v,c="IDR") => { try { return new Intl.NumberFormat("id-ID",{style:"currency",currency:c,maximumFractionDigits:0}).format(Number(v||0)); } catch { return String(v)+" "+c; } };
let toastTimer;

$("adminEmail").textContent = currentUser.email || "Administrator";

function notify(message) {
  const node = $("adminToast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove("show"), 3200);
}

function notice(message) {
  const node = $("adminNotice");
  node.hidden = !message;
  node.textContent = message;
}

function setPanel(name) {
  document.querySelectorAll(".admin-nav-item").forEach((button) => button.classList.toggle("active",button.dataset.panel===name));
  document.querySelectorAll(".admin-panel").forEach((panel) => panel.classList.toggle("active",panel.id==="panel-"+name));
  const labels = {
    overview:["Ringkasan","Pantau katalog dan kelola operasional marketplace."],
    products:["Produk","Buat, edit, publikasikan, dan arsipkan produk digital."],
    categories:["Kategori","Kelola kelompok produk yang tampil di etalase."],
    types:["Jenis produk","Atur jenis produk digital dan pemetaan kategorinya."],
    reviews:["Moderasi revisi","Periksa perubahan produk yang diajukan kreator."],
    users:["Pengguna & Admin","Kelola role dan akses administratif."],
  };
  $("adminPageTitle").textContent = labels[name][0];
  $("adminPageSubtitle").textContent = labels[name][1];
  if(name==="users") loadUsers();
  if(name==="reviews") loadReviews();
}
document.querySelectorAll("[data-panel]").forEach((button) => button.addEventListener("click",() => setPanel(button.dataset.panel)));
document.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click",() => setPanel(button.dataset.go)));

async function loadProducts() {
  const {data,error}=await supabase.from("products").select("id,seller_id,product_type_id,category_id,title,slug,description,price,currency,status,created_at,updated_at").order("created_at",{ascending:false});
  if(error) throw error;
  state.products=data||[];
  renderProducts();
}
async function loadTaxonomy() {
  const [cats,types,maps]=await Promise.all([
    supabase.from("categories").select("id,name,slug,description,is_active,created_at").order("name"),
    supabase.from("product_types").select("id,name,slug,description,is_active,created_at").order("name"),
    supabase.from("product_type_categories").select("product_type_id,category_id").order("product_type_id"),
  ]);
  if(cats.error) throw cats.error;
  if(types.error) throw types.error;
  if(maps.error) throw maps.error;
  state.categories=cats.data||[];
  state.types=types.data||[];
  state.mappings=maps.data||[];
  renderTaxonomy();
}
async function loadOverview() {
  const [products,published,pending,categories]=await Promise.all([
    supabase.from("products").select("id",{count:"exact",head:true}),
    supabase.from("products").select("id",{count:"exact",head:true}).eq("status","published"),
    supabase.from("products").select("id",{count:"exact",head:true}).eq("status","pending_review"),
    supabase.from("categories").select("id",{count:"exact",head:true}).eq("is_active",true),
  ]);
  $("statProducts").textContent=products.count??"—";
  $("statPublished").textContent=published.count??"—";
  $("statPending").textContent=pending.count??"—";
  $("statCategories").textContent=categories.count??"—";
}

function statusBadge(status) {
  return '<span class="admin-status '+esc(status)+'">'+esc(status.replaceAll("_"," "))+'</span>';
}

function renderProducts() {
  const filter=($("productFilter").value||"").trim().toLowerCase();
  const categories=new Map(state.categories.map((c)=>[c.id,c.name]));
  const types=new Map(state.types.map((t)=>[t.id,t.name]));
  const items=state.products.filter((p)=>(p.title+" "+p.slug).toLowerCase().includes(filter));
  $("productRows").innerHTML=items.length?items.map((p)=>
    '<tr><td><strong>'+esc(p.title)+'</strong><small>'+esc(types.get(p.product_type_id)||"Jenis tidak diketahui")+' · '+esc(p.slug)+'</small></td>'+
    '<td>'+esc(categories.get(p.category_id)||"—")+'</td><td>'+money(p.price,p.currency)+'</td><td>'+statusBadge(p.status)+'</td>'+
    '<td><button data-edit-product="'+p.id+'">Edit</button>'+
    (p.status==="published"?'<button data-product-status="'+p.id+'" data-next-status="archived">Arsipkan</button>':
    p.status==="archived"?'<button data-product-status="'+p.id+'" data-next-status="draft">Pulihkan</button>':
    '<button data-product-status="'+p.id+'" data-next-status="published">Terbitkan</button>')+
    '</td></tr>'
  ).join(""):'<tr><td colspan="5">Belum ada produk. Tambahkan produk pertama untuk mulai membangun katalog.</td></tr>';
}

function renderTaxonomy() {
  const activeTypes=state.types.filter((t)=>t.is_active);
  const activeCats=state.categories.filter((c)=>c.is_active);
  $("productType").innerHTML=activeTypes.map((t)=>'<option value="'+t.id+'">'+esc(t.name)+'</option>').join("");
  $("mappingType").innerHTML=activeTypes.map((t)=>'<option value="'+t.id+'">'+esc(t.name)+'</option>').join("");
  $("mappingCategory").innerHTML=activeCats.map((c)=>'<option value="'+c.id+'">'+esc(c.name)+'</option>').join("");
  updateProductCategories();
  const typeNames=new Map(state.types.map((t)=>[t.id,t.name]));
  const catNames=new Map(state.categories.map((c)=>[c.id,c.name]));
  $("categoryRows").innerHTML=state.categories.map((c)=>
    '<tr><td><strong>'+esc(c.name)+'</strong><small>'+esc(c.description)+'</small></td><td>'+esc(c.slug)+'</td><td>'+statusBadge(c.is_active?"active":"inactive")+'</td><td><button data-category-toggle="'+c.id+'" data-active="'+c.is_active+'">'+(c.is_active?"Nonaktifkan":"Aktifkan")+'</button></td></tr>'
  ).join("")||'<tr><td colspan="4">Belum ada kategori.</td></tr>';
  $("typeRows").innerHTML=state.types.map((t)=>
    '<tr><td><strong>'+esc(t.name)+'</strong><small>'+esc(t.description)+'</small></td><td>'+esc(t.slug)+'</td><td>'+statusBadge(t.is_active?"active":"inactive")+'</td><td><button data-type-toggle="'+t.id+'" data-active="'+t.is_active+'">'+(t.is_active?"Nonaktifkan":"Aktifkan")+'</button></td></tr>'
  ).join("")||'<tr><td colspan="4">Belum ada jenis produk.</td></tr>';
  $("mappingRows").innerHTML=state.mappings.map((m)=>
    '<tr><td>'+esc(typeNames.get(m.product_type_id)||"—")+'</td><td>'+esc(catNames.get(m.category_id)||"—")+'</td><td><button data-remove-mapping="'+m.product_type_id+'" data-category-id="'+m.category_id+'">Hapus hubungan</button></td></tr>'
  ).join("")||'<tr><td colspan="3">Belum ada pemetaan.</td></tr>';
}

function updateProductCategories() {
  const typeId=$("productType").value;
  const allowed=new Set(state.mappings.filter((m)=>m.product_type_id===typeId).map((m)=>m.category_id));
  const cats=state.categories.filter((c)=>c.is_active&&allowed.has(c.id));
  const current=$("productCategory").value;
  $("productCategory").innerHTML=cats.map((c)=>'<option value="'+c.id+'">'+esc(c.name)+'</option>').join("");
  if(cats.some((c)=>c.id===current)) $("productCategory").value=current;
  if(!cats.length) $("productCategory").innerHTML='<option value="">Hubungkan jenis dan kategori terlebih dahulu</option>';
}
$("productType").addEventListener("change",updateProductCategories);

function openProductForm(product=null) {
  state.editingProduct=product;
  $("productForm").hidden=false;
  $("productFormTitle").textContent=product?"Edit produk":"Tambah produk";
  $("productId").value=product?.id||"";
  $("productSlug").dataset.edited = "";
  $("productTitle").value=product?.title||"";
  $("productSlug").value=product?.slug||"";
  $("productDescription").value=product?.description||"";
  $("productPrice").value=product?.price??0;
  $("productStatus").value=product?.status||"draft";
  if(product){
    $("productType").value=product.product_type_id;
    updateProductCategories();
    $("productCategory").value=product.category_id;
  }else{
    updateProductCategories();
  }
  $("productCover").value="";
  $("productFile").value="";
  $("productForm").scrollIntoView({behavior:"smooth",block:"start"});
}
$("newProduct").addEventListener("click",()=>openProductForm());
$("cancelProduct").addEventListener("click",()=>{$("productForm").hidden=true;state.editingProduct=null;});

function safeFileName(name) {
  return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/^-+|-+$/g,"").slice(-180)||"digital-file";
}

async function replaceCover(product,file) {
  if(!file) return;
  const allowed=["image/jpeg","image/png","image/webp","image/avif"];
  if(!allowed.includes(file.type)||file.size>10*1024*1024) throw new Error("Sampul harus JPG, PNG, WebP, atau AVIF dan maksimal 10 MB.");
  const path=product.seller_id+"/"+product.id+"/"+crypto.randomUUID()+"-"+safeFileName(file.name);
  const upload=await supabase.storage.from("product-assets").upload(path,file,{contentType:file.type,upsert:false});
  if(upload.error) throw upload.error;
  const old=await supabase.from("product_assets").select("id,asset_path").eq("product_id",product.id).eq("asset_kind","cover").maybeSingle();
  if(old.error){await supabase.storage.from("product-assets").remove([path]);throw old.error;}
  if(old.data){
    const del=await supabase.from("product_assets").delete().eq("id",old.data.id);
    if(del.error){await supabase.storage.from("product-assets").remove([path]);throw del.error;}
  }
  const insert=await supabase.from("product_assets").insert({product_id:product.id,asset_path:path,asset_kind:"cover",alt_text:product.title,sort_order:0});
  if(insert.error){await supabase.storage.from("product-assets").remove([path]);throw insert.error;}
  if(old.data) await supabase.storage.from("product-assets").remove([old.data.asset_path]);
}

async function replaceDigitalFile(product,file) {
  if(!file) return;
  const allowed=["application/pdf","application/epub+zip","application/zip","application/x-zip-compressed","application/x-7z-compressed","application/octet-stream","application/vnd.android.package-archive","application/vnd.microsoft.portable-executable","video/mp4","audio/mpeg"];
  if(!allowed.includes(file.type)||file.size<=0||file.size>500*1024*1024) throw new Error("File tidak sesuai allowlist atau melebihi batas 500 MB.");
  const path=currentUser.id+"/"+product.id+"/"+crypto.randomUUID()+"-"+safeFileName(file.name);
  const upload=await supabase.storage.from("product-files").upload(path,file,{contentType:file.type,upsert:false});
  if(upload.error) throw upload.error;
  const old=await supabase.from("product_files").select("id,object_path").eq("product_id",product.id).eq("is_primary",true).maybeSingle();
  if(old.error){await supabase.storage.from("product-files").remove([path]);throw old.error;}
  if(old.data){
    const del=await supabase.from("product_files").delete().eq("id",old.data.id);
    if(del.error){await supabase.storage.from("product-files").remove([path]);throw del.error;}
  }
  const insert=await supabase.from("product_files").insert({product_id:product.id,object_path:path,file_name:file.name.slice(0,255),mime_type:file.type,size_bytes:file.size,version:1,is_primary:true});
  if(insert.error){await supabase.storage.from("product-files").remove([path]);throw insert.error;}
  if(old.data) await supabase.storage.from("product-files").remove([old.data.object_path]);
}

$("productForm").addEventListener("submit",async(event)=>{
  event.preventDefault();
  const button=$("saveProduct");
  button.disabled=true;button.textContent="Menyimpan...";
  try{
    const title=$("productTitle").value.trim();
    const typeId=$("productType").value;
    const categoryId=$("productCategory").value;
    if(!typeId||!categoryId) throw new Error("Jenis produk dan kategori harus memiliki pemetaan aktif.");
    const payload={product_type_id:typeId,category_id:categoryId,title,slug:slugify($("productSlug").value||title),description:$("productDescription").value.trim(),price:Number($("productPrice").value),currency:"IDR",status:$("productStatus").value};
    if(!Number.isFinite(payload.price)||payload.price<0) throw new Error("Harga tidak valid.");
    let saved;
    if($("productId").value){
      const result=await supabase.from("products").update(payload).eq("id",$("productId").value).select().single();
      if(result.error) throw result.error;
      saved=result.data;
    }else{
      const result=await supabase.from("products").insert({...payload,seller_id:currentUser.id}).select().single();
      if(result.error) throw result.error;
      saved=result.data;
    }
    await replaceCover(saved,$("productCover").files[0]);
    await replaceDigitalFile(saved,$("productFile").files[0]);
    $("productForm").hidden=true;
    state.editingProduct=null;
    await Promise.all([loadProducts(),loadOverview()]);
    notify("Produk berhasil disimpan.");
  }catch(error){notify(error.message||"Produk gagal disimpan.");}
  finally{button.disabled=false;button.textContent="Simpan produk";}
});

$("productTitle").addEventListener("input",()=>{if(!$("productId").value||!$("productSlug").dataset.edited)$("productSlug").value=slugify($("productTitle").value);});
$("productSlug").addEventListener("input",()=>{$("productSlug").dataset.edited="true";});
$("productFilter").addEventListener("input",renderProducts);
$("productRows").addEventListener("click",async(event)=>{
  const edit=event.target.closest("[data-edit-product]");
  const status=event.target.closest("[data-product-status]");
  if(edit){openProductForm(state.products.find((p)=>p.id===edit.dataset.editProduct));return;}
  if(status){
    const result=await supabase.from("products").update({status:status.dataset.nextStatus}).eq("id",status.dataset.productStatus);
    if(result.error){notify(result.error.message);return;}
    await Promise.all([loadProducts(),loadOverview()]);
    notify("Status produk diperbarui.");
  }
});

$("categoryForm").addEventListener("submit",async(event)=>{
  event.preventDefault();
  const name=$("categoryName").value.trim();
  const result=await supabase.from("categories").insert({name,slug:slugify(name),description:$("categoryDescription").value.trim(),is_active:true});
  if(result.error){notify(result.error.message);return;}
  $("categoryForm").reset();
  await Promise.all([loadTaxonomy(),loadOverview()]);
  notify("Kategori ditambahkan.");
});
$("categoryRows").addEventListener("click",async(event)=>{
  const button=event.target.closest("[data-category-toggle]");
  if(!button)return;
  const result=await supabase.from("categories").update({is_active:button.dataset.active!=="true"}).eq("id",button.dataset.categoryToggle);
  if(result.error){notify(result.error.message);return;}
  await Promise.all([loadTaxonomy(),loadOverview()]);
  notify("Status kategori diperbarui.");
});

$("typeForm").addEventListener("submit",async(event)=>{
  event.preventDefault();
  const name=$("typeName").value.trim();
  const result=await supabase.from("product_types").insert({name,slug:slugify(name),description:$("typeDescription").value.trim(),is_active:true});
  if(result.error){notify(result.error.message);return;}
  $("typeForm").reset();
  await loadTaxonomy();
  notify("Jenis produk ditambahkan.");
});
$("typeRows").addEventListener("click",async(event)=>{
  const button=event.target.closest("[data-type-toggle]");
  if(!button)return;
  const result=await supabase.from("product_types").update({is_active:button.dataset.active!=="true"}).eq("id",button.dataset.typeToggle);
  if(result.error){notify(result.error.message);return;}
  await loadTaxonomy();
  notify("Status jenis produk diperbarui.");
});
$("mappingForm").addEventListener("submit",async(event)=>{
  event.preventDefault();
  const result=await supabase.from("product_type_categories").insert({product_type_id:$("mappingType").value,category_id:$("mappingCategory").value});
  if(result.error){notify(result.error.message);return;}
  await loadTaxonomy();notify("Pemetaan kategori ditambahkan.");
});
$("mappingRows").addEventListener("click",async(event)=>{
  const button=event.target.closest("[data-remove-mapping]");
  if(!button)return;
  if(!window.confirm("Hapus hubungan jenis dan kategori ini? Produk yang masih menggunakan hubungan tersebut dapat mencegah penghapusan."))return;
  const result=await supabase.from("product_type_categories").delete().eq("product_type_id",button.dataset.removeMapping).eq("category_id",button.dataset.categoryId);
  if(result.error){notify(result.error.message);return;}
  await loadTaxonomy();notify("Pemetaan dihapus.");
});

async function loadReviews(){
  $("reviewRows").innerHTML='<tr><td colspan="5">Memuat antrean...</td></tr>';
  const {data,error}=await supabase.from("product_revisions").select("id,product_id,seller_id,proposed_title,proposed_slug,proposed_description,proposed_price,proposed_currency,seller_note,status,created_at").eq("status","pending_review").order("created_at",{ascending:true});
  if(error){$("reviewRows").innerHTML='<tr><td colspan="5">'+esc(error.message)+'</td></tr>';return;}
  state.revisions=data||[];
  const productIds=[...new Set(state.revisions.map((r)=>r.product_id))];
  const sellerIds=[...new Set(state.revisions.map((r)=>r.seller_id))];
  const [products,profiles]=await Promise.all([
    productIds.length?supabase.from("products").select("id,title").in("id",productIds):Promise.resolve({data:[]}),
    sellerIds.length?supabase.from("profiles").select("id,display_name").in("id",sellerIds):Promise.resolve({data:[]}),
  ]);
  const pmap=new Map((products.data||[]).map((p)=>[p.id,p.title]));
  const smap=new Map((profiles.data||[]).map((p)=>[p.id,p.display_name]));
  $("reviewRows").innerHTML=state.revisions.length?state.revisions.map((r)=>
    '<tr><td><strong>'+esc(pmap.get(r.product_id)||"Produk")+'</strong><small>Usulan: '+esc(r.proposed_title)+' · '+esc(r.proposed_slug)+'</small></td>'+
    '<td>'+esc(smap.get(r.seller_id)||"Kreator")+'</td><td>'+money(r.proposed_price,r.proposed_currency)+'</td>'+
    '<td><input class="admin-review-note" data-review-note="'+r.id+'" maxlength="2000" placeholder="Catatan, wajib jika ditolak"></td>'+
    '<td><button data-review="'+r.id+'" data-decision="approved">Setujui</button><button data-review="'+r.id+'" data-decision="rejected">Tolak</button></td></tr>'
  ).join(""):'<tr><td colspan="5">Tidak ada revisi yang menunggu persetujuan.</td></tr>';
}
$("reviewRows").addEventListener("click",async(event)=>{
  const button=event.target.closest("[data-review]");
  if(!button)return;
  const revision=state.revisions.find((r)=>r.id===button.dataset.review);
  const note=document.querySelector('[data-review-note="'+button.dataset.review+'"]').value.trim();
  if(button.dataset.decision==="rejected"&&!note){notify("Catatan wajib diisi saat menolak revisi.");return;}
  const result=await supabase.from("product_revisions").update({status:button.dataset.decision,review_note:note||null}).eq("id",button.dataset.review);
  if(result.error){notify(result.error.message);return;}
  await Promise.all([loadReviews(),loadProducts(),loadOverview()]);
  notify(button.dataset.decision==="approved"?"Revisi disetujui.":"Revisi ditolak.");
});
$("refreshReviews").addEventListener("click",loadReviews);

async function loadUsers(){
  $("userRows").innerHTML='<tr><td colspan="5">Memuat akun pengguna...</td></tr>';
  const {data,error}=await supabase.functions.invoke("gicomm-admin",{body:{action:"list_users"}});
  if(error){$("userRows").innerHTML='<tr><td colspan="5">Layanan manajemen pengguna belum tersedia. Pastikan Edge Function gicomm-admin sudah dideploy.</td></tr>';notify(error.message);return;}
  state.users=data?.users||[];
  $("userRows").innerHTML=state.users.map((user)=>{
    const role=user.role==="admin"?"admin":"member";
    const created=user.created_at?new Date(user.created_at).toLocaleDateString("id-ID"):"—";
    const last=user.last_sign_in_at?new Date(user.last_sign_in_at).toLocaleString("id-ID"):"Belum pernah";
    return '<tr><td><strong>'+esc(user.email||"Tanpa email")+'</strong><small>'+esc(user.id)+'</small></td><td>'+created+'</td><td>'+last+'</td><td>'+statusBadge(role)+'</td><td>'+
      (user.id===currentUser.id?'<small>Admin yang sedang digunakan</small>':'<select data-user-role="'+user.id+'"><option value="member" '+(role==="member"?"selected":"")+'>Member</option><option value="admin" '+(role==="admin"?"selected":"")+'>Admin</option></select><button data-save-role="'+user.id+'">Simpan role</button>')+
      '</td></tr>';
  }).join("")||'<tr><td colspan="5">Belum ada akun.</td></tr>';
}
$("refreshUsers").addEventListener("click",loadUsers);
$("userRows").addEventListener("click",async(event)=>{
  const button=event.target.closest("[data-save-role]");
  if(!button)return;
  const select=document.querySelector('[data-user-role="'+button.dataset.saveRole+'"]');
  const result=await supabase.functions.invoke("gicomm-admin",{body:{action:"set_role",user_id:button.dataset.saveRole,role:select.value}});
  if(result.error){notify(result.error.message);return;}
  if(result.data?.error){notify(result.data.error);return;}
  await loadUsers();notify("Role pengguna berhasil diperbarui. Pengguna mungkin perlu masuk ulang agar token diperbarui.");
});

$("adminLogout").addEventListener("click",async()=>{
  $("adminLogout").disabled=true;
  try{await signOut();window.location.replace("index.html");}
  catch(error){$("adminLogout").disabled=false;notify(error.message||"Tidak dapat keluar.");}
});

async function boot(){
  try{
    await Promise.all([loadProducts(),loadTaxonomy(),loadOverview()]);
    notice("Mode Admin aktif. Semua perubahan katalog mengikuti kebijakan RLS Supabase.");
  }catch(error){notice("Sebagian data admin gagal dimuat: "+(error.message||"Unknown error"));}
}
await boot();
