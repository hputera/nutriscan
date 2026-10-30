import "./load-catalog.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { FOODS, CURRENT_CATALOG_VERSION, matchFoodId } from "../lib/catalog.ts";
import { INGREDIENT_PRICES } from "../lib/ingredient-prices.ts";
import { summarize, versionForRecord } from "../lib/nutrition.ts";
import {
  analysisSchema,
  recognitionSchema,
  submissionSchema,
} from "../lib/validation.ts";
import { FOODS as V2_FOODS } from "../lib/catalog-v2.ts";
import { DEFAULT_SETTINGS } from "../lib/catalog-seed.ts";

test("seven TKPI transcriptions retain row codes and per-100g edible values", () => {
  const rows = [
    ["nasi", "AP001", 180, 3, 39.8, 0.3, 0.2],
    ["tahu", "CP062", 115, 9.7, 2.5, 8.5, 0.1],
    ["tempe", "CP076", 350, 24.5, 10.4, 26.6, 4.2],
    ["telur-dadar", "HP001", 251, 16.3, 1.4, 19.4, 0],
    ["pepaya", "ER073", 46, 0.5, 12.2, 0.1, 1.6],
    ["pisang", "ER074", 108, 1, 24.3, 0.8, 1.9],
    ["jeruk", "ER039", 45, 0.9, 11.2, 0.2, 1.4],
  ];
  assert.equal(
    FOODS.filter((f) => f.nutritionReference?.status === "reference").length,
    42,
  );
  for (const [id, code, calories, protein, carbs, fat, fiber] of rows) {
    const f = FOODS.find((f) => f.id === id)!;
    assert.equal(f.nutritionReference?.code, code);
    assert.deepEqual(f.per100g, { calories, protein, carbs, fat, fiber });
  }
});
test("recipe estimates use a single consistent price per ingredient", () => {
  for (const f of V2_FOODS) {
    assert.ok(f.nutritionReference);
    for (const i of f.ingredients) {
      assert.equal(i.pricePerKg, INGREDIENT_PRICES[i.name]);
      assert.ok(i.grams > 0 && i.pricePerKg >= 0);
    }
  }
});
test("old unversioned records retain original nutrients, while new records use reference values", () => {
  const items = [
    { foodId: "nasi", label: "Nasi putih", grams: 150 },
    { foodId: "tahu", label: "Tahu goreng", grams: 100 },
  ];
  const old = summarize(items, versionForRecord({}));
  const updated = summarize(items, CURRENT_CATALOG_VERSION);
  assert.equal(old.nutrients.calories, 432.5);
  assert.equal(updated.nutrients.calories, 385);
  assert.equal(summarize(items, "tkpi-2020-v2").cost, old.cost);
  assert.equal(updated.cost, 0);
  assert.equal(
    versionForRecord({ catalogVersion: CURRENT_CATALOG_VERSION }),
    CURRENT_CATALOG_VERSION,
  );
});
test("recognition rejects missing preparation, incompatible dishes and unspecified varieties", () => {
  for (const [id, label] of [
    ["sayur", "Sayur terong"],
    ["tahu", "Tahu"],
    ["tahu", "Tahu goreng isi"],
    ["tempe", "Tempe goreng tepung"],
    ["pisang", "Pisang"],
    ["nasi", "Nasi goreng"],
    ["bakwan", "Bakwan jagung"],
  ])
    assert.equal(matchFoodId(id, label), null, label);
  assert.equal(matchFoodId("tahu", "Tahu goreng"), "tahu");
  assert.equal(matchFoodId("pisang", "Pisang ambon segar"), "pisang");
  const r = recognitionSchema.parse({
    is_food: true,
    summary: "Perkiraan",
    items: [{ foodId: "sayur", label: "Sayur terong", grams: 50 }],
  });
  assert.equal(r.items[0].foodId, null);
  assert.equal(r.items[0].uncertain, true);
});
test("legacy analysis remains readable and submissions carry an explicit supported data version", () => {
  const analysis = {
    items: [{ foodId: "sayur", label: "Sayur terong", grams: 50 }],
    summary: "Lama",
    source: "manual",
    title: "Lama",
  };
  assert.equal(analysisSchema.parse(analysis).items[0].foodId, "sayur");
  const body = {
    id: "f5c6f354-c3ac-4d65-b19d-3d51741a09ec",
    createdAt: "2026-10-29T12:00:00Z",
    analysis,
    settings: DEFAULT_SETTINGS,
  };
  assert.equal(submissionSchema.parse(body).catalogVersion, "demo-v1");
  assert.equal(
    submissionSchema.parse({ ...body, catalogVersion: CURRENT_CATALOG_VERSION })
      .catalogVersion,
    CURRENT_CATALOG_VERSION,
  );
  assert.equal(
    submissionSchema.safeParse({ ...body, catalogVersion: "future-unknown" })
      .success,
    false,
  );
});

