import { z } from "zod";
import { FOODS, matchFoodId } from "./catalog.ts";
const nutrientSchema = z.object({
  calories: z.number().min(1).max(3000),
  protein: z.number().min(1).max(200),
  carbs: z.number().min(1).max(500),
  fat: z.number().min(1).max(200),
  fiber: z.number().min(1).max(100),
});
export const itemSchema = z
  .object({
    foodId: z.string().max(80).nullable(),
    label: z.string().trim().min(1).max(100),
    grams: z.number().min(1).max(1500),
    uncertain: z.boolean().optional(),
  })
  .transform((item) => ({
    ...item,
    foodId: FOODS.some((f) => f.id === item.foodId) ? item.foodId : null,
  }));
export const settingsSchema = z.object({
  school: z.string().trim().min(1).max(100),
  region: z.string().trim().min(1).max(80),
  budget: z.number().min(1).max(1000000),
  targets: nutrientSchema,
});
export const analysisSchema = z.object({
  items: z.array(itemSchema).max(20),
  summary: z.string().max(1200),
  source: z.enum(["demo", "gemini", "manual"]),
  title: z.string().min(1).max(100),
});
export const legacySubmissionSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  analysis: analysisSchema,
  settings: settingsSchema,
  catalogVersion: z
    .enum(["demo-v1", "tkpi-2020-v2", "personal-v3", "personal-v4"])
    .default("demo-v1"),
});
const recognizedItemSchema = itemSchema.transform((item) => {
  const foodId =
    matchFoodId(item.foodId, item.label) ?? matchFoodId(null, item.label);
  return { ...item, foodId, uncertain: item.uncertain || foodId === null };
});
export const recognitionSchema = z.object({
  is_food: z.boolean(),
  summary: z.string().max(1200),
  items: z.array(recognizedItemSchema).max(20),
});

export const profileSchema = z
  .object({
    name: z.string().trim().min(1).max(60),
    age: z.number().int().min(17).max(100),
    sex: z.enum(["male", "female"]),
    heightCm: z.number().min(100).max(230),
    weightKg: z.number().min(30).max(300),
    activity: z.enum(["low", "light", "moderate", "high"]),
    goal: z.enum(["maintain", "lose", "gain"]),
    preference: z.enum(["all", "vegetarian", "vegan"]),
    allergies: z
      .array(
        z.enum([
          "Susu",
          "Telur",
          "Kedelai",
          "Gandum/gluten",
          "Kacang tanah",
          "Kacang pohon",
          "Ikan",
          "Kerang/udang",
        ]),
      )
      .max(8),
    restrictions: z.string().trim().max(300),
    specialCare: z.boolean(),
  })
  .transform((profile) => ({
    ...profile,
    goal: profile.age < 19 ? ("maintain" as const) : profile.goal,
  }));
export const targetSchema = z.object({
  calories: z.number().min(0).max(10000),
  protein: z.number().min(0).max(1000),
  carbs: z.number().min(0).max(2000),
  fat: z.number().min(0).max(1000),
  fiber: z.number().min(0).max(200),
});
export const mealSchema = z.object({
  eatenAt: z.string().datetime(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  targets: targetSchema,
  profile: profileSchema.optional(),
});
export const personalSubmissionSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  analysis: analysisSchema,
  catalogVersion: z.enum([
    "demo-v1",
    "tkpi-2020-v2",
    "personal-v3",
    "personal-v4",
  ]),
  reportVersion: z.literal(2),
  meal: mealSchema,
});
export const submissionSchema = z.union([
  personalSubmissionSchema,
  legacySubmissionSchema,
]);

export const deleteHistorySchema = z.union([
  z.object({ id: z.string().uuid(), confirm: z.literal(true) }),
  z.object({ all: z.literal(true), confirm: z.literal(true) }),
]);
