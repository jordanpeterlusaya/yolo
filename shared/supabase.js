/**
 * Shared Supabase helpers for User + Admin sites.
 * Requires: @supabase/supabase-js CDN + supabase-config.js
 */
(function (global) {
  const PLACEHOLDER_URL = "YOUR_SUPABASE_URL";
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
  const MAX_IMAGES = 12;

  function isConfigured() {
    const c = global.SUPABASE_CONFIG;
    return !!(c && c.url && c.url !== PLACEHOLDER_URL && c.anonKey && !c.anonKey.includes("YOUR_"));
  }

  let client = null;

  function getClient() {
    if (!isConfigured()) return null;
    if (client) return client;
    if (!global.supabase?.createClient) {
      console.error("Supabase JS SDK not loaded");
      return null;
    }
    client = global.supabase.createClient(
      global.SUPABASE_CONFIG.url,
      global.SUPABASE_CONFIG.anonKey,
      { auth: { persistSession: true, autoRefreshToken: true } }
    );
    return client;
  }

  function ensure() {
    const c = getClient();
    if (!c) throw new Error("Supabase is not configured. Edit shared/supabase-config.js");
    return c;
  }

  function normalizeImages(row) {
    const fromArr = Array.isArray(row.images)
      ? row.images.filter((u) => typeof u === "string" && u.trim())
      : [];
    if (fromArr.length) return fromArr.map((u) => u.trim());
    if (row.image && String(row.image).trim()) return [String(row.image).trim()];
    return [];
  }

  function mapRow(row) {
    const images = normalizeImages(row);
    return {
      id: row.id,
      title: row.title || "",
      description: row.description || "",
      price: Number(row.price) || 0,
      listingType: row.listing_type || "rent",
      propertyType: row.property_type || "house",
      location: row.location || "",
      city: row.city || "",
      bedrooms: Number(row.bedrooms) || 0,
      bathrooms: Number(row.bathrooms) || 0,
      area: Number(row.area) || 0,
      image: images[0] || row.image || "",
      images,
      video: row.video || "",
      featured: !!row.featured,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || null,
    };
  }

  function toDb(data) {
    const images = Array.isArray(data.images)
      ? data.images.map((u) => String(u).trim()).filter(Boolean).slice(0, MAX_IMAGES)
      : [];
    const cover = images[0] || (data.image ? String(data.image).trim() : "");

    const payload = {
      title: String(data.title || "").trim(),
      description: String(data.description || "").trim(),
      price: Number(data.price) || 0,
      listing_type: "rent",
      property_type: data.propertyType || "house",
      location: String(data.location || "").trim(),
      city: String(data.city || "").trim(),
      bedrooms: Number(data.bedrooms) || 0,
      bathrooms: Number(data.bathrooms) || 0,
      area: Number(data.area) || 0,
      featured: !!data.featured,
      updated_at: new Date().toISOString(),
    };

    if (images.length) {
      payload.images = images;
      payload.image = cover;
    } else if (cover) {
      payload.image = cover;
      payload.images = [cover];
    }

    if (data.video !== undefined) {
      payload.video = data.video ? String(data.video).trim() : null;
    }

    return payload;
  }

  async function fetchProperties() {
    const sb = ensure();
    const { data, error } = await sb
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  /** Live listen via realtime. Falls back to one-shot fetch. Returns unsubscribe. */
  function listenProperties(onData, onError) {
    const sb = ensure();
    let channel = null;

    async function load() {
      onData(await fetchProperties());
    }

    load().catch((err) => {
      console.error(err);
      if (onError) onError(err);
    });

    try {
      channel = sb
        .channel("properties-live-" + Math.random().toString(36).slice(2, 8))
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "properties" },
          () => {
            load().catch((err) => {
              console.error(err);
              if (onError) onError(err);
            });
          }
        )
        .subscribe();
    } catch (err) {
      console.warn("Realtime unavailable, using one-shot fetch", err);
    }

    return () => {
      if (channel) sb.removeChannel(channel);
    };
  }

  async function getAllProperties() {
    return fetchProperties();
  }

  async function uploadPropertyFile(file, propertyId, kind) {
    const sb = ensure();
    if (!file) throw new Error("No file selected");

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (kind === "image" || (!kind && isImage)) {
      if (!isImage) throw new Error("Please choose an image file (JPG, PNG, WebP, etc.)");
      if (file.size > MAX_IMAGE_BYTES) throw new Error("Each image must be smaller than 5 MB");
    } else if (kind === "video" || (!kind && isVideo)) {
      if (!isVideo) throw new Error("Please choose a video file (MP4, WebM)");
      if (file.size > MAX_VIDEO_BYTES) throw new Error("Video must be smaller than 50 MB");
    } else {
      throw new Error("Unsupported file type");
    }

    const ext =
      (file.name.split(".").pop() || (isVideo ? "mp4" : "jpg"))
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "") || (isVideo ? "mp4" : "jpg");
    const id = propertyId || crypto.randomUUID();
    const folder = isVideo ? "videos" : "photos";
    const path = `${id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

    const { error: uploadError } = await sb.storage.from("properties").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data } = sb.storage.from("properties").getPublicUrl(path);
    if (!data?.publicUrl) throw new Error("Could not get media URL");
    return data.publicUrl;
  }

  async function uploadPropertyImage(file, propertyId) {
    return uploadPropertyFile(file, propertyId, "image");
  }

  async function uploadPropertyVideo(file, propertyId) {
    return uploadPropertyFile(file, propertyId, "video");
  }

  async function createProperty(data) {
    const sb = ensure();
    const payload = toDb(data);
    if (!payload.image && !(payload.images && payload.images.length)) {
      throw new Error("At least one property photo is required");
    }
    payload.created_at = new Date().toISOString();
    const { data: row, error } = await sb.from("properties").insert(payload).select("id").single();
    if (error) throw error;
    return row.id;
  }

  async function updateProperty(id, data) {
    const sb = ensure();
    const payload = toDb(data);
    if (!payload.image && !(payload.images && payload.images.length)) {
      delete payload.image;
      delete payload.images;
    }
    const { error } = await sb.from("properties").update(payload).eq("id", id);
    if (error) throw error;
  }

  async function deleteProperty(id) {
    const sb = ensure();
    const { error } = await sb.from("properties").delete().eq("id", id);
    if (error) throw error;
  }

  function mapLeadRow(row) {
    return {
      id: row.id,
      clientName: row.client_name || "",
      phone: row.phone || "",
      moveDate: row.move_date || "",
      viewingDate: row.viewing_date || "",
      budget: row.budget != null ? Number(row.budget) : null,
      preferredArea: row.preferred_area || "",
      notes: row.notes || "",
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || null,
    };
  }

  function leadToDb(data) {
    return {
      client_name: String(data.clientName || "").trim(),
      phone: data.phone ? String(data.phone).trim() : null,
      move_date: data.moveDate || null,
      viewing_date: data.viewingDate || null,
      budget: data.budget != null && data.budget !== "" ? Number(data.budget) : null,
      preferred_area: String(data.preferredArea || "").trim(),
      notes: data.notes ? String(data.notes).trim() : null,
      updated_at: new Date().toISOString(),
    };
  }

  function mapBrokerRow(row) {
    return {
      id: row.id,
      name: row.name || "",
      phone: row.phone || "",
      email: row.email || "",
      areas: row.areas || "",
      active: row.active !== false,
      notes: row.notes || "",
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || null,
    };
  }

  function brokerToDb(data) {
    return {
      name: String(data.name || "").trim(),
      phone: String(data.phone || "").trim(),
      email: data.email ? String(data.email).trim() : null,
      areas: data.areas ? String(data.areas).trim() : null,
      active: data.active !== false,
      notes: data.notes ? String(data.notes).trim() : null,
      updated_at: new Date().toISOString(),
    };
  }

  async function fetchClientLeads() {
    const sb = ensure();
    const { data, error } = await sb
      .from("client_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(mapLeadRow);
  }

  async function createClientLead(data) {
    const sb = ensure();
    const payload = leadToDb(data);
    payload.created_at = new Date().toISOString();
    const { data: row, error } = await sb.from("client_leads").insert(payload).select("id").single();
    if (error) throw error;
    return row.id;
  }

  async function updateClientLead(id, data) {
    const sb = ensure();
    const { error } = await sb.from("client_leads").update(leadToDb(data)).eq("id", id);
    if (error) throw error;
  }

  async function deleteClientLead(id) {
    const sb = ensure();
    const { error } = await sb.from("client_leads").delete().eq("id", id);
    if (error) throw error;
  }

  async function fetchBrokers() {
    const sb = ensure();
    const { data, error } = await sb
      .from("brokers")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    return (data || []).map(mapBrokerRow);
  }

  async function createBroker(data) {
    const sb = ensure();
    const payload = brokerToDb(data);
    payload.created_at = new Date().toISOString();
    const { data: row, error } = await sb.from("brokers").insert(payload).select("id").single();
    if (error) throw error;
    return row.id;
  }

  async function updateBroker(id, data) {
    const sb = ensure();
    const { error } = await sb.from("brokers").update(brokerToDb(data)).eq("id", id);
    if (error) throw error;
  }

  async function deleteBroker(id) {
    const sb = ensure();
    const { error } = await sb.from("brokers").delete().eq("id", id);
    if (error) throw error;
  }

  async function seedFromJson(items) {
    const sb = ensure();
    const rows = items.map((item) => {
      const images = Array.isArray(item.images) && item.images.length
        ? item.images
        : item.image
          ? [item.image]
          : [];
      return {
        title: item.title,
        description: item.description,
        price: Number(item.price) || 0,
        listing_type: "rent",
        property_type: item.propertyType || "house",
        location: item.location,
        city: item.city,
        bedrooms: Number(item.bedrooms) || 0,
        bathrooms: Number(item.bathrooms) || 0,
        area: Number(item.area) || 0,
        image: images[0] || item.image || null,
        images,
        video: item.video || null,
        featured: !!item.featured,
        created_at: item.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });
    const { error } = await sb.from("properties").insert(rows);
    if (error) throw error;
  }

  async function signIn(email, password) {
    const sb = ensure();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const sb = ensure();
    const { error } = await sb.auth.signOut();
    if (error) throw error;
  }

  function onAuth(callback) {
    if (!isConfigured()) {
      callback(null);
      return () => {};
    }
    const sb = ensure();
    sb.auth.getSession().then(({ data }) => {
      callback(data.session?.user || null);
    });
    const { data } = sb.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });
    return () => data.subscription.unsubscribe();
  }

  global.YoloFirebase = {
    isConfigured,
    init: getClient,
    listenProperties,
    getAllProperties,
    createProperty,
    updateProperty,
    deleteProperty,
    uploadPropertyImage,
    uploadPropertyVideo,
    uploadPropertyFile,
    fetchClientLeads,
    createClientLead,
    updateClientLead,
    deleteClientLead,
    fetchBrokers,
    createBroker,
    updateBroker,
    deleteBroker,
    seedFromJson,
    signIn,
    signOut,
    onAuth,
    MAX_IMAGES,
    MAX_IMAGE_BYTES,
    MAX_VIDEO_BYTES,
  };

  global.YoloSupabase = global.YoloFirebase;
})(window);
