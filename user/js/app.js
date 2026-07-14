let properties = [];
let whatsapp = window.YOLO_WHATSAPP || "25475035540";
let currentModalId = null;
let savedIds = JSON.parse(localStorage.getItem("yolo_saved") || "[]");
let currentView = localStorage.getItem("yolo_view") || "grid";
let unsubProperties = null;

const typeLabels = {
  house: "House", apartment: "Apartment", room: "Room",
  commercial: "Commercial"
};

function showBanner(msg, warn) {
  const el = document.getElementById("firebaseBanner");
  if (!el) return;
  el.innerHTML = msg;
  el.classList.remove("hidden");
  el.classList.toggle("warn", !!warn);
}

function hideBanner() {
  document.getElementById("firebaseBanner")?.classList.add("hidden");
}

function onPropertiesUpdate(list) {
  properties = list.filter((p) => p.listingType === "rent");
  showSkeleton(false);
  renderHeroStats();
  renderFeatured();
  applyFilters();
  renderSaved();
  updateSavedUI();
  checkHashProperty();
}

async function loadSeedFallback() {
  showBanner(
    'Supabase not configured — showing sample rentals. Paste your URL + anon key in <code>shared/supabase-config.js</code>, then open <a href="/admin/">Admin</a>.',
    true
  );
  const seed = await fetch("/shared/seed-properties.json").then((r) => r.json());
  onPropertiesUpdate(seed.map((p) => ({ ...p, listingType: "rent" })));
}

async function init() {
  showSkeleton(true);
  whatsapp = window.YOLO_WHATSAPP || whatsapp;

  if (!window.YoloFirebase?.isConfigured()) {
    try {
      await loadSeedFallback();
    } catch (e) {
      showSkeleton(false);
      showBanner("Could not load rentals. Configure Supabase in shared/supabase-config.js", true);
    }
    return;
  }

  try {
    window.YoloFirebase.init();
    hideBanner();
    unsubProperties = window.YoloFirebase.listenProperties(
      onPropertiesUpdate,
      async () => {
        showBanner("Could not reach Supabase. Check project URL, anon key, and RLS policies.", true);
        showSkeleton(false);
      }
    );
  } catch (e) {
    console.error(e);
    await loadSeedFallback();
  }
}

function showSkeleton(on) {
  document.getElementById("skeleton").classList.toggle("hidden", !on);
  document.getElementById("grid").classList.toggle("hidden", on);
}

