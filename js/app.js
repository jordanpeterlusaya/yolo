let properties = [];
let whatsapp = "25475035540";
let currentModalId = null;
let savedIds = JSON.parse(localStorage.getItem("yolo_saved") || "[]");
let currentView = localStorage.getItem("yolo_view") || "grid";

const typeLabels = {
  house: "House", apartment: "Apartment", room: "Room",
  land: "Land", commercial: "Commercial"
};

function listingLabel(type) {
  return type === "rent" ? "For Rent" : "For Buy";
}

async function init() {
  showSkeleton(true);
  try {
    const [props, config] = await Promise.all([
      fetch("/api/properties").then(r => r.json()),
      fetch("/api/config").then(r => r.json())
    ]);
    properties = props;
    whatsapp = config.whatsapp;
    renderHeroStats();
    renderFeatured();
    applyFilters();
    renderSaved();
    updateSavedUI();
    checkHashProperty();
  } finally {
    showSkeleton(false);
  }
}

function showSkeleton(on) {
  document.getElementById("skeleton").classList.toggle("hidden", !on);
  document.getElementById("grid").classList.toggle("hidden", on);
}

function formatPrice(p, listing) {
  const formatted = "TZS " + p.toLocaleString();
  return listing === "rent" ? formatted + "/mo" : formatted;
}

function escapeHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
}

function renderHeroStats() {
  const cities = new Set(properties.map(p => p.city)).size;
  const rent = properties.filter(p => p.listingType === "rent").length;
  const sale = properties.filter(p => p.listingType === "sale").length;
  document.getElementById("heroStats").innerHTML = `
    <div class="stat"><strong>${properties.length}</strong><span>Listings</span></div>
    <div class="stat"><strong>${cities}</strong><span>Cities</span></div>
    <div class="stat"><strong>${rent}</strong><span>For Rent</span></div>
    <div class="stat"><strong>${sale}</strong><span>For Buy</span></div>
  `;
}

function renderFeatured() {
  const featured = properties.filter(p => p.featured);
  const section = document.getElementById("featured");
  const grid = document.getElementById("featuredGrid");
  if (!featured.length) { section.classList.add("hidden"); return; }
  section.classList.remove("hidden");
  grid.innerHTML = featured.map(p => cardHtml(p, true)).join("");
}

function specsCards(p) {
  const items = [];
  if (p.bedrooms > 0) items.push(["Bedrooms", p.bedrooms]);
  if (p.bathrooms > 0) items.push(["Bathrooms", p.bathrooms]);
  if (p.area > 0) items.push(["Area", p.area.toLocaleString() + " sqft"]);
  items.push(["City", p.city]);
  return items.map(([k, v]) => `<div class="spec-item"><b>${v}</b>${k}</div>`).join("");
}

function isSaved(id) { return savedIds.includes(id); }

function cardHtml(p, compact) {
  const saved = isSaved(p.id);
  return `
    <article class="card ${compact ? "card-compact" : ""}" data-id="${p.id}">
      <div class="card-image">
        <img src="${p.image}" alt="${escapeHtml(p.title)}" loading="lazy">
        <span class="card-tag">${listingLabel(p.listingType)}</span>
        ${p.featured ? '<span class="card-featured">Featured</span>' : ""}
        <button class="card-save ${saved ? "saved" : ""}" onclick="event.stopPropagation(); toggleSave('${p.id}')" aria-label="Save">${saved ? "♥" : "♡"}</button>
      </div>
      <div class="card-body">
        <span class="badge">${typeLabels[p.propertyType]}</span>
        <h3>${escapeHtml(p.title)}</h3>
        <p class="location">${escapeHtml(p.location)}</p>
        ${compact ? "" : `<div class="specs-row">${specsCards(p)}</div>`}
        <p class="price">${formatPrice(p.price, p.listingType)} <small>${p.listingType === "rent" ? "per month" : "to buy"}</small></p>
        <button class="btn btn-view" onclick="openModal('${p.id}')">Explore Property</button>
      </div>
    </article>
  `;
}

function sortList(list) {
  const sort = document.getElementById("sortBy").value;
  const sorted = [...list];
  if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
  else if (sort === "name") sorted.sort((a, b) => a.title.localeCompare(b.title));
  else sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return sorted;
}

