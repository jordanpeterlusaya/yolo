let properties = [];
let unsub = null;
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
      "Supabase is not configured yet. Create a project, run <code>shared/schema.sql</code>, then paste URL + anon key into <code>shared/supabase-config.js</code>.";
    show(setupNotice);
    document.querySelector("#loginForm button")?.setAttribute("disabled", "true");
    return false;
  }
  hide(setupNotice);
  document.querySelector("#loginForm button")?.removeAttribute("disabled");
  return true;
}

function showDashboard(user) {
  hide(loginBox);
  show(dashboard);
  show(logoutBtn);
  document.getElementById("authEmail").textContent = user.email || "Admin";
  startListening();
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