function formatPrice(p) {
  return "TZS " + Number(p).toLocaleString() + "/mo";
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

function scrollToRentals() {
  const el = document.getElementById("rentals");
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function syncSearchInputs(value) {
  const v = value ?? "";
  const search = document.getElementById("search");
  const hero = document.getElementById("heroSearch");
  if (search && search.value !== v) search.value = v;
  if (hero && hero.value !== v) hero.value = v;
}

const TYPE_WORDS = {
  house: ["house", "houses", "home", "homes", "villa", "nyumba"],
  apartment: ["apartment", "apartments", "flat", "flats", "condo"],
  room: ["room", "rooms", "single room", "bedsit", "chumba", "vyumba"],
  commercial: ["commercial", "shop", "office", "store", "duka", "ofisi"],
};

const SEARCH_STOP = new Set([
  "a", "an", "the", "in", "at", "of", "for", "to", "near", "and", "or",
  "with", "on", "by", "from", "na", "ya", "za", "kwa", "la", "wa",
]);

function detectTypeFromQuery(q) {
  const text = q.toLowerCase();
  for (const [type, words] of Object.entries(TYPE_WORDS)) {
    if (words.some((w) => text.includes(w))) return type;
  }
  return "";
}

function searchTokens(q) {
  return q
    .toLowerCase()
    .trim()
    .split(/[\s,;/|]+/)
    .map((t) => t.trim())
    .filter((t) => t && !SEARCH_STOP.has(t));
}

function matchesSearch(p, q) {
  if (!q) return true;
  const typeLabel = typeLabels[p.propertyType] || "";
  const typeSynonyms = (TYPE_WORDS[p.propertyType] || []).join(" ");
  const hay = [
    p.title,
    p.location,
    p.city,
    p.description,
    p.propertyType,
    typeLabel,
    typeSynonyms,
  ]
    .join(" ")
    .toLowerCase();

  // All meaningful tokens must match (e.g. "masaki apartment")
  const tokens = searchTokens(q);
  if (!tokens.length) return true;
  return tokens.every((t) => hay.includes(t));
}

function renderHeroStats() {
  const cities = new Set(properties.map((p) => p.city)).size;
  const types = new Set(properties.map((p) => p.propertyType)).size;
  document.getElementById("heroStats").innerHTML = `
    <div class="stat"><strong>${properties.length}</strong><span>Listings</span></div>
    <div class="stat"><strong>${cities || "—"}</strong><span>Cities</span></div>
    <div class="stat"><strong>${types || "—"}</strong><span>Types</span></div>
    <div class="stat"><strong>WA</strong><span>Viewings</span></div>
  `;
}

function renderFeatured() {
  const featured = properties.filter((p) => p.featured);
  const section = document.getElementById("featured");
  const grid = document.getElementById("featuredGrid");
  if (!featured.length) {
    section.classList.add("hidden");
    return;
  }
  section.classList.remove("hidden");
  grid.innerHTML = featured.map((p) => cardHtml(p, true)).join("");
}

function specsCards(p) {
  const items = [];
  if (p.bedrooms > 0) items.push(["Bedrooms", p.bedrooms]);
  if (p.bathrooms > 0) items.push(["Bathrooms", p.bathrooms]);
  if (p.area > 0) items.push(["Area", p.area.toLocaleString() + " sqft"]);
  items.push(["City", p.city]);
  return items.map(([k, v]) => `<div class="spec-item"><b>${v}</b>${k}</div>`).join("");
}

function isSaved(id) {
  return savedIds.includes(id);
}

function propertyMedia(p) {
  const images = Array.isArray(p.images) && p.images.length
    ? p.images.filter(Boolean)
    : p.image
      ? [p.image]
      : [];
  const slides = images.map((src) => ({ type: "image", src }));
  if (p.video) slides.push({ type: "video", src: p.video });
  return { images, video: p.video || "", slides };
}

function cardHtml(p, compact) {
  const saved = isSaved(p.id);
  const { images, video, slides } = propertyMedia(p);
  const cover = images[0] || "";
  const multi = slides.length > 1;

  return `
    <article class="card ${compact ? "card-compact" : ""}" data-id="${p.id}">
      <div class="card-image ${multi ? "has-carousel" : ""}">
        <div class="card-carousel" data-card-id="${p.id}">
          <div class="card-track">
            ${slides
              .map((s, i) =>
                s.type === "video"
                  ? `<div class="card-slide ${i === 0 ? "active" : ""}" data-i="${i}">
                       <video src="${s.src}" muted playsinline preload="metadata"></video>
                       <span class="card-video-flag">Video</span>
                     </div>`
                  : `<div class="card-slide ${i === 0 ? "active" : ""}" data-i="${i}">
                       <img src="${s.src}" alt="${escapeHtml(p.title)}" loading="${i === 0 ? "eager" : "lazy"}">
                     </div>`
              )
              .join("") ||
              `<div class="card-slide active"><div class="card-no-img">No photo</div></div>`}
          </div>
          ${
            multi
              ? `<button type="button" class="card-nav card-prev" data-carousel-dir="-1" aria-label="Previous">‹</button>
                 <button type="button" class="card-nav card-next" data-carousel-dir="1" aria-label="Next">›</button>
                 <div class="card-dots">${slides
                   .map((_, i) => `<button type="button" class="card-dot ${i === 0 ? "active" : ""}" data-carousel-go="${i}" aria-label="Media ${i + 1}"></button>`)
                   .join("")}</div>`
              : ""
          }
        </div>
        <span class="card-tag">For Rent</span>
        ${p.featured ? '<span class="card-featured">Featured</span>' : ""}
        ${images.length > 1 ? `<span class="card-photo-count">${images.length} photos${video ? " + video" : ""}</span>` : video ? '<span class="card-photo-count">Photo + video</span>' : ""}
        <button class="card-save ${saved ? "saved" : ""}" onclick="event.stopPropagation(); toggleSave('${p.id}')" aria-label="Save">${saved ? "♥" : "♡"}</button>
      </div>
      <div class="card-body">
        <span class="badge">${typeLabels[p.propertyType] || p.propertyType}</span>
        <h3>${escapeHtml(p.title)}</h3>
        <p class="location">${escapeHtml(p.location)}</p>
        ${compact ? "" : `<div class="specs-row">${specsCards(p)}</div>`}
        <p class="price">${formatPrice(p.price)} <small>per month</small></p>
        <button class="btn btn-view" onclick="openModal('${p.id}')">View details</button>
      </div>
    </article>
  `;
}

function stepCardCarousel(rootOrId, dir) {
  const root =
    rootOrId instanceof Element
      ? rootOrId.closest(".card-carousel") || rootOrId
      : document.querySelector(`.card-carousel[data-card-id="${CSS.escape(String(rootOrId))}"]`);
  if (!root) return;
  const slides = [...root.querySelectorAll(".card-slide")];
  if (!slides.length) return;
  const dots = [...root.querySelectorAll(".card-dot")];
  let idx = slides.findIndex((s) => s.classList.contains("active"));
  if (idx < 0) idx = 0;
  idx = (idx + dir + slides.length) % slides.length;
  slides.forEach((s, i) => s.classList.toggle("active", i === idx));
  dots.forEach((d, i) => d.classList.toggle("active", i === idx));
  root.querySelectorAll("video").forEach((v) => v.pause());
  const vid = slides[idx]?.querySelector("video");
  if (vid) {
    vid.currentTime = 0;
    vid.play().catch(() => {});
  }
}

function goCardCarousel(rootOrId, idx) {
  const root =
    rootOrId instanceof Element
      ? rootOrId.closest(".card-carousel") || rootOrId
      : document.querySelector(`.card-carousel[data-card-id="${CSS.escape(String(rootOrId))}"]`);
  if (!root) return;
  const slides = [...root.querySelectorAll(".card-slide")];
  const current = slides.findIndex((s) => s.classList.contains("active"));
  stepCardCarousel(root, idx - (current < 0 ? 0 : current));
}

function onCardCarouselClick(e) {
  const dirBtn = e.target.closest("[data-carousel-dir]");
  if (dirBtn) {
    e.preventDefault();
    e.stopPropagation();
    stepCardCarousel(dirBtn, Number(dirBtn.getAttribute("data-carousel-dir")));
    return;
  }
  const goBtn = e.target.closest("[data-carousel-go]");
  if (goBtn) {
    e.preventDefault();
    e.stopPropagation();
    goCardCarousel(goBtn, Number(goBtn.getAttribute("data-carousel-go")));
  }
}

let modalSlides = [];
let modalSlideIndex = 0;

function renderModalCarousel() {
  const track = document.getElementById("modalTrack");
  const dots = document.getElementById("modalDots");
  const counter = document.getElementById("modalCounter");
  const prev = document.getElementById("modalPrev");
  const next = document.getElementById("modalNext");
  if (!track) return;

  track.innerHTML = modalSlides
    .map((s, i) =>
      s.type === "video"
        ? `<div class="media-slide ${i === modalSlideIndex ? "active" : ""}" data-i="${i}">
             <video src="${s.src}" controls playsinline preload="metadata"></video>
           </div>`
        : `<div class="media-slide ${i === modalSlideIndex ? "active" : ""}" data-i="${i}">
             <img src="${s.src}" alt="">
           </div>`
    )
    .join("");

  const multi = modalSlides.length > 1;
  dots.innerHTML = multi
    ? modalSlides
        .map((_, i) => `<button type="button" class="media-dot ${i === modalSlideIndex ? "active" : ""}" data-modal-dot="${i}" aria-label="Slide ${i + 1}"></button>`)
        .join("")
    : "";
  counter.textContent = multi ? `${modalSlideIndex + 1} / ${modalSlides.length}` : "";
  prev?.classList.toggle("hidden", !multi);
  next?.classList.toggle("hidden", !multi);
  dots?.classList.toggle("hidden", !multi);
  counter?.classList.toggle("hidden", !multi);

  track.querySelectorAll("video").forEach((v) => {
    v.pause();
  });
}

function setModalSlide(idx) {
  if (!modalSlides.length) return;
  modalSlideIndex = ((idx % modalSlides.length) + modalSlides.length) % modalSlides.length;
  document.querySelectorAll("#modalTrack .media-slide").forEach((s, i) => {
    s.classList.toggle("active", i === modalSlideIndex);
  });
  document.querySelectorAll("#modalDots .media-dot").forEach((d, i) => {
    d.classList.toggle("active", i === modalSlideIndex);
  });
  const counter = document.getElementById("modalCounter");
  if (counter) counter.textContent = `${modalSlideIndex + 1} / ${modalSlides.length}`;
  document.querySelectorAll("#modalTrack video").forEach((v) => v.pause());
  const active = document.querySelector("#modalTrack .media-slide.active video");
  if (active) active.play().catch(() => {});
}

function stepModalSlide(dir) {
  setModalSlide(modalSlideIndex + dir);
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
  const min = Number(document.getElementById("minPrice").value) || 0;
  const max = Number(document.getElementById("maxPrice").value) || Infinity;

  return sortList(
    properties.filter((p) => {
      if (!matchesSearch(p, q)) return false;
      if (type && p.propertyType !== type) return false;
      if (p.price < min || p.price > max) return false;
      return true;
    })
  );
}

function renderActiveFilters() {
  const el = document.getElementById("activeFilters");
  const chips = [];
  const q = document.getElementById("search").value.trim();
  const type = document.getElementById("filterType").value;
  const min = document.getElementById("minPrice").value;
  const max = document.getElementById("maxPrice").value;

  if (q) chips.push(`Search: ${q}`);
  if (type) chips.push(typeLabels[type] || type);
  if (min) chips.push(`Min TZS ${Number(min).toLocaleString()}/mo`);
  if (max) chips.push(`Max TZS ${Number(max).toLocaleString()}/mo`);

  if (!chips.length) {
    el.classList.add("hidden");
    el.innerHTML = "";
    return;
  }
  el.classList.remove("hidden");
  el.innerHTML =
    chips.map((c) => `<span class="filter-chip">${c}</span>`).join("") +
    `<button class="filter-clear" onclick="clearFilters()">Clear all</button>`;
}

function render(list) {
  const grid = document.getElementById("grid");
  grid.className = "grid dense-grid";

  document.getElementById("resultCount").textContent =
    list.length === 1 ? "1 rental found" : `${list.length} rentals found`;

  if (!list.length) {
    grid.innerHTML = "";
    document.getElementById("empty").classList.remove("hidden");
    return;
  }
  document.getElementById("empty").classList.add("hidden");
  grid.innerHTML = list.map((p) => cardHtml(p, false)).join("");
}

function applyFilters() {
  renderActiveFilters();
  render(getFilteredList());
}

function filterByType(type) {
  document.getElementById("filterType").value = type || "";
  document.querySelectorAll(".cat-btn").forEach((btn) => {
    const btnType = btn.dataset.type ?? "";
    btn.classList.toggle("active", btnType === (type || "") || (!type && btn.classList.contains("cat-btn-all")));
  });
  applyFilters();
  scrollToRentals();
}

function clearFilters() {
  syncSearchInputs("");
  document.getElementById("filterType").value = "";
  document.getElementById("minPrice").value = "";
  document.getElementById("maxPrice").value = "";
  document.querySelectorAll(".cat-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.classList.contains("cat-btn-all"));
  });
  applyFilters();
}

function heroSearchGo() {
  const q = document.getElementById("heroSearch")?.value.trim() || "";
  syncSearchInputs(q);

  const detected = detectTypeFromQuery(q);
  if (detected) {
    document.getElementById("filterType").value = detected;
    document.querySelectorAll(".cat-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.type === detected);
    });
  }

  applyFilters();
  scrollToRentals();
}