function getFilteredList() {
  const q = document.getElementById("search").value.toLowerCase().trim();
  const type = document.getElementById("filterType").value;
  const listing = document.getElementById("filterListing").value;
  const min = Number(document.getElementById("minPrice").value) || 0;
  const max = Number(document.getElementById("maxPrice").value) || Infinity;

  return sortList(properties.filter(p => {
    if (q && !p.title.toLowerCase().includes(q) && !p.location.toLowerCase().includes(q) && !p.city.toLowerCase().includes(q)) return false;
    if (type && p.propertyType !== type) return false;
    if (listing && p.listingType !== listing) return false;
    if (p.price < min || p.price > max) return false;
    return true;
  }));
}

function renderActiveFilters() {
  const el = document.getElementById("activeFilters");
  const chips = [];
  const q = document.getElementById("search").value.trim();
  const type = document.getElementById("filterType").value;
  const listing = document.getElementById("filterListing").value;
  const min = document.getElementById("minPrice").value;
  const max = document.getElementById("maxPrice").value;

  if (q) chips.push(`Search: ${q}`);
  if (type) chips.push(typeLabels[type]);
  if (listing) chips.push(listingLabel(listing));
  if (min) chips.push(`Min TZS ${Number(min).toLocaleString()}`);
  if (max) chips.push(`Max TZS ${Number(max).toLocaleString()}`);

  if (!chips.length) { el.classList.add("hidden"); el.innerHTML = ""; return; }
  el.classList.remove("hidden");
  el.innerHTML = chips.map(c => `<span class="filter-chip">${c}</span>`).join("") +
    `<button class="filter-clear" onclick="clearFilters()">Clear all</button>`;
}

function render(list) {
  const grid = document.getElementById("grid");
  const empty = document.getElementById("empty");
  grid.className = currentView === "list" ? "grid grid-list" : "grid";

  document.getElementById("resultCount").textContent =
    list.length === 1 ? "1 property found" : `${list.length} properties found`;

  if (!list.length) {
    grid.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");
  grid.innerHTML = list.map(p => cardHtml(p, false)).join("");
}

function applyFilters() {
  renderActiveFilters();
  render(getFilteredList());
}

function filterByType(type) {
  document.getElementById("filterType").value = type;
  document.querySelectorAll(".cat-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.type === type || (!type && btn.classList.contains("cat-btn-all")));
  });
  applyFilters();
  document.getElementById("properties").scrollIntoView({ behavior: "smooth" });
}

function clearFilters() {
  document.getElementById("search").value = "";
  const hero = document.getElementById("heroSearch");
  const mob = document.getElementById("mobileSearch");
  if (hero) hero.value = "";
  if (mob) mob.value = "";
  document.getElementById("filterType").value = "";
  document.getElementById("filterListing").value = "";
  document.getElementById("minPrice").value = "";
  document.getElementById("maxPrice").value = "";
  document.querySelectorAll(".cat-btn").forEach(btn => btn.classList.remove("active"));
  applyFilters();
}

