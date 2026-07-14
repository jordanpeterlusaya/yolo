#!/usr/bin/env node
/**
 * Apply shared/migrate-media.sql to the linked Supabase project.
 * Usage: SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/apply-media-migration.mjs
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const REF = process.env.SUPABASE_PROJECT_REF || "ofckuksauvtuqfidqemj";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

if (!TOKEN) {
  console.error("Missing SUPABASE_ACCESS_TOKEN");
  process.exit(1);
}

const sql = readFileSync(join(ROOT, "shared/migrate-media.sql"), "utf8");

const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: sql }),
});

const text = await res.text();
if (!res.ok) {
  console.error("Migration failed:", res.status, text.slice(0, 800));
  process.exit(1);
}
console.log("Media migration applied successfully.");
console.log(text.slice(0, 400));