function runQuickChip(q) {
  syncSearchInputs(q);
  const detected = detectTypeFromQuery(q);
  if (detected) {
    document.getElementById("filterType").value = detected;
    document.querySelectorAll(".cat-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.type === detected);
    });
  } else {
    document.getElementById("filterType").value = "";
    document.querySelectorAll(".cat-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.classList.contains("cat-btn-all"));
    });
  }
  document.querySelectorAll(".chip").forEach((c) => {
    c.classList.toggle("active", c.dataset.q === q);
  });
  applyFilters();
  scrollToRentals();
}

function setView(view) {
  currentView = view;
  localStorage.setItem("yolo_view", view);
  document.querySelectorAll(".view-btn").forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.view === view)
  );
  applyFilters();
}

function toggleSave(id) {
  if (savedIds.includes(id)) {
    savedIds = savedIds.filter((x) => x !== id);
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
  if (savedIds.length) {
    nav.classList.remove("hidden");
    count.textContent = savedIds.length;
  } else {
    nav.classList.add("hidden");
  }
}

function renderSaved() {
  const section = document.getElementById("saved");
  const grid = document.getElementById("savedGrid");
  const empty = document.getElementById("savedEmpty");
  const saved = properties.filter((p) => savedIds.includes(p.id));

  if (!savedIds.length) {
    section.classList.add("hidden");
    return;
  }
  section.classList.remove("hidden");

  if (!saved.length) {
    grid.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");
  grid.innerHTML = saved.map((p) => cardHtml(p, false)).join("");
}

function openModal(id) {
  const p = properties.find((x) => x.id === id);
  if (!p) return;
  currentModalId = id;
  history.replaceState(null, "", `#property-${id}`);

  const { slides } = propertyMedia(p);
  modalSlides = slides.length ? slides : [{ type: "image", src: p.image || "" }];
  modalSlideIndex = 0;
  renderModalCarousel();

  document.getElementById("modalBadge").textContent = `For Rent · ${typeLabels[p.propertyType] || p.propertyType}`;
  document.getElementById("modalTitle").textContent = p.title;
  document.getElementById("modalLocation").textContent = p.location;
  document.getElementById("modalPrice").innerHTML = `${formatPrice(p.price)} <small>per month</small>`;

  const quick = [];
  if (p.bedrooms > 0) quick.push(`${p.bedrooms} Bed`);
  if (p.bathrooms > 0) quick.push(`${p.bathrooms} Bath`);
  if (p.area > 0) quick.push(`${p.area.toLocaleString()} sqft`);
  quick.push(p.city);
  document.getElementById("modalQuickSpecs").innerHTML = quick
    .map((s) => `<span class="modal-pill">${s}</span>`)
    .join("");

  const specs = [];
  if (p.bedrooms > 0) specs.push(["Bedrooms", p.bedrooms]);
  if (p.bathrooms > 0) specs.push(["Bathrooms", p.bathrooms]);
  if (p.area > 0) specs.push(["Area", p.area.toLocaleString() + " sqft"]);
  specs.push(["City", p.city], ["Type", typeLabels[p.propertyType] || p.propertyType]);
  if (propertyMedia(p).images.length) specs.push(["Photos", propertyMedia(p).images.length]);
  if (p.video) specs.push(["Video", "Available"]);

  document.getElementById("modalSpecs").innerHTML = specs
    .map(([k, v]) => `<div class="spec-cell"><strong>${k}</strong><span>${v}</span></div>`)
    .join("");
  const desc = (p.description || "").trim();
  document.getElementById("modalDesc").textContent =
    desc || "Contact us on WhatsApp for full details about this rental.";

  const msg = encodeURIComponent(
    `Hi! I'm interested in renting "${p.title}" (${formatPrice(p.price)}) in ${p.location}. Please share more details.`
  );
  document.getElementById("modalWhatsapp").href = `https://wa.me/${whatsapp}?text=${msg}`;

  const saveBtn = document.getElementById("modalSave");
  saveBtn.classList.toggle("saved", isSaved(id));
  saveBtn.textContent = isSaved(id) ? "♥" : "♡";

  document.getElementById("modal").classList.add("open");
  document.body.classList.add("modal-open");
  document.body.style.overflow = "hidden";
  document.querySelector(".modal-close")?.focus();
}

function closeModal() {
  document.querySelectorAll("#modalTrack video").forEach((v) => {
    v.pause();
  });
  document.getElementById("modal").classList.remove("open");
  document.body.classList.remove("modal-open");
  document.body.style.overflow = "";
  currentModalId = null;
  history.replaceState(null, "", window.location.pathname);
}

function shareProperty() {
  const p = properties.find((x) => x.id === currentModalId);
  if (!p) return;
  const text = `${p.title} — ${formatPrice(p.price)} at ${p.location}`;
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

document.getElementById("modalPrev")?.addEventListener("click", (e) => {
  e.stopPropagation();
  stepModalSlide(-1);
});
document.getElementById("modalNext")?.addEventListener("click", (e) => {
  e.stopPropagation();
  stepModalSlide(1);
});
document.getElementById("modalDots")?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-modal-dot]");
  if (!btn) return;
  setModalSlide(Number(btn.getAttribute("data-modal-dot")));
});