// Regression cases from everyday scan labels, not fuzzy recipe substitution.
test("scan resolves unique Indonesian names when AI leaves the food ID blank", () => {
  const cases: [[string, string], ...[string, string][]] = [
    ["Mie bakso", "mi-bakso"],
    ["Ayam teriyaki", "chicken-teriyaki"],
    ["Daging sapi yakiniku", "beef-yakiniku"],
    ["Rendang daging sapi", "rendang-sapi"],
    ["Soto Betawi", "soto-betawi"],
    ["Saos tomat", "saus-tomat"],
    ["Nasi putih matang", "nasi"],
    ["Mun tahu", "moon-tahu"],
  ];
  for (const [label, id] of cases) {
    const r = recognitionSchema.parse({
      is_food: true,
      summary: "Periksa porsi.",
      items: [{ foodId: null, label, grams: 100 }],
    });
    assert.equal(r.items[0].foodId, id, label);
  }
});
test("a wrong AI ID can recover only an explicit unique recipe, while unknown recipes stay visible", () => {
  const r = recognitionSchema.parse({
    is_food: true,
    summary: "",
    items: [
      { foodId: "nasi", label: "Mi bakso", grams: 100 },
      { foodId: "nasi", label: "Nasi putih goreng", grams: 100 },
      { foodId: null, label: "Sushi spesial", grams: 100 },
      { foodId: null, label: "Jus jambu biji", grams: 100 },
      { foodId: null, label: "Tahu goreng saus kacang", grams: 100 },
    ],
  });
  assert.equal(r.items[0].foodId, "mi-bakso");
  for (const item of r.items.slice(1)) {
    assert.equal(item.foodId, null);
    assert.equal(item.uncertain, true);
  }
});
test("ambiguous aliases are not resolved automatically", async () => {
  const { resolveFoodId } = await import("../lib/food-matching.ts");
  const f = FOODS.find((f) => f.id === "nasi")!;
  assert.equal(
    resolveFoodId(
      [
        { ...f, id: "one" },
        { ...f, id: "two" },
      ],
      null,
      "Nasi putih",
    ),
    null,
  );
});
test("expanded references keep source codes and old report catalogs remain unchanged", async () => {
  const { FOODS: old } = await import("../lib/catalog-seed.ts");
  const { ADDED_FOODS } = await import("../lib/catalog-expanded.ts");
  const { catalogFoods } = await import("../lib/catalog.ts");
  assert.equal(old.length, 46);
  assert.equal(ADDED_FOODS.length, 32);
  assert.deepEqual(catalogFoods("personal-v3"), old);
  assert.equal(
    versionForRecord({ catalogVersion: "personal-v4" }),
    "personal-v4",
  );
  assert.equal(new Set(FOODS.map((f) => f.id)).size, 78);
  for (const f of ADDED_FOODS) {
    assert.equal(f.nutritionReference?.status, "reference");
    assert.match(f.nutritionReference?.code ?? "", /^[A-Z]{2}\d{3}$/);
    assert.ok(f.nutritionReference?.page);
    assert.ok(
      Object.values(f.per100g).every((n) => Number.isFinite(n) && n >= 0),
    );
    assert.equal(matchFoodId(f.id, f.name), f.id);
  }
  const t = summarize(
    [
      { foodId: "mi-bakso", label: "Mi bakso", grams: 100 },
      { foodId: "rendang-sapi", label: "Rendang sapi", grams: 100 },
    ],
    "personal-v4",
  );
  assert.equal(t.unmatched, 0);
  assert.equal(t.nutrients.calories, 307);
  assert.equal(
    summarize(
      [{ foodId: "mi-bakso", label: "Mi bakso", grams: 100 }],
      "personal-v3",
    ).unmatched,
    1,
  );
});

test("different dishes and meat species never reuse similar-looking source rows", () => {
  for (const label of [
    "Mi rebus",
    "Nasi tim",
    "Lapis ketan",
    "Dimsum ayam",
    "Dendeng sapi",
    "Lawar babi",
    "Lawar penyu",
  ]) {
    assert.equal(matchFoodId(null, label), null, label);
  }
  assert.equal(matchFoodId(null, "Mi bakso"), "mi-bakso");
  assert.equal(matchFoodId(null, "Nasi minyak"), "nasi-minyak");
  assert.equal(matchFoodId(null, "Lupis ketan"), "lupis-ketan");
  assert.deepEqual(FOODS.find((f) => f.id === "beef-teriyaki")?.per100g, {
    calories: 151,
    protein: 8.6,
    carbs: 22.3,
    fat: 3.1,
    fiber: 0.3,
  });
});
