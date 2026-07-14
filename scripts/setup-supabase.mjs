#!/usr/bin/env node
/**
 * Create YOLO Supabase cloud project, write config, apply schema.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/setup-supabase.mjs
 *
 * Token: https://supabase.com/dashboard/account/tokens
 */
import { writeFileSync, readFileSync, chmodSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const API = "https://api.supabase.com/v1";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const NAME = process.env.SUPABASE_PROJECT_NAME || "yolo-rentals";
const REGION = process.env.SUPABASE_REGION || "eu-central-1";
const DB_PASS =
  process.env.SUPABASE_DB_PASSWORD || `YoloRent${randomBytes(4).toString("hex")}!aA1`;

if (!TOKEN) {
  console.error("Missing SUPABASE_ACCESS_TOKEN");
  console.error("Create one at https://supabase.com/dashboard/account/tokens");
  process.exit(1);
}

async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(`${opts.method || "GET"} ${path} → ${res.status}: ${typeof body === "string" ? body : JSON.stringify(body)}`);
  }
  return body;
}

function pickAnonKey(keys) {
  if (!Array.isArray(keys)) return null;
  const byName = keys.find((k) => (k.name || "").toLowerCase() === "anon");
  if (byName) return byName.api_key || byName.key;
  const publishable = keys.find((k) => (k.type || "").toLowerCase() === "publishable" || (k.name || "").includes("anon"));
  if (publishable) return publishable.api_key || publishable.key;
  return keys[0]?.api_key || keys[0]?.key || null;
}

async function main() {
  console.log("==> Orgs");
  const orgs = await api("/organizations");
  const orgList = Array.isArray(orgs) ? orgs : orgs?.organizations || [];
  if (!orgList.length) throw new Error("No organizations. Create one at https://supabase.com/dashboard");
  const org = orgList[0];
  const orgId = org.id || org.slug;
  console.log("Using org:", org.name || orgId);

  console.log("==> Checking existing projects");
  const projects = await api("/projects");
  const projectList = Array.isArray(projects) ? projects : [];
  let project = projectList.find((p) => p.name === NAME || p.id === NAME);

  if (!project) {
    console.log(`==> Creating project ${NAME} (${REGION})`);
    project = await api("/projects", {
      method: "POST",
      body: JSON.stringify({
        name: NAME,
        organization_id: orgId,
        region: REGION,
        db_pass: DB_PASS,
        plan: "free",
      }),
    });
  } else {
    console.log("Project already exists:", project.id);
  }

  const ref = project.id || project.ref;
  if (!ref) throw new Error("No project ref returned");
  console.log("Project ref:", ref);

  writeFileSync(join(ROOT, ".supabase-db-password"), DB_PASS + "\n", { mode: 0o600 });
  try {
    chmodSync(join(ROOT, ".supabase-db-password"), 0o600);
  } catch {}

  console.log("==> Waiting for ACTIVE_HEALTHY...");
  for (let i = 0; i < 45; i++) {
    const p = await api(`/projects/${ref}`);
    console.log("  status:", p.status);
    if (String(p.status || "").includes("ACTIVE")) break;
    await new Promise((r) => setTimeout(r, 8000));
  }

  console.log("==> API keys");
  const keys = await api(`/projects/${ref}/api-keys?reveal=true`).catch(() => api(`/projects/${ref}/api-keys`));
  const anon = pickAnonKey(keys);
  if (!anon) throw new Error("Could not find anon/publishable API key: " + JSON.stringify(keys));
  const url = `https://${ref}.supabase.co`;

  writeFileSync(
    join(ROOT, "shared/supabase-config.js"),
    `/**
 * Supabase config — project: ${NAME} (${ref})
 */
window.SUPABASE_CONFIG = {
  url: "${url}",
  anonKey: "${anon}",
};

window.YOLO_WHATSAPP = "25475035540";
window.YOLO_WHATSAPP_DISPLAY = "075035540";
`
  );
  console.log("Wrote shared/supabase-config.js");
  console.log("URL:", url);

  console.log("==> Applying schema via SQL");
  const schema = readFileSync(join(ROOT, "shared/schema.sql"), "utf8");
  // Management API database query endpoint
  try {
    await api(`/projects/${ref}/database/query`, {
      method: "POST",
      body: JSON.stringify({ query: schema }),
    });
    console.log("Schema applied.");
  } catch (err) {
    console.warn("Auto schema apply failed:", err.message);
    console.warn("Paste shared/schema.sql in SQL Editor:");
    console.warn(`https://supabase.com/dashboard/project/${ref}/sql/new`);
  }

  // Create admin user via Auth Admin requires service role — print instructions
  console.log("\nDone.");
  console.log("Dashboard:", `https://supabase.com/dashboard/project/${ref}`);
  console.log("Next: Authentication → Users → Add user:");
  console.log("  email: boyzeus11@gmail.com");
  console.log("  then login at http://localhost:3000/admin/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
