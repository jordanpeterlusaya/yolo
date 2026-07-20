let properties = [];
let clientLeads = [];
let brokers = [];
let unsub = null;
let currentPanel = "rentals";
let existingImages = [];
let selectedImageFiles = [];
let existingVideo = "";
let selectedVideoFile = null;
let clearVideoFlag = false;

const MAX_IMAGES = window.YoloFirebase?.MAX_IMAGES || 12;
const MAX_IMAGE_BYTES = window.YoloFirebase?.MAX_IMAGE_BYTES || 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = window.YoloFirebase?.MAX_VIDEO_BYTES || 50 * 1024 * 1024;

const typeLabels = {
  house: "House",
  apartment: "Apartment",
  room: "Room",
  commercial: "Commercial",
};

const loginBox = document.getElementById("loginBox");
const dashboard = document.getElementById("dashboard");
const logoutBtn = document.getElementById("logoutBtn");
const setupNotice = document.getElementById("setupNotice");
const loginError = document.getElementById("loginError");
const formError = document.getElementById("formError");
const formOk = document.getElementById("formOk");
const imageFilesInput = document.getElementById("imageFiles");
const galleryPreview = document.getElementById("galleryPreview");
const imageHint = document.getElementById("imageHint");
const videoFileInput = document.getElementById("videoFile");
const videoPreview = document.getElementById("videoPreview");
const videoHint = document.getElementById("videoHint");
const clearVideoBtn = document.getElementById("clearVideoBtn");

function show(el) {
  el?.classList.remove("hidden");
}
function hide(el) {
  el?.classList.add("hidden");
}

function setSetupNotice() {
  if (!window.YoloFirebase?.isConfigured()) {
    setupNotice.innerHTML =
      "Supabase is not configured yet. Create a project, run <code>shared/schema.sql</code> + <code>shared/migrate-crm.sql</code>, then paste URL + anon key into <code>shared/supabase-config.js</code>.";
    show(setupNotice);
    document.querySelector("#loginForm button")?.setAttribute("disabled", "true");
    return false;
  }
  hide(setupNotice);
  document.querySelector("#loginForm button")?.removeAttribute("disabled");
  return true;
}

function showPanel(name) {
  currentPanel = name || "rentals";
  document.querySelectorAll(".admin-panel").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.panel !== currentPanel);
  });
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === currentPanel);
  });
  closeSidebar();
}

function openSidebar() {
  document.getElementById("adminSidebar")?.classList.add("open");
  document.getElementById("sidebarBackdrop")?.classList.add("open");
}

function closeSidebar() {
  document.getElementById("adminSidebar")?.classList.remove("open");
  document.getElementById("sidebarBackdrop")?.classList.remove("open");
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value + (String(value).length === 10 ? "T12:00:00" : ""));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatBudget(value) {
  if (value == null || value === "") return "—";
  return `TZS ${Number(value).toLocaleString()}`;
}

function showDashboard(user) {
  hide(loginBox);
  show(dashboard);
  show(document.getElementById("adminSidebar"));
  show(document.getElementById("sidebarToggle"));
  show(logoutBtn);
  document.getElementById("authEmail").textContent = user.email || "Admin";
  show(document.getElementById("authEmail"));
  showPanel(currentPanel);
  startListening();
  loadCrmData().then(() => maybeAutoSeedBrokers());
}

async function loadCrmData() {
  try {
    clientLeads = await window.YoloFirebase.fetchClientLeads();
    renderClients();
  } catch (err) {
    console.error(err);
    clientLeads = [];
    renderClients();
    const msg = String(err.message || err);
    if (/client_leads|PGRST205|schema cache/i.test(msg)) {
      document.getElementById("emptyClients").textContent =
        "Jedwali la wateja bado halijaundwa. Endesha shared/migrate-crm.sql kwenye Supabase SQL Editor.";
      show(document.getElementById("emptyClients"));
    }
  }

  try {
    brokers = await window.YoloFirebase.fetchBrokers();
    renderBrokers();
  } catch (err) {
    console.error(err);
    brokers = [];
    renderBrokers();
    const msg = String(err.message || err);
    if (/brokers|PGRST205|schema cache/i.test(msg)) {
      document.getElementById("emptyBrokers").textContent =
        "Jedwali la madalali bado halijaundwa. Endesha shared/migrate-crm.sql kwenye Supabase SQL Editor, kisha Import seed madalali.";
      show(document.getElementById("emptyBrokers"));
    }
  }
}

