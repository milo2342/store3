let searchTerm="",sortOrder="default",subscriptionFilter=false,spotlightIndex=0,selectedDetails=null,previousCartFocus=null;
const iconMarkup=name=>`<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;

function allPackages(){
  const seen=new Set();
  return cats.flatMap(category=>category.packages||[]).filter(product=>{
    const id=Number(product.id);
    if(!Number.isSafeInteger(id)||id<=0||seen.has(id))return false;
    seen.add(id);return true;
  });
}
function packageCategory(product){return cats.find(category=>category.packages.some(item=>Number(item.id)===Number(product.id)))?.name||"Package"}
function packageInCategory(product,name){return cats.some(category=>category.name===name&&category.packages.some(item=>Number(item.id)===Number(product.id)))}
function packageImage(product){
  if(typeof product.image!=="string"||!product.image)return "";
  try{const url=new URL(product.image,location.href);return ["https:","http:"].includes(url.protocol)?url.href:""}catch(error){return ""}
}
function packageMedia(product){
  const image=packageImage(product),initials=String(product.name||"WCRP").split(/\s+/).map(word=>word[0]).join("").slice(0,3);
  return `<span class="media-mark" aria-hidden="true">${esc(initials)}</span>${image?`<img src="${esc(image)}" alt="" loading="lazy" decoding="async">`:""}`;
}
function packageCard(product){
  const cost=price(product),id=Number(product.id);
  return `<article class="card"><button class="product-media" data-product="${id}" aria-label="View ${esc(product.name)}">${packageMedia(product)}${product.type==="subscription"?'<span class="badge media-tag">Subscription</span>':""}</button><div class="card-body"><h3><button class="product-title" data-product="${id}">${esc(product.name)}</button></h3><p class="product-description">${esc(strip(product.description)||"Explore this package and review its details before checkout.")}</p><div class="product-meta"><span class="category-tag">${esc(packageCategory(product))}</span><span class="product-price">${money(cost.v,cost.c)}</span></div><div class="product-bottom"><button class="x text-link" data-product="${id}">View details ${iconMarkup("arrow")}</button><button class="add" data-id="${id}" aria-label="Add ${esc(product.name)} to cart" ${cartBusy?"disabled":""}>Add to cart</button></div></div></article>`;
}
function emptyState(title,message,link="#store",label="Browse the store"){
  return `<div class="empty-state">${iconMarkup("box")}<h2>${esc(title)}</h2><p>${esc(message)}</p><a class="btn ghost" href="${link}">${label}</a></div>`;
}
function renderCatalog(){
  const products=allPackages(),names=["All",...new Set(cats.map(category=>category.name))];
  $("chips").innerHTML=names.map(name=>{
    const count=name==="All"?products.length:products.filter(product=>packageInCategory(product,name)).length;
    return `<button class="chip" aria-pressed="${name===cat}" data-c="${esc(name)}">${esc(name)}<span class="chip-count">${count}</span></button>`;
  }).join("");
  const matches=products.filter(product=>(cat==="All"||packageInCategory(product,cat))&&(!subscriptionFilter||product.type==="subscription")&&`${product.name} ${strip(product.description)} ${packageCategory(product)}`.toLowerCase().includes(searchTerm));
  if(sortOrder==="price-asc")matches.sort((first,second)=>price(first).v-price(second).v);
  if(sortOrder==="price-desc")matches.sort((first,second)=>price(second).v-price(first).v);
  if(sortOrder==="name")matches.sort((first,second)=>String(first.name).localeCompare(String(second.name)));
  $("catalogSummary").textContent=`Browse our collection of ${products.length} ${products.length===1?"package":"packages"}.`;
  $("resultCount").textContent=`Showing ${matches.length} of ${products.length} packages`;
  $("grid").innerHTML=matches.map(packageCard).join("")||(products.length?`<div class="empty-state">${iconMarkup("search")}<h2>No matching packages</h2><p>Try a different search or reset your filters.</p><button class="btn ghost" data-reset>Reset filters</button></div>`:emptyState("The collection is on its way","No packages are currently available from this store.","#home","Back to home"));
  document.querySelectorAll("[data-collection]").forEach(button=>button.setAttribute("aria-pressed",String((button.dataset.collection==="subscriptions")===subscriptionFilter)));
}
function renderSpotlight(){
  const products=allPackages();
  if(!products.length){$("spotlight").innerHTML=emptyState("Your next upgrade starts here","Visit the directory when new packages become available.");return}
  spotlightIndex=((spotlightIndex%products.length)+products.length)%products.length;
  const product=products[spotlightIndex],cost=price(product);
  $("spotlight").innerHTML=`<div class="spotlight-media">${packageMedia(product)}</div>${products.length>1?`<div class="spotlight-controls"><button class="icon-button" data-slide="-1" aria-label="Previous package">${iconMarkup("left")}</button><span class="spotlight-count">${spotlightIndex+1} / ${products.length}</span><button class="icon-button" data-slide="1" aria-label="Next package">${iconMarkup("right")}</button></div>`:""}<div class="spotlight-content"><div><div class="eyebrow">${esc(packageCategory(product))}</div><h2>${esc(product.name)}</h2><p>${esc(strip(product.description).slice(0,160))}</p></div><button class="btn" data-product="${Number(product.id)}">View package · ${money(cost.v,cost.c)} ${iconMarkup("arrow")}</button></div>`;
}
function renderSubscriptions(){
  const subscriptions=allPackages().filter(product=>product.type==="subscription");
  $("planGrid").innerHTML=subscriptions.map(product=>{
    const cost=price(product);
    return `<article class="plan-card"><span class="badge">${iconMarkup("crown")}Subscription</span><h3>${esc(product.name)}</h3><p class="plan-description">${esc(strip(product.description)||"Review this package's complete details and subscription terms before checkout.")}</p><div class="plan-price">${money(cost.v,cost.c)}</div><p class="plan-billing">Recurring package. Billing terms shown at checkout.</p><button class="btn" data-id="${Number(product.id)}" ${cartBusy?"disabled":""}>Choose this package ${iconMarkup("arrow")}</button><button class="x text-link" data-product="${Number(product.id)}">View package details</button></article>`;
  }).join("")||emptyState("No subscriptions right now","There are no recurring packages in the current collection. You can still explore individual packages.");
}
function renderCollection(){
  const products=allPackages();
  renderCatalog();renderSubscriptions();renderSpotlight();
  const individual=products.filter(product=>product.type!=="subscription");
  $("featuredGrid").innerHTML=(individual.length?individual:products).slice(0,4).map(packageCard).join("")||emptyState("New packages are on the way","The live collection is currently empty.");
  const images=products.map(packageImage).filter(Boolean);
  if(images.length)$("heroArt").innerHTML=Array.from({length:4},(_,index)=>`<div class="hero-panel"><img src="${esc(images[index%images.length])}" alt="" ${index===0?'fetchpriority="high"':'loading="lazy"'}></div>`).join("");
  const subscription=products.find(product=>product.type==="subscription");
  if(subscription){
    $("promoLabel").textContent="Subscription";$("promoTitle").textContent=subscription.name;
    $("promoDescription").textContent=strip(subscription.description).slice(0,170)||"Explore this recurring package and review what's included.";
    $("promoLink").href="#subscriptions";$("promoLink").innerHTML=`Explore subscriptions ${iconMarkup("arrow")}`;
  }
}
function renderStoreError(message){
  const error=`<div class="empty-state">${iconMarkup("box")}<h2>The collection couldn't load</h2><p>${esc(message)}</p><button class="btn ghost" data-retry>Try again</button></div>`;
  ["grid","featuredGrid","planGrid","spotlight"].forEach(id=>{$(id).innerHTML=error});
  $("catalogSummary").textContent="The store is temporarily unavailable.";$("resultCount").textContent="Unable to load packages";
}
function showDetails(id){
  const product=allPackages().find(product=>Number(product.id)===id);
  if(!product)return;
  selectedDetails=product;
  $("detailMedia").innerHTML=packageMedia(product);$("detailCategory").textContent=packageCategory(product);
  $("detailTitle").textContent=product.name;$("detailDescription").textContent=strip(product.description)||"No additional description is available for this package.";
  const cost=price(product);$("detailPrice").textContent=money(cost.v,cost.c);
  $("detailNote").textContent=product.type==="subscription"?"Recurring package. Review the full billing terms on Tebex before confirming.":"Secure payment through Tebex. Review the package requirements before confirming.";
  $("productDialog").showModal();
}
function showCart(){
  if($("productDialog").open)$("productDialog").close();
  if(!$("drawer").classList.contains("open"))previousCartFocus=document.activeElement;
  $("drawer").inert=false;$("drawer").setAttribute("aria-hidden","false");$("drawer").classList.add("open");
  $("cartBackdrop").hidden=false;$("mainContent").inert=true;$("siteHeader").inert=true;$("closeBtn").focus();
}
function closeCart(){
  $("drawer").classList.remove("open");$("drawer").setAttribute("aria-hidden","true");$("drawer").inert=true;
  $("cartBackdrop").hidden=true;$("mainContent").inert=false;$("siteHeader").inert=false;
  (previousCartFocus?.isConnected?previousCartFocus:$("accountBtn")).focus();
}
function renderRoute(focusHeading=false){
  if(location.hash==="#mainContent")return;
  const requested=location.hash.slice(1),page=requested==="shop"?"store":["home","store","subscriptions"].includes(requested)?requested:"home";
  document.querySelectorAll("[data-view]").forEach(view=>{view.hidden=view.dataset.view!==page});
  document.querySelectorAll("[data-page]").forEach(link=>{
    if(link.dataset.page===page)link.setAttribute("aria-current","page");else link.removeAttribute("aria-current");
  });
  document.title=(page==="home"?"":page==="store"?"Store · ":"Subscriptions · ")+S.name;
  if(focusHeading){window.scrollTo({top:0,behavior:"instant"});document.querySelector(`[data-view="${page}"] h1`)?.focus({preventScroll:true})}
}
document.addEventListener("DOMContentLoaded",()=>{
  renderRoute();window.addEventListener("hashchange",()=>renderRoute(true));
  $("searchInput").addEventListener("input",event=>{searchTerm=event.target.value.toLowerCase().trim();renderCatalog()});
  $("sortSelect").addEventListener("change",event=>{sortOrder=event.target.value;renderCatalog()});
  $("heroSignIn").onclick=openCart;$("cartBackdrop").onclick=closeCart;$("detailClose").onclick=()=>$("productDialog").close();
  $("detailAdd").onclick=()=>{if(!selectedDetails||cartBusy)return;const id=Number(selectedDetails.id);$("productDialog").close();addToCart(id)};
  $("productDialog").addEventListener("click",event=>{
    if(event.target!==$("productDialog"))return;
    const bounds=$("productDialog").getBoundingClientRect();
    if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)$("productDialog").close();
  });
  document.addEventListener("click",event=>{
    const button=event.target.closest("button");if(!button||button.disabled)return;
    if(button.dataset.id)addToCart(Number(button.dataset.id));
    else if(button.dataset.product)showDetails(Number(button.dataset.product));
    else if(button.dataset.c){cat=button.dataset.c;renderCatalog();[...$("chips").querySelectorAll("[data-c]")].find(chip=>chip.dataset.c===cat)?.focus({preventScroll:true})}
    else if(button.dataset.collection){subscriptionFilter=button.dataset.collection==="subscriptions";cat="All";renderCatalog()}
    else if(button.dataset.slide){spotlightIndex+=Number(button.dataset.slide);renderSpotlight();$("spotlight").querySelector(`[data-slide="${button.dataset.slide}"]`)?.focus({preventScroll:true})}
    else if(button.hasAttribute("data-reset")){searchTerm="";cat="All";subscriptionFilter=false;sortOrder="default";$("searchInput").value="";$("sortSelect").value="default";renderCatalog();$("searchInput").focus()}
    else if(button.hasAttribute("data-retry")){button.disabled=true;loadStore()}
  });
  document.addEventListener("keydown",event=>{
    if(!$("drawer").classList.contains("open"))return;
    if(event.key==="Escape"){event.preventDefault();closeCart();return}
    if(event.key!=="Tab")return;
    const buttons=[...$("drawer").querySelectorAll('button:not(:disabled), a[href], [tabindex="0"]')].filter(element=>element.getClientRects().length);
    const first=buttons[0],last=buttons[buttons.length-1];
    if(event.shiftKey&&(document.activeElement===first||!$("drawer").contains(document.activeElement))){event.preventDefault();last?.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
  });
  document.addEventListener("error",event=>{
    if(event.target instanceof HTMLImageElement){event.target.hidden=true;if(event.target.parentElement.classList.contains("hero-panel"))event.target.parentElement.classList.add("fallback")}
  },true);
  document.querySelectorAll("#support, [data-support]").forEach(link=>{
    try{const url=new URL(S.supportUrl);if(url.protocol==="https:"&&!url.href.includes("yourinvite")){link.href=url.href;link.hidden=false;link.target="_blank";link.rel="noopener noreferrer"}}catch(error){}
  });
  $("footerName").textContent=S.name;
});