let modalSwipeX = 0;
document.getElementById("modalCarousel")?.addEventListener(
  "touchstart",
  (e) => {
    modalSwipeX = e.touches[0].clientX;
  },
  { passive: true }
);
document.getElementById("modalCarousel")?.addEventListener(
  "touchend",
  (e) => {
    const dx = e.changedTouches[0].clientX - modalSwipeX;
    if (Math.abs(dx) < 50) return;
    stepModalSlide(dx < 0 ? 1 : -1);
  },
  { passive: true }
);

document.addEventListener("keydown", (e) => {
  if (!document.getElementById("modal")?.classList.contains("open")) return;
  if (e.key === "Escape") closeModal();
  if (e.key === "ArrowLeft") stepModalSlide(-1);
  if (e.key === "ArrowRight") stepModalSlide(1);
});

window.stepCardCarousel = stepCardCarousel;
window.goCardCarousel = goCardCarousel;
window.scrollToRentals = scrollToRentals;
window.openModal = openModal;
window.closeModal = closeModal;
window.toggleSave = toggleSave;
window.filterByType = filterByType;
window.clearFilters = clearFilters;
window.heroSearchGo = heroSearchGo;
window.applyFilters = applyFilters;
window.setView = setView;
window.shareProperty = shareProperty;

["grid", "featuredGrid", "savedGrid"].forEach((id) => {
  document.getElementById(id)?.addEventListener("click", onCardCarouselClick);
});