function startListening() {
  if (unsub) return;
  unsub = window.YoloFirebase.listenProperties(
    (list) => {
      properties = list;
      renderPosted();
    },
    (err) => {
      formError.textContent = err.message || "Failed to load rentals";
      show(formError);
    }
  );
}

async function refreshPosted() {
  try {
    properties = await window.YoloFirebase.getAllProperties();
    renderPosted();
  } catch (err) {
    formError.textContent = err.message || "Failed to refresh";
    show(formError);
  }
}

function showLogin() {
  show(loginBox);
  hide(dashboard);
  hide(logoutBtn);
  hide(document.getElementById("adminSidebar"));
  hide(document.getElementById("sidebarToggle"));
  hide(document.getElementById("authEmail"));
  closeSidebar();
  if (unsub) {
    unsub();
    unsub = null;
  }
}

function totalPhotoCount() {
  return existingImages.length + selectedImageFiles.length;
}

function renderGalleryPreview() {
  const parts = [];

  existingImages.forEach((url, i) => {
    parts.push(`
      <div class="gallery-item" data-existing="${i}">
        <img src="${url}" alt="Photo ${i + 1}">
        <button type="button" class="gallery-remove" data-remove-existing="${i}" aria-label="Remove photo">×</button>
        ${i === 0 && !selectedImageFiles.length ? '<span class="gallery-cover">Cover</span>' : ""}
      </div>`);
  });

  selectedImageFiles.forEach((file, i) => {
    const url = URL.createObjectURL(file);
    const cover = existingImages.length === 0 && i === 0;
    parts.push(`
      <div class="gallery-item" data-new="${i}">
        <img src="${url}" alt="${escapeHtml(file.name)}">
        <button type="button" class="gallery-remove" data-remove-new="${i}" aria-label="Remove photo">×</button>
        ${cover ? '<span class="gallery-cover">Cover</span>' : ""}
      </div>`);
  });

  galleryPreview.innerHTML = parts.join("");

  if (totalPhotoCount()) {
    hide(imageHint);
  } else {
    show(imageHint);
    imageHint.textContent = "Add one or more photos from your device";
  }
}

function renderVideoPreview() {
  if (selectedVideoFile) {
    videoPreview.src = URL.createObjectURL(selectedVideoFile);
    show(videoPreview);
    show(clearVideoBtn);
    videoHint.textContent = selectedVideoFile.name;
    show(videoHint);
    return;
  }
  if (existingVideo && !clearVideoFlag) {
    videoPreview.src = existingVideo;
    show(videoPreview);
    show(clearVideoBtn);
    videoHint.textContent = "Current video — choose a new file to replace";
    show(videoHint);
    return;
  }
  videoPreview.removeAttribute("src");
  videoPreview.load();
  hide(videoPreview);
  hide(clearVideoBtn);
  videoHint.textContent = "Optional walkthrough video for tenants";
  show(videoHint);
}

function getFormData() {
  return {
    title: document.getElementById("title").value,
    description: document.getElementById("description").value,
    price: Number(document.getElementById("price").value),
    propertyType: document.getElementById("propertyType").value,
    location: document.getElementById("location").value,
    city: document.getElementById("city").value,
    bedrooms: Number(document.getElementById("bedrooms").value) || 0,
    bathrooms: Number(document.getElementById("bathrooms").value) || 0,
    area: Number(document.getElementById("area").value) || 0,
    featured: document.getElementById("featured").checked,
  };
}

