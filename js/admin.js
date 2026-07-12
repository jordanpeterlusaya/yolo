let token = sessionStorage.getItem("adminToken") || "";
let properties = [];

function showDashboard() {
  document.getElementById("loginBox").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
  document.getElementById("logoutBtn").classList.remove("hidden");
  loadProperties();
}

async function login() {
  const password = document.getElementById("password").value;
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    alert("Wrong password.");
    return;
  }
  token = password;
  sessionStorage.setItem("adminToken", password);
  showDashboard();
}

function logout() {
  token = "";
  sessionStorage.removeItem("adminToken");
  document.getElementById("loginBox").classList.remove("hidden");
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("logoutBtn").classList.add("hidden");
}

async function loadProperties() {
  properties = await fetch("/api/properties").then(r => r.json());
  document.getElementById("count").textContent = properties.length;
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = properties.map(p => `
    <tr>
      <td><img src="${p.image}" alt=""></td>
      <td>${p.title}</td>
      <td>${p.propertyType} / ${p.listingType}</td>
      <td>TZS ${p.price.toLocaleString()}</td>
      <td>
        <button class="btn btn-secondary" onclick="editProperty('${p.id}')">Edit</button>
        <button class="btn btn-danger" onclick="deleteProperty('${p.id}')">Delete</button>
      </td>
    </tr>
  `).join("");
}

function getFormData() {
  return {
    title: document.getElementById("title").value,
    description: document.getElementById("description").value,
    price: Number(document.getElementById("price").value),
    listingType: document.getElementById("listingType").value,
    propertyType: document.getElementById("propertyType").value,
    location: document.getElementById("location").value,
    city: document.getElementById("city").value,
    bedrooms: Number(document.getElementById("bedrooms").value) || 0,
    bathrooms: Number(document.getElementById("bathrooms").value) || 0,
    area: Number(document.getElementById("area").value) || 0,
    image: document.getElementById("image").value || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
    featured: document.getElementById("featured").checked,
  };
}

async function saveProperty() {
  const data = getFormData();
  if (!data.title || !data.description || !data.price || !data.location || !data.city) {
    alert("Please fill in all required fields.");
    return;
  }

  const editId = document.getElementById("editId").value;
  const url = editId ? `/api/properties/${editId}` : "/api/properties";
  const method = editId ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify(data),
  });

  if (res.status === 401) { alert("Session expired. Please login again."); logout(); return; }
  if (!res.ok) { alert("Failed to save."); return; }

  resetForm();
  loadProperties();
}

function editProperty(id) {
  const p = properties.find(x => x.id === id);
  if (!p) return;
  document.getElementById("editId").value = p.id;
  document.getElementById("title").value = p.title;
  document.getElementById("description").value = p.description;
  document.getElementById("price").value = p.price;
  document.getElementById("listingType").value = p.listingType;
  document.getElementById("propertyType").value = p.propertyType;
  document.getElementById("location").value = p.location;
  document.getElementById("city").value = p.city;
  document.getElementById("bedrooms").value = p.bedrooms;
  document.getElementById("bathrooms").value = p.bathrooms;
  document.getElementById("area").value = p.area || 0;
  document.getElementById("image").value = p.image;
  document.getElementById("featured").checked = p.featured;
  document.getElementById("formTitle").textContent = "Edit Property";
  document.getElementById("cancelBtn").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  document.getElementById("editId").value = "";
  document.getElementById("title").value = "";
  document.getElementById("description").value = "";
  document.getElementById("price").value = "";
  document.getElementById("location").value = "";
  document.getElementById("city").value = "";
  document.getElementById("bedrooms").value = "0";
  document.getElementById("bathrooms").value = "0";
  document.getElementById("area").value = "0";
  document.getElementById("image").value = "";
  document.getElementById("featured").checked = false;
  document.getElementById("formTitle").textContent = "Add Property";
  document.getElementById("cancelBtn").classList.add("hidden");
}

async function deleteProperty(id) {
  if (!confirm("Delete this property?")) return;
  const res = await fetch(`/api/properties/${id}`, {
    method: "DELETE",
    headers: { Authorization: token },
  });
  if (res.status === 401) { alert("Session expired."); logout(); return; }
  loadProperties();
}

if (token) showDashboard();

document.getElementById("password").addEventListener("keydown", (e) => {
  if (e.key === "Enter") login();
});
