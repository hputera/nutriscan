import { neon } from "@neondatabase/serverless";
import { FOODS as PERSONAL, CATALOG_METADATA } from "../lib/catalog-seed.ts";
import {
  FOODS as EXPANDED,
  CATALOG_METADATA as EXPANDED_META,
} from "../lib/catalog-expanded.ts";
import { FOODS as V2, CATALOG_METADATA as V2_META } from "../lib/catalog-v2.ts";
import { MENU_TEMPLATES } from "../lib/menu-seed.ts";
import { LEGACY_FOODS } from "../lib/catalog-legacy.ts";
if (!process.env.DATABASE_URL)
  throw new Error("Isi DATABASE_URL di .env.local.");
const sql = neon(process.env.DATABASE_URL);
await sql.transaction([
  sql`CREATE TABLE IF NOT EXISTS submissions(id uuid PRIMARY KEY,session_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),payload jsonb NOT NULL)`,
  sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1`,
  sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS photo_key text`,
  sql`CREATE INDEX IF NOT EXISTS submissions_session_created ON submissions(session_id,created_at DESC)`,
  sql`CREATE TABLE IF NOT EXISTS nutriscan_sessions(id uuid PRIMARY KEY,token_hash text NOT NULL,profile jsonb,targets jsonb,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now())`,
  sql`ALTER TABLE nutriscan_sessions ADD COLUMN IF NOT EXISTS history_cleared_at timestamptz`,
  sql`CREATE TABLE IF NOT EXISTS nutrition_catalogs(version text PRIMARY KEY,foods jsonb NOT NULL,metadata jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now())`,
  sql`CREATE TABLE IF NOT EXISTS submission_tombstones(session_id uuid NOT NULL,id uuid NOT NULL,deleted_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(session_id,id))`,
  sql`CREATE TABLE IF NOT EXISTS menu_templates(id text PRIMARY KEY,payload jsonb NOT NULL)`,
  sql`CREATE TABLE IF NOT EXISTS photo_cleanup(object_key text PRIMARY KEY,session_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now())`,
]);
for (const [version, foods, metadata] of [
  ["demo-v1", LEGACY_FOODS, { source: "Estimasi prototype versi awal" }],
  ["tkpi-2020-v2", V2, V2_META],
  ["personal-v3", PERSONAL, CATALOG_METADATA],
  ["personal-v4", EXPANDED, EXPANDED_META],
]) {
  await sql`INSERT INTO nutrition_catalogs(version,foods,metadata) VALUES (${version},${JSON.stringify(foods)}::jsonb,${JSON.stringify(metadata)}::jsonb) ON CONFLICT(version) DO NOTHING`;
}
for (const menu of MENU_TEMPLATES)
  await sql`INSERT INTO menu_templates(id,payload) VALUES(${menu.id},${JSON.stringify(menu)}::jsonb) ON CONFLICT(id) DO NOTHING`;
const counts =
  await sql`SELECT version,jsonb_array_length(foods) AS foods FROM nutrition_catalogs ORDER BY version`;
console.log(
  JSON.stringify({
    schemaReady: true,
    catalogs: counts,
    existingReportsPreserved: true,
  }),
);
