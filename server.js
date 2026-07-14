const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const root = __dirname;

app.use("/shared", express.static(path.join(root, "shared")));
app.use("/assets", express.static(path.join(root, "assets")));
app.use("/user", express.static(path.join(root, "user")));
app.use("/admin", express.static(path.join(root, "admin")));

// User site at /
app.use(express.static(path.join(root, "user")));

// Convenience redirects from old paths
app.get("/admin.html", (_req, res) => res.redirect("/admin/"));
app.get("/index.html", (_req, res) => res.redirect("/"));

app.listen(PORT, () => {
  console.log(`YOLO user site  → http://localhost:${PORT}/`);
  console.log(`YOLO admin site → http://localhost:${PORT}/admin/`);
});
