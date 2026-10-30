import "./load-catalog.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { costFor, coverageScore, summarize } from "../lib/nutrition.ts";
import { DEFAULT_SETTINGS, DEMOS } from "../lib/catalog-seed.ts";
test("raw ingredient quantities and edible portion determine cost", () => {
  assert.equal(
    costFor(
      { foodId: "ayam-goreng", label: "Ayam", grams: 75 },
      "tkpi-2020-v2",
    ),
    4125,
  );
  assert.equal(
    costFor({ foodId: "nasi", label: "Nasi", grams: 150 }, "tkpi-2020-v2"),
    900,
  );
});
test("meal totals combine ingredient costs and cooked food nutrients", () => {
  const result = summarize(DEMOS[0].items, "tkpi-2020-v2");
  assert.equal(result.cost, 9465);
  assert.ok(Math.abs(result.nutrients.protein - 26.15) < 1e-8);
  assert.equal(result.nutrients.calories, 433.5);
  assert.equal(result.unmatched, 0);
});
test("unknown food remains unpriced and marks an incomplete total", () => {
  const unknown = {
    foodId: "unknown-dish",
    label: "Masakan belum dikenal",
    grams: 100,
  };
  assert.equal(costFor(unknown), null);
  const result = summarize(
    [{ foodId: "nasi", label: "Nasi", grams: 100 }, unknown],
    "tkpi-2020-v2",
  );
  assert.equal(result.cost, 600);
  assert.equal(result.unmatched, 1);
  assert.equal(result.nutrients.protein, 3);
});
test("demo coverage stays capped and an empty meal gets zero", () => {
  const target = DEFAULT_SETTINGS.targets;
  assert.equal(coverageScore(target, target), 100);
  assert.equal(
    coverageScore(
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      target,
    ),
    0,
  );
  assert.equal(
    coverageScore(
      { calories: 5000, protein: 200, carbs: 650, fat: 180, fiber: 50 },
      target,
    ),
    100,
  );
});