function setView(view) {
  currentView = view;
  localStorage.setItem("yolo_view", view);
  document.querySelectorAll(".view-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
  applyFilters();
}

function toggleSave(id) {
  if (savedIds.includes(id)) {
    savedIds = savedIds.filter(x => x !== id);
    toast("Removed from saved");
  } else {
    savedIds.push(id);
    toast("Property saved");
  }
  localStorage.setItem("yolo_saved", JSON.stringify(savedIds));
  updateSavedUI();
  renderSaved();
  applyFilters();
  renderFeatured();
  updateScrollUI();
  if (currentModalId === id) {
    document.getElementById("modalSave").classList.toggle("saved", isSaved(id));
    document.getElementById("modalSave").textContent = isSaved(id) ? "♥" : "♡";
  }
}

function updateSavedUI() {
  const nav = document.getElementById("savedNav");
  const count = document.getElementById("savedCount");
  const badge = document.getElementById("bottomSavedBadge");
  if (savedIds.length) {
    nav.classList.remove("hidden");
    count.textContent = savedIds.length;
    badge?.classList.remove("hidden");
    if (badge) badge.textContent = savedIds.length;
  } else {
    nav.classList.add("hidden");
    badge?.classList.add("hidden");
  }
}

function heroSearchGo() {
  const heroInput = document.getElementById("heroSearch");
  const q = heroInput?.value.trim() || "";
  document.getElementById("search").value = q;
  if (mobileSearch) mobileSearch.value = q;
  applyFilters();
  document.getElementById("properties").scrollIntoView({ behavior: "smooth" });
}

function renderSaved() {
  const section = document.getElementById("saved");
  const grid = document.getElementById("savedGrid");
  const empty = document.getElementById("savedEmpty");
  const saved = properties.filter(p => savedIds.includes(p.id));

  if (!savedIds.length) { section.classList.add("hidden"); return; }
  section.classList.remove("hidden");

  if (!saved.length) {
    grid.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");
  grid.innerHTML = saved.map(p => cardHtml(p, false)).join("");
}

function openModal(id) {
  const p = properties.find(x => x.id === id);
  if (!p) return;
  currentModalId = id;
  history.replaceState(null, "", `#property-${id}`);

  document.getElementById("modalImg").src = p.image;
  document.getElementById("modalImg").alt = p.title;
  document.getElementById("modalBadge").textContent = `${listingLabel(p.listingType)} · ${typeLabels[p.propertyType]}`;
  document.getElementById("modalTitle").textContent = p.title;
  document.getElementById("modalLocation").textContent = p.location;
  document.getElementById("modalPrice").innerHTML = `${formatPrice(p.price, p.listingType)} <small>${p.listingType === "rent" ? "per month" : "to buy"}</small>`;

  const quick = [];
  if (p.bedrooms > 0) quick.push(`${p.bedrooms} Bed`);
  if (p.bathrooms > 0) quick.push(`${p.bathrooms} Bath`);
  if (p.area > 0) quick.push(`${p.area.toLocaleString()} sqft`);
  quick.push(p.city);
  document.getElementById("modalQuickSpecs").innerHTML = quick.map(s =>
    `<span class="modal-pill">${s}</span>`
  ).join("");

  const specs = [];
  if (p.bedrooms > 0) specs.push(["Bedrooms", p.bedrooms]);
  if (p.bathrooms > 0) specs.push(["Bathrooms", p.bathrooms]);
  if (p.area > 0) specs.push(["Area", p.area.toLocaleString() + " sqft"]);
  specs.push(["City", p.city], ["Type", typeLabels[p.propertyType]], ["Listing", listingLabel(p.listingType)]);

  document.getElementById("modalSpecs").innerHTML = specs.map(([k, v]) =>
    `<div class="spec-cell"><strong>${k}</strong><span>${v}</span></div>`
  ).join("");
  document.getElementById("modalDesc").textContent = p.description;

  const msg = encodeURIComponent(`Hi! I'm interested in "${p.title}" (${formatPrice(p.price, p.listingType)}) in ${p.location}. Please share more details.`);
  document.getElementById("modalWhatsapp").href = `https://wa.me/${whatsapp}?text=${msg}`;

  const saveBtn = document.getElementById("modalSave");
  saveBtn.classList.toggle("saved", isSaved(id));
  saveBtn.textContent = isSaved(id) ? "♥" : "♡";

  document.getElementById("modal").classList.add("open");
  document.body.style.overflow = "hidden";
  document.getElementById("bottomNav")?.classList.add("hidden");
  document.querySelector(".modal-close")?.focus();
}

function closeModal() {
  document.getElementById("modal").classList.remove("open");
  document.body.style.overflow = "";
  document.getElementById("bottomNav")?.classList.remove("hidden");
  currentModalId = null;
  history.replaceState(null, "", window.location.pathname);
}

function shareProperty() {
  const p = properties.find(x => x.id === currentModalId);
  if (!p) return;
  const text = `${p.title} — ${formatPrice(p.price, p.listingType)} at ${p.location}`;
  const url = `${window.location.origin}${window.location.pathname}#property-${p.id}`;
  if (navigator.share) {
    navigator.share({ title: p.title, text, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(`${text}\n${url}`);
    toast("Link copied to clipboard");
  }
}

function checkHashProperty() {
  const match = location.hash.match(/^#property-(.+)$/);
  if (match) openModal(match[1]);
}

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add("hidden"), 2500);
}

document.getElementById("modal").addEventListener("click", e => {
  if (e.target.id === "modal") closeModal();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && document.getElementById("modal").classList.contains("open")) {
    closeModal();
  }
});

document.getElementById("search").addEventListener("input", () => applyFilters());
document.getElementById("filterType").addEventListener("change", applyFilters);
document.getElementById("filterListing").addEventListener("change", applyFilters);

document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("mainNav").classList.toggle("open");
});