document.getElementById("modal").addEventListener("click", (e) => {
  if (e.target.id === "modal") closeModal();
});

document.getElementById("search").addEventListener("input", () => {
  syncSearchInputs(document.getElementById("search").value);
  applyFilters();
});
document.getElementById("filterType").addEventListener("change", () => {
  const type = document.getElementById("filterType").value;
  document.querySelectorAll(".cat-btn").forEach((btn) => {
    const btnType = btn.dataset.type ?? "";
    btn.classList.toggle("active", btnType === type || (!type && btn.classList.contains("cat-btn-all")));
  });
  applyFilters();
});
document.getElementById("minPrice").addEventListener("input", () => applyFilters());
document.getElementById("maxPrice").addEventListener("input", () => applyFilters());

/* Nav stays visible on all screen sizes — no hamburger handlers needed */
const heroSearch = document.getElementById("heroSearch");

document.getElementById("quickChips")?.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  runQuickChip(chip.dataset.q || "");
});

if (heroSearch) {
  let heroSearchTimer = null;
  heroSearch.addEventListener("input", () => {
    syncSearchInputs(heroSearch.value);
    clearTimeout(heroSearchTimer);
    heroSearchTimer = setTimeout(() => {
      const detected = detectTypeFromQuery(heroSearch.value);
      if (detected) {
        document.getElementById("filterType").value = detected;
        document.querySelectorAll(".cat-btn").forEach((btn) => {
          btn.classList.toggle("active", btn.dataset.type === detected);
        });
      }
      applyFilters();
    }, 180);
  });
}