function resetForm() {
  document.getElementById("editId").value = "";
  document.getElementById("propertyForm").reset();
  document.getElementById("bedrooms").value = "0";
  document.getElementById("bathrooms").value = "0";
  document.getElementById("area").value = "0";
  existingImages = [];
  selectedImageFiles = [];
  existingVideo = "";
  selectedVideoFile = null;
  clearVideoFlag = false;
  imageFilesInput.value = "";
  videoFileInput.value = "";
  renderGalleryPreview();
  renderVideoPreview();
  document.getElementById("formTitle").textContent = "Add rental";
  hide(document.getElementById("cancelBtn"));
  hide(formError);
  hide(formOk);
}

function renderPosted() {
  document.getElementById("count").textContent = properties.length;
  const grid = document.getElementById("postedGrid");
  const empty = document.getElementById("emptyList");

  if (!properties.length) {
    grid.innerHTML = "";
    show(empty);
    return;
  }
  hide(empty);

  grid.innerHTML = properties
    .map((p) => {
      const images = Array.isArray(p.images) && p.images.length ? p.images : p.image ? [p.image] : [];
      const cover = images[0] || "";
      const mediaBits = [];
      if (images.length) mediaBits.push(`${images.length} photo${images.length > 1 ? "s" : ""}`);
      if (p.video) mediaBits.push("Video");
      return `
      <article class="posted-card">
        <div class="posted-thumb">
          ${cover ? `<img src="${cover}" alt="">` : `<div class="posted-thumb-empty">No photo</div>`}
          ${p.video ? '<span class="posted-video-badge">Video</span>' : ""}
          ${images.length > 1 ? `<span class="posted-count">${images.length}</span>` : ""}
        </div>
        <div class="posted-body">
          <div class="posted-type">${escapeHtml(typeLabels[p.propertyType] || p.propertyType)}</div>
          <h3>${escapeHtml(p.title)}</h3>
          <p class="posted-meta">${escapeHtml(p.location)}</p>
          <p class="posted-price">TZS ${Number(p.price).toLocaleString()}<small>/mo</small></p>
          <p class="posted-media">${mediaBits.join(" · ") || "No media"}</p>
          ${p.featured ? '<span class="posted-featured">Featured</span>' : ""}
          <div class="row-actions">
            <button type="button" class="btn btn-secondary btn-sm" data-edit="${p.id}">Edit</button>
            <button type="button" class="btn btn-danger btn-sm" data-del="${p.id}">Delete</button>
          </div>
        </div>
      </article>`;
    })
    .join("");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function editProperty(id) {
  const p = properties.find((x) => x.id === id);
  if (!p) return;
  document.getElementById("editId").value = p.id;
  document.getElementById("title").value = p.title;
  document.getElementById("description").value = p.description;
  document.getElementById("price").value = p.price;
  document.getElementById("propertyType").value = p.propertyType;
  document.getElementById("location").value = p.location;
  document.getElementById("city").value = p.city;
  document.getElementById("bedrooms").value = p.bedrooms;
  document.getElementById("bathrooms").value = p.bathrooms;
  document.getElementById("area").value = p.area || 0;
  document.getElementById("featured").checked = !!p.featured;

  existingImages = Array.isArray(p.images) && p.images.length ? [...p.images] : p.image ? [p.image] : [];
  selectedImageFiles = [];
  existingVideo = p.video || "";
  selectedVideoFile = null;
  clearVideoFlag = false;
  imageFilesInput.value = "";
  videoFileInput.value = "";
  renderGalleryPreview();
  renderVideoPreview();

  document.getElementById("formTitle").textContent = "Edit rental";
  show(document.getElementById("cancelBtn"));
  hide(formError);
  hide(formOk);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

imageFilesInput.addEventListener("change", () => {
  const files = Array.from(imageFilesInput.files || []);
  imageFilesInput.value = "";
  hide(formError);

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      formError.textContent = "Photos must be image files (JPG, PNG, WebP).";
      show(formError);
      continue;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      formError.textContent = `"${file.name}" is larger than 5 MB.`;
      show(formError);
      continue;
    }
    if (totalPhotoCount() >= MAX_IMAGES) {
      formError.textContent = `Maximum ${MAX_IMAGES} photos per rental.`;
      show(formError);
      break;
    }
    selectedImageFiles.push(file);
  }
  renderGalleryPreview();
});

