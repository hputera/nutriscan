export type Nutrients = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};
export type CatalogVersion =
  | "demo-v1"
  | "tkpi-2020-v2"
  | "personal-v3"
  | "personal-v4";
export type FoodItem = {
  foodId: string | null;
  label: string;
  grams: number;
  uncertain?: boolean;
};
export type Ingredient = { name: string; grams: number; pricePerKg: number };
export type NutritionReference = {
  status: "reference" | "estimate";
  title: string;
  url?: string;
  code?: string;
  page?: number;
  note: string;
};
export type FoodProfile = {
  id: string;
  name: string;
  icon: string;
  group: string;
  per100g: Nutrients;
  ingredients: Ingredient[];
  nutritionReference?: NutritionReference;
  aliases?: string[];
  excludeTerms?: string[];
};
export type Settings = {
  school: string;
  region: string;
  budget: number;
  targets: Nutrients;
};
export type Analysis = {
  items: FoodItem[];
  summary: string;
  source: "demo" | "gemini" | "manual";
  title: string;
};
export type Submission = {
  id: string;
  createdAt: string;
  analysis: Analysis;
  settings?: Settings;
  image: string | null;
  photoStored?: boolean;
  catalogVersion?: CatalogVersion;
  meal?: MealSnapshot;
  reportVersion?: 2;
  revision?: number;
  photoPending?: boolean;
};

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type UserProfile = {
  name: string;
  age: number;
  sex: "male" | "female";
  heightCm: number;
  weightKg: number;
  activity: "low" | "light" | "moderate" | "high";
  goal: "maintain" | "lose" | "gain";
  preference: "all" | "vegetarian" | "vegan";
  allergies: string[];
  restrictions: string;
  specialCare: boolean;
};
export type MealSnapshot = {
  eatenAt: string;
  mealType: MealType;
  targets: Nutrients;
  profile?: UserProfile;
};

export type MenuTemplate = {
  id: string;
  name: string;
  items: [string, number][];
  allergens: string[];
  diet: "all" | "vegetarian" | "vegan";
};