window.addEventListener("scroll", updateScrollUI);

function updateScrollUI() {
  const y = window.scrollY;
  document.getElementById("backTop")?.classList.toggle("hidden", y < 400);
  document.querySelector(".site-header")?.classList.toggle("scrolled", y > 20);
  document.getElementById("discoverSticky")?.classList.toggle("stuck", y > 280);
  updateHeaderNav(y);
}

function updateHeaderNav(scrollY) {
  // Nav stays visible — no mobile hamburger collapse
  if (window.innerWidth <= 900) return;
  document.querySelectorAll("#mainNav a:not(.nav-wa)").forEach((a) => a.classList.remove("active"));

  const items = [
    { el: document.getElementById("saved"), sel: "#savedNav", needsSaved: true },
    { el: document.getElementById("how"), sel: 'a[href="#how"]' },
    { el: document.getElementById("rentals"), sel: 'a[href="#rentals"]' },
    { el: document.getElementById("featured"), sel: 'a[href="#featured"]', allowHidden: true },
  ].filter(
    (s) =>
      s.el &&
      (!s.el.classList.contains("hidden") || s.allowHidden) &&
      (!s.needsSaved || savedIds.length)
  );

  items.sort((a, b) => b.el.offsetTop - a.el.offsetTop);

  for (const sec of items) {
    if (scrollY >= sec.el.offsetTop - 140) {
      document.querySelector(`#mainNav ${sec.sel}`)?.classList.add("active");
      return;
    }
  }
}

document.querySelectorAll(".view-btn").forEach((btn) => {
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

let modalTouchStart = 0;
let modalTouchOnHandle = false;
const modalEl = document.querySelector(".modal");
if (modalEl) {
  modalEl.addEventListener(
    "touchstart",
    (e) => {
      modalTouchStart = e.touches[0].clientY;
      const body = e.target.closest(".modal-body");
      modalTouchOnHandle = !body || body.scrollTop <= 0;
    },
    { passive: true }
  );
  modalEl.addEventListener(
    "touchend",
    (e) => {
      if (!modalTouchOnHandle) return;
      const diff = e.changedTouches[0].clientY - modalTouchStart;
      if (diff > 100) closeModal();
    },
    { passive: true }
  );
}

document.getElementById("heroSearch")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    heroSearchGo();
  }
});

window.addEventListener("beforeunload", () => {
  if (unsubProperties) unsubProperties();
});

updateScrollUI();
init();