document.querySelectorAll("#mainNav a").forEach(link => {
  link.addEventListener("click", () => {
    document.getElementById("mainNav").classList.remove("open");
  });
});

const mobileSearch = document.getElementById("mobileSearch");
const mobileSearchSticky = document.getElementById("mobileSearchSticky");
const mainSearch = document.getElementById("search");

if (mobileSearch && mainSearch) {
  mobileSearch.addEventListener("input", () => {
    mainSearch.value = mobileSearch.value;
    applyFilters();
  });
  mainSearch.addEventListener("input", () => {
    mobileSearch.value = mainSearch.value;
  });
}

window.addEventListener("scroll", updateScrollUI);

function updateScrollUI() {
  const y = window.scrollY;
  document.getElementById("backTop")?.classList.toggle("hidden", y < 400);
  document.querySelector(".site-header")?.classList.toggle("scrolled", y > 20);
  if (mobileSearchSticky) {
    mobileSearchSticky.classList.toggle("visible", y > 350 && window.innerWidth <= 768);
  }
  updateBottomNav(y);
  updateHeaderNav(y);
}

function updateHeaderNav(scrollY) {
  if (window.innerWidth <= 768) return;
  document.querySelectorAll("#mainNav a:not(.nav-wa)").forEach(a => a.classList.remove("active"));

  const items = [
    { el: document.getElementById("saved"), sel: "#savedNav", needsSaved: true },
    { el: document.getElementById("properties"), sel: 'a[href="#properties"]' },
    { el: document.getElementById("how"), sel: 'a[href="#how"]' },
    { el: document.getElementById("featured"), sel: 'a[href="#featured"]', allowHidden: true },
  ].filter(s => s.el && (!s.el.classList.contains("hidden") || s.allowHidden) && (!s.needsSaved || savedIds.length));

  items.sort((a, b) => b.el.offsetTop - a.el.offsetTop);

  for (const sec of items) {
    if (scrollY >= sec.el.offsetTop - 140) {
      document.querySelector(`#mainNav ${sec.sel}`)?.classList.add("active");
      return;
    }
  }
}

function updateBottomNav(scrollY) {
  const items = document.querySelectorAll(".bottom-nav-item[data-nav]");
  if (!items.length) return;
  items.forEach(i => i.classList.remove("active"));
  const saved = document.getElementById("saved");
  const props = document.getElementById("properties");
  const savedTop = saved?.offsetTop || Infinity;
  const propsTop = props?.offsetTop || 0;

  if (scrollY >= savedTop - 120 && savedIds.length) {
    document.querySelector('[data-nav="saved"]')?.classList.add("active");
  } else if (scrollY >= propsTop - 120) {
    document.querySelector('[data-nav="search"]')?.classList.add("active");
  } else {
    document.querySelector('[data-nav="home"]')?.classList.add("active");
  }
}

document.querySelectorAll('.view-btn').forEach(btn => {
  btn.classList.toggle("active", btn.dataset.view === currentView);
});

window.addEventListener("resize", () => {
  if (window.innerWidth <= 768 && currentView === "list") {
    currentView = "grid";
    localStorage.setItem("yolo_view", "grid");
    applyFilters();
  }
  updateScrollUI();
});

document.querySelector('[data-nav="home"]')?.addEventListener("click", e => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.querySelector('[data-nav="search"]')?.addEventListener("click", () => {
  setTimeout(() => updateBottomNav(window.scrollY), 400);
});

document.querySelector('[data-nav="saved"]')?.addEventListener("click", () => {
  setTimeout(() => updateBottomNav(window.scrollY), 400);
});

// Swipe down to close modal on mobile
let modalTouchStart = 0;
const modalEl = document.querySelector(".modal");
if (modalEl) {
  modalEl.addEventListener("touchstart", e => {
    modalTouchStart = e.touches[0].clientY;
  }, { passive: true });
  modalEl.addEventListener("touchend", e => {
    const diff = e.changedTouches[0].clientY - modalTouchStart;
    if (diff > 80) closeModal();
  }, { passive: true });
}

document.getElementById("heroSearch")?.addEventListener("keydown", e => {
  if (e.key === "Enter") { e.preventDefault(); heroSearchGo(); }
});

updateScrollUI();
init();
