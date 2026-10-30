import "server-only";
import { neon } from "@neondatabase/serverless";
import { installCatalogs, type CatalogBundle } from "./catalog";
export function db() {
  if (!process.env.DATABASE_URL)
    throw new Error("Database belum dikonfigurasi.");
  return neon(process.env.DATABASE_URL);
}
let catalogUntil = 0;
let catalogCache: CatalogBundle[] = [];
let inFlight: Promise<CatalogBundle[]> | null = null;
export async function databaseCatalogs() {
  if (Date.now() < catalogUntil) return catalogCache;
  if (!inFlight)
    inFlight = (async () => {
      const rows =
        await db()`SELECT version,foods,metadata FROM nutrition_catalogs`;
      const bundles = rows as CatalogBundle[];
      installCatalogs(bundles);
      catalogCache = bundles;
      catalogUntil = Date.now() + 60000;
      return bundles;
    })().finally(() => {
      inFlight = null;
    });
  return inFlight;
}
