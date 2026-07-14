/**
 * Shared Firebase helpers for User + Admin sites.
 * Requires: firebase-app-compat, firebase-auth-compat, firebase-firestore-compat,
 *           firebase-storage-compat (admin), and firebase-config.js loaded first.
 */
(function (global) {
  const PLACEHOLDER = "YOUR_API_KEY";
  const DEFAULT_IMAGE =
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80";

  function isConfigured() {
    const c = global.FIREBASE_CONFIG;
    return !!(c && c.apiKey && c.apiKey !== PLACEHOLDER && c.projectId && c.projectId !== "YOUR_PROJECT_ID");
  }

  let app = null;
  let auth = null;
  let db = null;
  let storage = null;

  function init() {
    if (!isConfigured()) return null;
    if (app) return { app, auth, db, storage };
    if (typeof firebase === "undefined") {
      console.error("Firebase SDK not loaded");
      return null;
    }
    app = firebase.apps.length ? firebase.app() : firebase.initializeApp(global.FIREBASE_CONFIG);
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage ? firebase.storage() : null;
    return { app, auth, db, storage };
  }

  function ensure() {
    const services = init();
    if (!services) throw new Error("Firebase is not configured. Edit shared/firebase-config.js");
    return services;
  }

  function mapDoc(doc) {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title || "",
      description: data.description || "",
      price: Number(data.price) || 0,
      listingType: data.listingType || "rent",
      propertyType: data.propertyType || "house",
      location: data.location || "",
      city: data.city || "",
      bedrooms: Number(data.bedrooms) || 0,
      bathrooms: Number(data.bathrooms) || 0,
      area: Number(data.area) || 0,
      image: data.image || "",
      featured: !!data.featured,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt || null,
    };
  }

  function listenProperties(onData, onError) {
    const { db } = ensure();
    return db
      .collection("properties")
      .where("listingType", "==", "rent")
      .onSnapshot(
        (snap) => {
          const list = snap.docs.map(mapDoc);
          list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          onData(list);
        },
        (err) => {
          console.error(err);
          if (onError) onError(err);
        }
      );
  }

  async function getAllProperties() {
    const { db } = ensure();
    const snap = await db.collection("properties").where("listingType", "==", "rent").get();
    const list = snap.docs.map(mapDoc);
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }

  function normalizePayload(data) {
    const payload = {
      title: String(data.title || "").trim(),
      description: String(data.description || "").trim(),
      price: Number(data.price) || 0,
      listingType: "rent",
      propertyType: data.propertyType || "house",
      location: String(data.location || "").trim(),
      city: String(data.city || "").trim(),
      bedrooms: Number(data.bedrooms) || 0,
      bathrooms: Number(data.bathrooms) || 0,
      area: Number(data.area) || 0,
      featured: !!data.featured,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    if (data.image !== undefined && data.image !== null && String(data.image).trim()) {
      payload.image = String(data.image).trim();
    }
    return payload;
  }

  /**
   * Upload a local image file to Firebase Storage.
   * @param {File} file
   * @param {string} [propertyId]
   * @returns {Promise<string>} download URL
   */
  async function uploadPropertyImage(file, propertyId) {
    const { storage } = ensure();
    if (!storage) throw new Error("Firebase Storage SDK not loaded");
    if (!file || !file.type.startsWith("image/")) {
      throw new Error("Please choose an image file (JPG, PNG, WebP, etc.)");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Image must be smaller than 5 MB");
    }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const id = propertyId || `new_${Date.now()}`;
    const path = `properties/${id}/${Date.now()}.${ext || "jpg"}`;
    const ref = storage.ref().child(path);
    const snapshot = await ref.put(file, { contentType: file.type });
    return snapshot.ref.getDownloadURL();
  }

  async function createProperty(data) {
    const { db } = ensure();
    const payload = {
      ...normalizePayload(data),
      image: String(data.image || "").trim() || DEFAULT_IMAGE,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    const ref = await db.collection("properties").add(payload);
    return ref.id;
  }

  async function updateProperty(id, data) {
    const { db } = ensure();
    const payload = normalizePayload(data);
    // Keep existing image if none provided on edit
    if (!payload.image) delete payload.image;
    await db.collection("properties").doc(id).update(payload);
  }

  async function deleteProperty(id) {
    const { db } = ensure();
    await db.collection("properties").doc(id).delete();
  }

  async function seedFromJson(items) {
    const { db } = ensure();
    const batch = db.batch();
    items.forEach((item) => {
      const ref = db.collection("properties").doc();
      batch.set(ref, {
        title: item.title,
        description: item.description,
        price: Number(item.price) || 0,
        listingType: "rent",
        propertyType: item.propertyType || "house",
        location: item.location,
        city: item.city,
        bedrooms: Number(item.bedrooms) || 0,
        bathrooms: Number(item.bathrooms) || 0,
        area: Number(item.area) || 0,
        image: item.image,
        featured: !!item.featured,
        createdAt: firebase.firestore.Timestamp.fromDate(new Date(item.createdAt || Date.now())),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  }

  async function signIn(email, password) {
    const { auth } = ensure();
    return auth.signInWithEmailAndPassword(email, password);
  }

  async function signOut() {
    const { auth } = ensure();
    return auth.signOut();
  }

  function onAuth(callback) {
    if (!isConfigured()) {
      callback(null);
      return () => {};
    }
    const { auth } = ensure();
    return auth.onAuthStateChanged(callback);
  }

  global.YoloFirebase = {
    isConfigured,
    init,
    listenProperties,
    getAllProperties,
    createProperty,
    updateProperty,
    deleteProperty,
    uploadPropertyImage,
    seedFromJson,
    signIn,
    signOut,
    onAuth,
  };
})(window);
