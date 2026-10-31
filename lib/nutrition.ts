import {
  catalogFoods,
  catalogMetadata,
  CURRENT_CATALOG_VERSION,
} from "./catalog.ts";
import type {
  CatalogVersion,
  Submission,
  FoodItem,
  Nutrients,
} from "./types.ts";

export const NUTRIENT_KEYS = [
  "calories",
  "protein",
  "carbs",
  "fat",
  "fiber",
] as const;
export function versionForRecord(
  record: Pick<Submission, "catalogVersion">,
): CatalogVersion {
  return record.catalogVersion === "personal-v4"
    ? "personal-v4"
    : record.catalogVersion === "personal-v3"
      ? "personal-v3"
      : record.catalogVersion === "tkpi-2020-v2"
        ? "tkpi-2020-v2"
        : "demo-v1";
}
export function metadataFor(version: CatalogVersion) {
  return catalogMetadata(version);
}
export function foodFor(
  id: string | null,
  version: CatalogVersion = CURRENT_CATALOG_VERSION,
) {
  return catalogFoods(version).find((f) => f.id === id);
}
export function costFor(
  item: FoodItem,
  version: CatalogVersion = CURRENT_CATALOG_VERSION,
) {
  const food = foodFor(item.foodId, version);
  if (!food) return null;
  return (
    (food.ingredients.reduce(
      (sum, i) => sum + (i.grams / 1000) * i.pricePerKg,
      0,
    ) *
      item.grams) /
    100
  );
}
export function summarize(
  items: FoodItem[],
  version: CatalogVersion = CURRENT_CATALOG_VERSION,
) {
  const nutrients: Nutrients = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  };
  let cost = 0;
  let unmatched = 0;
  for (const item of items) {
    const food = foodFor(item.foodId, version);
    const per100g = food?.per100g ?? item.customNutrients;
    if (!per100g) {
      unmatched++;
      continue;
    }
    for (const key of NUTRIENT_KEYS)
      nutrients[key] += (per100g[key] * item.grams) / 100;
    cost += costFor(item, version) ?? 0;
  }
  return {
    nutrients,
    cost: Math.round(cost),
    unmatched,
    groups: [
      ...new Set(
        items.map((i) => foodFor(i.foodId, version)?.group).filter(Boolean),
      ),
    ],
  };
}
// Deliberately simple coverage illustration: capped average of five target ratios.
// It does not assess upper limits, food safety, or official nutrition compliance.
export function coverageScore(actual: Nutrients, target: Nutrients) {
  return Math.round(
    (NUTRIENT_KEYS.reduce(
      (sum, key) =>
        sum + Math.min(1, Math.max(0, actual[key]) / Math.max(1, target[key])),
      0,
    ) /
      NUTRIENT_KEYS.length) *
      100,
  );
}
export function money(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
export function number(value: number) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(
    value,
  );
}