galleryPreview.addEventListener("click", (e) => {
  const remExisting = e.target.getAttribute("data-remove-existing");
  const remNew = e.target.getAttribute("data-remove-new");
  if (remExisting !== null) {
    existingImages.splice(Number(remExisting), 1);
    renderGalleryPreview();
  }
  if (remNew !== null) {
    selectedImageFiles.splice(Number(remNew), 1);
    renderGalleryPreview();
  }
});

videoFileInput.addEventListener("change", () => {
  const file = videoFileInput.files?.[0] || null;
  hide(formError);
  if (!file) return;
  if (!file.type.startsWith("video/")) {
    formError.textContent = "Please choose an MP4 or WebM video.";
    show(formError);
    videoFileInput.value = "";
    return;
  }
  if (file.size > MAX_VIDEO_BYTES) {
    formError.textContent = "Video must be smaller than 50 MB.";
    show(formError);
    videoFileInput.value = "";
    return;
  }
  selectedVideoFile = file;
  clearVideoFlag = false;
  renderVideoPreview();
});

clearVideoBtn.addEventListener("click", () => {
  selectedVideoFile = null;
  clearVideoFlag = true;
  existingVideo = "";
  videoFileInput.value = "";
  renderVideoPreview();
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  hide(loginError);
  if (!setSetupNotice()) return;
  try {
    await window.YoloFirebase.signIn(
      document.getElementById("email").value.trim(),
      document.getElementById("password").value
    );
  } catch (err) {
    loginError.textContent = err.message || "Login failed";
    show(loginError);
  }
});

logoutBtn.addEventListener("click", () => window.YoloFirebase.signOut());
document.getElementById("cancelBtn").addEventListener("click", resetForm);
document.getElementById("refreshListBtn")?.addEventListener("click", refreshPosted);

document.getElementById("propertyForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  hide(formError);
  hide(formOk);
  const data = getFormData();
  if (!data.title || !data.description || !data.price || !data.location || !data.city) {
    formError.textContent = "Please fill in all required fields.";
    show(formError);
    return;
  }

  const editId = document.getElementById("editId").value;
  if (totalPhotoCount() < 1) {
    formError.textContent = "Please add at least one property photo.";
    show(formError);
    return;
  }

  const saveBtn = document.getElementById("saveBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Uploading media…";

  try {
    const uploaded = [];
    for (let i = 0; i < selectedImageFiles.length; i++) {
      saveBtn.textContent = `Uploading photo ${i + 1}/${selectedImageFiles.length}…`;
      uploaded.push(await window.YoloFirebase.uploadPropertyImage(selectedImageFiles[i], editId || undefined));
    }

    const images = [...existingImages, ...uploaded].slice(0, MAX_IMAGES);
    data.images = images;
    data.image = images[0];

    if (selectedVideoFile) {
      saveBtn.textContent = "Uploading video…";
      data.video = await window.YoloFirebase.uploadPropertyVideo(selectedVideoFile, editId || undefined);
    } else if (clearVideoFlag) {
      data.video = "";
    } else if (editId) {
      data.video = existingVideo || "";
    } else {
      data.video = "";
    }

    saveBtn.textContent = "Saving…";
    if (editId) {
      await window.YoloFirebase.updateProperty(editId, data);
      formOk.textContent = "Rental updated — visible on the user site with gallery.";
    } else {
      await window.YoloFirebase.createProperty(data);
      formOk.textContent = "Rental published with photos" + (data.video ? " + video" : "") + ".";
    }
    show(formOk);
    resetForm();
    await refreshPosted();
  } catch (err) {
    formError.textContent = err.message || "Save failed";
    show(formError);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save rental";
  }
});

