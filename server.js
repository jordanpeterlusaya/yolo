const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data", "properties.json");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "yolo2026";
const WHATSAPP = "25475035540";

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

function readProperties() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeProperties(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get("/api/properties", (req, res) => {
  res.json(readProperties());
});

app.post("/api/properties", (req, res) => {
  if (req.headers.authorization !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const properties = readProperties();
  const property = {
    id: String(Date.now()),
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  properties.unshift(property);
  writeProperties(properties);
  res.status(201).json(property);
});

app.put("/api/properties/:id", (req, res) => {
  if (req.headers.authorization !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const properties = readProperties();
  const index = properties.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Not found" });
  properties[index] = { ...properties[index], ...req.body, id: req.params.id };
  writeProperties(properties);
  res.json(properties[index]);
});

app.delete("/api/properties/:id", (req, res) => {
  if (req.headers.authorization !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const properties = readProperties().filter((p) => p.id !== req.params.id);
  writeProperties(properties);
  res.json({ ok: true });
});

app.get("/api/config", (_req, res) => {
  res.json({ whatsapp: WHATSAPP, displayPhone: "075035540" });
});

app.post("/api/admin/login", (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    return res.json({ ok: true });
  }
  res.status(401).json({ error: "Wrong password" });
});

app.listen(PORT, () => {
  console.log(`YOLO Real Estate running at http://localhost:${PORT}`);
});