document.getElementById("postedGrid").addEventListener("click", async (e) => {
  const editId = e.target.getAttribute("data-edit");
  const delId = e.target.getAttribute("data-del");
  if (editId) {
    editProperty(editId);
    return;
  }
  if (delId) {
    if (!confirm("Delete this rental? It will disappear from the user site.")) return;
    try {
      await window.YoloFirebase.deleteProperty(delId);
      await refreshPosted();
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  }
});

document.getElementById("seedBtn").addEventListener("click", async () => {
  if (!confirm("Import sample rentals into Supabase?")) return;
  try {
    const seed = await fetch("/shared/seed-properties.json").then((r) => r.json());
    await window.YoloFirebase.seedFromJson(seed);
    await refreshPosted();
    alert(`Imported ${seed.length} sample rentals.`);
  } catch (err) {
    alert(err.message || "Import failed");
  }
});

/* ——— Navigation ——— */
document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => showPanel(btn.dataset.nav));
});

document.getElementById("sidebarToggle")?.addEventListener("click", openSidebar);
document.getElementById("sidebarBackdrop")?.addEventListener("click", closeSidebar);

/* ——— Client leads ——— */
const clientFormError = document.getElementById("clientFormError");
const clientFormOk = document.getElementById("clientFormOk");

function resetClientForm() {
  document.getElementById("clientEditId").value = "";
  document.getElementById("clientForm").reset();
  document.getElementById("clientFormTitle").textContent = "Ongeza mteja";
  hide(document.getElementById("clientCancelBtn"));
  hide(clientFormError);
  hide(clientFormOk);
}

function getClientFormData() {
  return {
    clientName: document.getElementById("clientName").value,
    phone: document.getElementById("clientPhone").value,
    moveDate: document.getElementById("moveDate").value,
    viewingDate: document.getElementById("viewingDate").value,
    budget: document.getElementById("clientBudget").value,
    preferredArea: document.getElementById("preferredArea").value,
    notes: document.getElementById("clientNotes").value,
  };
}

function renderClients() {
  document.getElementById("clientCount").textContent = clientLeads.length;
  const body = document.getElementById("clientsBody");
  const empty = document.getElementById("emptyClients");

  if (!clientLeads.length) {
    body.innerHTML = "";
    show(empty);
    return;
  }
  hide(empty);

  body.innerHTML = clientLeads
    .map(
      (c) => `
    <tr>
      <td>
        <div class="cell-stack">
          <strong>${escapeHtml(c.clientName)}</strong>
          ${c.phone ? `<span>${escapeHtml(c.phone)}</span>` : ""}
        </div>
      </td>
      <td>${formatDate(c.moveDate)}</td>
      <td>${formatDate(c.viewingDate)}</td>
      <td class="cell-budget">${formatBudget(c.budget)}</td>
      <td>${escapeHtml(c.preferredArea)}</td>
      <td>
        <div class="row-actions">
          <button type="button" class="btn btn-secondary btn-sm" data-client-edit="${c.id}">Edit</button>
          <button type="button" class="btn btn-danger btn-sm" data-client-del="${c.id}">Delete</button>
        </div>
      </td>
    </tr>`
    )
    .join("");
}

function editClient(id) {
  const c = clientLeads.find((x) => x.id === id);
  if (!c) return;
  document.getElementById("clientEditId").value = c.id;
  document.getElementById("clientName").value = c.clientName;
  document.getElementById("clientPhone").value = c.phone || "";
  document.getElementById("moveDate").value = c.moveDate || "";
  document.getElementById("viewingDate").value = c.viewingDate || "";
  document.getElementById("clientBudget").value = c.budget != null ? c.budget : "";
  document.getElementById("preferredArea").value = c.preferredArea;
  document.getElementById("clientNotes").value = c.notes || "";
  document.getElementById("clientFormTitle").textContent = "Hariri mteja";
  show(document.getElementById("clientCancelBtn"));
  hide(clientFormError);
  hide(clientFormOk);
  showPanel("clients");
  document.getElementById("clientForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

document.getElementById("clientForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  hide(clientFormError);
  hide(clientFormOk);
  const data = getClientFormData();
  if (!data.clientName.trim() || !data.preferredArea.trim()) {
    clientFormError.textContent = "Jina na eneo la kuishi vinahitajika.";
    show(clientFormError);
    return;
  }

  const editId = document.getElementById("clientEditId").value;
  const saveBtn = document.getElementById("clientSaveBtn");
  saveBtn.disabled = true;

  try {
    if (editId) {
      await window.YoloFirebase.updateClientLead(editId, data);
      clientFormOk.textContent = "Mteja amesasishwa.";
    } else {
      await window.YoloFirebase.createClientLead(data);
      clientFormOk.textContent = "Mteja ameongezwa.";
    }
    show(clientFormOk);
    resetClientForm();
    clientLeads = await window.YoloFirebase.fetchClientLeads();
    renderClients();
  } catch (err) {
    clientFormError.textContent = err.message || "Imeshindikana kuhifadhi.";
    show(clientFormError);
  } finally {
    saveBtn.disabled = false;
  }
});

document.getElementById("clientCancelBtn").addEventListener("click", resetClientForm);
document.getElementById("refreshClientsBtn")?.addEventListener("click", async () => {
  clientLeads = await window.YoloFirebase.fetchClientLeads();
  renderClients();
});

document.getElementById("clientsBody").addEventListener("click", async (e) => {
  const editId = e.target.getAttribute("data-client-edit");
  const delId = e.target.getAttribute("data-client-del");
  if (editId) {
    editClient(editId);
    return;
  }
  if (delId) {
    if (!confirm("Futa taarifa za mteja huyu?")) return;
    try {
      await window.YoloFirebase.deleteClientLead(delId);
      clientLeads = await window.YoloFirebase.fetchClientLeads();
      renderClients();
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  }
});

/* ——— Brokers ——— */
const brokerFormError = document.getElementById("brokerFormError");
const brokerFormOk = document.getElementById("brokerFormOk");

function resetBrokerForm() {
  document.getElementById("brokerEditId").value = "";
  document.getElementById("brokerForm").reset();
  document.getElementById("brokerActive").checked = true;
  document.getElementById("brokerFormTitle").textContent = "Ongeza dalali";
  hide(brokerFormError);
  hide(brokerFormOk);
}

function openBrokerDrawer(edit = false) {
  const drawer = document.getElementById("brokerDrawer");
  const backdrop = document.getElementById("brokerDrawerBackdrop");
  if (!edit) resetBrokerForm();
  show(drawer);
  show(backdrop);
  document.body.classList.add("drawer-open");
  setTimeout(() => document.getElementById("brokerName")?.focus(), 50);
}

function closeBrokerDrawer() {
  hide(document.getElementById("brokerDrawer"));
  hide(document.getElementById("brokerDrawerBackdrop"));
  document.body.classList.remove("drawer-open");
  resetBrokerForm();
}

function getBrokerFormData() {
  return {
    name: document.getElementById("brokerName").value,
    phone: document.getElementById("brokerPhone").value,
    email: document.getElementById("brokerEmail").value,
    areas: document.getElementById("brokerAreas").value,
    notes: document.getElementById("brokerNotes").value,
    active: document.getElementById("brokerActive").checked,
  };
}

function brokerInitials(name) {
  const parts = String(name || "")
    .replace(/[._]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function splitAreas(areas) {
  return String(areas || "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
}

function collectBrokerAreas() {
  const set = new Set();
  brokers.forEach((b) => splitAreas(b.areas).forEach((a) => set.add(a)));
  return [...set].sort((a, b) => a.localeCompare(b));
}

function syncBrokerAreaFilter() {
  const select = document.getElementById("brokerAreaFilter");
  if (!select) return;
  const current = select.value;
  const areas = collectBrokerAreas();
  select.innerHTML =
    `<option value="">Maeneo yote</option>` +
    areas.map((a) => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join("");
  if (areas.includes(current)) select.value = current;
}

function getFilteredBrokers() {
  const q = (document.getElementById("brokerSearch")?.value || "").toLowerCase().trim();
  const area = document.getElementById("brokerAreaFilter")?.value || "";
  const status = document.getElementById("brokerStatusFilter")?.value || "";

  return brokers
    .filter((b) => {
      if (status === "active" && !b.active) return false;
      if (status === "inactive" && b.active) return false;
      if (area) {
        const areas = splitAreas(b.areas).map((a) => a.toLowerCase());
        if (!areas.includes(area.toLowerCase())) return false;
      }
      if (!q) return true;
      const hay = [b.name, b.phone, b.email, b.areas, b.notes].join(" ").toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true }));
}

function updateBrokerStats() {
  const active = brokers.filter((b) => b.active).length;
  document.getElementById("brokerStatTotal").textContent = brokers.length;
  document.getElementById("brokerStatActive").textContent = active;
  document.getElementById("brokerStatInactive").textContent = brokers.length - active;
  document.getElementById("brokerStatAreas").textContent = collectBrokerAreas().length;
}

function renderBrokers() {
  syncBrokerAreaFilter();
  updateBrokerStats();

  const grid = document.getElementById("brokersGrid");
  const empty = document.getElementById("emptyBrokers");
  const emptySearch = document.getElementById("emptyBrokerSearch");
  const visible = getFilteredBrokers();
  const visibleEl = document.getElementById("brokerVisibleCount");
  if (visibleEl) visibleEl.textContent = String(visible.length);

  if (!brokers.length) {
    grid.innerHTML = "";
    show(empty);
    hide(emptySearch);
    return;
  }
  hide(empty);

  if (!visible.length) {
    grid.innerHTML = "";
    show(emptySearch);
    return;
  }
  hide(emptySearch);

  grid.innerHTML = visible
    .map((b, index) => {
      const areas = splitAreas(b.areas);
      const areaText = areas.length ? escapeHtml(areas.join(", ")) : "—";
      const phoneDigits = String(b.phone || "").replace(/\D/g, "");
      let waHref = "";
      if (phoneDigits) {
        const intl = phoneDigits.startsWith("255")
          ? phoneDigits
          : phoneDigits.startsWith("0")
            ? `255${phoneDigits.slice(1)}`
            : `255${phoneDigits}`;
        waHref = `https://wa.me/${intl}`;
      }
      const wa = waHref
        ? `<a class="link-action" href="${waHref}" target="_blank" rel="noopener">WA</a>`
        : "";
      return `
      <div class="broker-row ${b.active ? "" : "is-inactive"}">
        <div class="col-name">
          <span class="broker-index">${index + 1}</span>
          <div class="broker-avatar sm" aria-hidden="true">${escapeHtml(brokerInitials(b.name))}</div>
          <div class="broker-id">
            <strong class="broker-name">${escapeHtml(b.name)}</strong>
            ${b.email ? `<span class="broker-email">${escapeHtml(b.email)}</span>` : ""}
          </div>
        </div>
        <div class="col-phone"><a href="tel:${escapeHtml(String(b.phone).replace(/\s/g, ""))}">${escapeHtml(b.phone)}</a></div>
        <div class="col-areas" title="${areaText}">${areaText}</div>
        <div class="col-status"><span class="status-pill ${b.active ? "active" : "inactive"}">${b.active ? "Active" : "Inactive"}</span></div>
        <div class="col-actions">
          ${wa}
          <button type="button" class="link-action" data-broker-edit="${b.id}">Edit</button>
          <button type="button" class="link-action danger" data-broker-del="${b.id}">Delete</button>
        </div>
      </div>`;
    })
    .join("");
}

function editBroker(id) {
  const b = brokers.find((x) => x.id === id);
  if (!b) return;
  document.getElementById("brokerEditId").value = b.id;
  document.getElementById("brokerName").value = b.name;
  document.getElementById("brokerPhone").value = b.phone;
  document.getElementById("brokerEmail").value = b.email || "";
  document.getElementById("brokerAreas").value = b.areas || "";
  document.getElementById("brokerNotes").value = b.notes || "";
  document.getElementById("brokerActive").checked = !!b.active;
  document.getElementById("brokerFormTitle").textContent = "Hariri dalali";
  hide(brokerFormError);
  hide(brokerFormOk);
  showPanel("brokers");
  openBrokerDrawer(true);
}

document.getElementById("brokerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  hide(brokerFormError);
  hide(brokerFormOk);
  const data = getBrokerFormData();
  if (!data.name.trim() || !data.phone.trim()) {
    brokerFormError.textContent = "Jina na simu vinahitajika.";
    show(brokerFormError);
    return;
  }

  const editId = document.getElementById("brokerEditId").value;
  const saveBtn = document.getElementById("brokerSaveBtn");
  saveBtn.disabled = true;

  try {
    if (editId) {
      await window.YoloFirebase.updateBroker(editId, data);
      brokerFormOk.textContent = "Dalali amesasishwa.";
    } else {
      await window.YoloFirebase.createBroker(data);
      brokerFormOk.textContent = "Dalali ameongezwa.";
    }
    show(brokerFormOk);
    brokers = await window.YoloFirebase.fetchBrokers();
    renderBrokers();
    setTimeout(() => closeBrokerDrawer(), 450);
  } catch (err) {
    brokerFormError.textContent = err.message || "Imeshindikana kuhifadhi.";
    show(brokerFormError);
  } finally {
    saveBtn.disabled = false;
  }
});

document.getElementById("brokerCancelBtn").addEventListener("click", closeBrokerDrawer);
document.getElementById("closeBrokerDrawerBtn")?.addEventListener("click", closeBrokerDrawer);
document.getElementById("brokerDrawerBackdrop")?.addEventListener("click", closeBrokerDrawer);
document.getElementById("openBrokerDrawerBtn")?.addEventListener("click", () => openBrokerDrawer(false));

document.getElementById("brokerSearch")?.addEventListener("input", () => renderBrokers());
document.getElementById("brokerAreaFilter")?.addEventListener("change", () => renderBrokers());
document.getElementById("brokerStatusFilter")?.addEventListener("change", () => renderBrokers());

document.getElementById("refreshBrokersBtn")?.addEventListener("click", async () => {
  brokers = await window.YoloFirebase.fetchBrokers();
  renderBrokers();
});

document.getElementById("seedBrokersBtn")?.addEventListener("click", async () => {
  if (!confirm("Import seed madalali (20) into Supabase?")) return;
  try {
    const seed = await fetch("/shared/seed-brokers.json").then((r) => {
      if (!r.ok) throw new Error("Could not load seed-brokers.json");
      return r.json();
    });
    const n = await window.YoloFirebase.seedBrokersFromJson(seed);
    brokers = await window.YoloFirebase.fetchBrokers();
    renderBrokers();
    alert(`Imported ${n} madalali.`);
  } catch (err) {
    alert(err.message || "Import failed — run shared/setup-crm-and-seed-brokers.sql in Supabase first.");
  }
});

async function maybeAutoSeedBrokers() {
  const params = new URLSearchParams(location.search);
  if (params.get("seedBrokers") !== "1") return;
  try {
    const seed = await fetch("/shared/seed-brokers.json").then((r) => r.json());
    const n = await window.YoloFirebase.seedBrokersFromJson(seed);
    brokers = await window.YoloFirebase.fetchBrokers();
    renderBrokers();
    showPanel("brokers");
    history.replaceState({}, "", "/admin/");
    alert(`Imported ${n} madalali.`);
  } catch (err) {
    alert(err.message || "Auto-import failed");
  }
}

document.getElementById("brokersGrid")?.addEventListener("click", async (e) => {
  const editId = e.target.getAttribute("data-broker-edit");
  const delId = e.target.getAttribute("data-broker-del");
  if (editId) {
    editBroker(editId);
    return;
  }
  if (delId) {
    if (!confirm("Futa dalali huyu?")) return;
    try {
      await window.YoloFirebase.deleteBroker(delId);
      brokers = await window.YoloFirebase.fetchBrokers();
      renderBrokers();
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  }
});

setSetupNotice();
renderGalleryPreview();
renderVideoPreview();

if (window.YoloFirebase?.isConfigured()) {
  window.YoloFirebase.init();
  window.YoloFirebase.onAuth((user) => {
    if (user) showDashboard(user);
    else showLogin();
  });
} else {
  showLogin();
}
