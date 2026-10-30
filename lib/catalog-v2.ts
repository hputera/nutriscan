import type {
  Analysis,
  FoodProfile,
  Settings,
  CatalogVersion,
} from "./types.ts";
import { LEGACY_FOODS } from "./catalog-legacy.ts";
import { INGREDIENT_PRICES, PRICE_ASSUMPTIONS } from "./ingredient-prices.ts";
export const CURRENT_CATALOG_VERSION: CatalogVersion = "tkpi-2020-v2";
export const CATALOG_METADATA = {
  version: CURRENT_CATALOG_VERSION,
  region: PRICE_ASSUMPTIONS.region,
  priceDate: PRICE_ASSUMPTIONS.scenarioDate,
  source: "7 profil TKPI 2020; profil lainnya estimasi prototype",
  validated: false,
  priceStatus: "estimate",
  recipeStatus: "estimate",
  priceSource: PRICE_ASSUMPTIONS.source,
  nutritionUrl: "https://repository.kemkes.go.id/book/668",
} as const;
const REFERENCES: Record<string, Partial<FoodProfile>> = {
  nasi: {
    name: "Nasi putih",
    per100g: {
      calories: 180,
      protein: 3,
      carbs: 39.8,
      fat: 0.3,
      fiber: 0.2,
    },
    nutritionReference: {
      status: "reference",
      title: "Tabel Komposisi Pangan Indonesia (Kemenkes, 2020)",
      url: "https://repository.kemkes.go.id/book/668",
      code: "AP001",
      page: 10,
      note: "Nasi matang; berat bagian termakan.",
    },
  },
  tahu: {
    name: "Tahu goreng",
    per100g: {
      calories: 115,
      protein: 9.7,
      carbs: 2.5,
      fat: 8.5,
      fiber: 0.1,
    },
    nutritionReference: {
      status: "reference",
      title: "Tabel Komposisi Pangan Indonesia (Kemenkes, 2020)",
      url: "https://repository.kemkes.go.id/book/668",
      code: "CP062",
      page: 28,
      note: "Tahu goreng polos; bukan tahu isi atau bacem.",
    },
  },
  tempe: {
    name: "Tempe goreng",
    per100g: {
      calories: 350,
      protein: 24.5,
      carbs: 10.4,
      fat: 26.6,
      fiber: 4.2,
    },
    nutritionReference: {
      status: "reference",
      title: "Tabel Komposisi Pangan Indonesia (Kemenkes, 2020)",
      url: "https://repository.kemkes.go.id/book/668",
      code: "CP076",
      page: 28,
      note: "Tempe kedelai murni goreng; bukan mendoan atau tempe bertepung.",
    },
  },
  "telur-dadar": {
    name: "Telur dadar",
    per100g: {
      calories: 251,
      protein: 16.3,
      carbs: 1.4,
      fat: 19.4,
      fiber: 0,
    },
    nutritionReference: {
      status: "reference",
      title: "Tabel Komposisi Pangan Indonesia (Kemenkes, 2020)",
      url: "https://repository.kemkes.go.id/book/668",
      code: "HP001",
      page: 65,
      note: "Telur ayam dadar; resep aktual tetap dapat berbeda.",
    },
  },
  pepaya: {
    name: "Pepaya segar",
    per100g: {
      calories: 46,
      protein: 0.5,
      carbs: 12.2,
      fat: 0.1,
      fiber: 1.6,
    },
    nutritionReference: {
      status: "reference",
      title: "Tabel Komposisi Pangan Indonesia (Kemenkes, 2020)",
      url: "https://repository.kemkes.go.id/book/668",
      code: "ER073",
      page: 45,
      note: "Daging buah segar tanpa kulit dan biji.",
    },
  },
  pisang: {
    name: "Pisang ambon",
    per100g: {
      calories: 108,
      protein: 1,
      carbs: 24.3,
      fat: 0.8,
      fiber: 1.9,
    },
    nutritionReference: {
      status: "reference",
      title: "Tabel Komposisi Pangan Indonesia (Kemenkes, 2020)",
      url: "https://repository.kemkes.go.id/book/668",
      code: "ER074",
      page: 45,
      note: "Khusus pisang ambon segar tanpa kulit; pastikan varietasnya.",
    },
  },
  jeruk: {
    name: "Jeruk manis",
    per100g: {
      calories: 45,
      protein: 0.9,
      carbs: 11.2,
      fat: 0.2,
      fiber: 1.4,
    },
    nutritionReference: {
      status: "reference",
      title: "Tabel Komposisi Pangan Indonesia (Kemenkes, 2020)",
      url: "https://repository.kemkes.go.id/book/668",
      code: "ER039",
      page: 43,
      note: "Khusus jeruk manis segar, bagian termakan tanpa kulit.",
    },
  },
};
const ALIASES: Record<string, string[]> = {
  nasi: ["nasi putih", "nasi"],
  "ayam-goreng": ["ayam goreng"],
  "ayam-panggang": ["ayam panggang", "ayam bakar"],
  kentang: ["kentang panggang"],
  sayur: ["sayuran campur", "sayur campur", "tumis sayuran campur"],
  tempe: ["tempe goreng"],
  tahu: ["tahu goreng"],
  telur: ["telur rebus", "telur ayam rebus"],
  "telur-dadar": ["telur dadar", "telur ayam dadar"],
  ikan: ["ikan goreng"],
  bakso: ["bakso"],
  bakwan: ["bakwan sayur", "bakwan"],
  pisang: ["pisang ambon"],
  pepaya: ["pepaya", "pepaya segar"],
  jeruk: ["jeruk manis"],
  susu: ["susu uht tawar", "susu tawar"],
  mie: ["mi goreng", "mie goreng"],
  saus: ["saus"],
};
const EXCLUSIONS: Record<string, string[]> = {
  nasi: ["goreng", "kuning", "uduk", "merah", "ketan"],
  tempe: ["mendoan", "tepung", "bacem", "kering", "mentah", "rebus"],
  tahu: ["isi", "bacem", "telur", "kukus", "rebus", "mentah", "tepung"],
  "telur-dadar": ["bebek", "puyuh", "tepung"],
  bakso: ["ikan", "ayam", "aci"],
  bakwan: ["jagung", "udang"],
  susu: ["cokelat", "stroberi", "kental", "bubuk"],
  saus: ["kacang", "keju", "mayones"],
};
export const FOODS: FoodProfile[] = LEGACY_FOODS.map((food) => ({
  ...food,
  nutritionReference: {
    status: "estimate",
    title: "Estimasi prototype",
    note: "Belum memiliki padanan referensi tepat; periksa resep dan cara masak.",
  },
  ...REFERENCES[food.id],
  aliases: ALIASES[food.id],
  excludeTerms: EXCLUSIONS[food.id] ?? [],
  ingredients: food.ingredients.map((i) => ({
    ...i,
    pricePerKg: INGREDIENT_PRICES[i.name],
  })),
}));
export const DEFAULT_SETTINGS: Settings = {
  school: "SDN 47 Jakarta Selatan",
  region: "Jakarta Selatan",
  budget: 10000,
  targets: {
    calories: 500,
    protein: 20,
    carbs: 65,
    fat: 18,
    fiber: 5,
  },
};
export const DEMOS: (Analysis & {
  id: string;
  image: string;
  caption: string;
})[] = [
  {
    id: "seimbang",
    title: "Ayam & sayuran",
    image: "/demo/seimbang.jpg",
    caption: "Ayam, kentang, dan sayur",
    source: "demo",
    summary:
      "Contoh tersimpan dari referensi: ayam, kentang panggang, sayuran campur, dan saus. Porsi di bawah adalah asumsi demo yang bisa dikoreksi.",
    items: [
      {
        foodId: "ayam-goreng",
        label: "Ayam goreng",
        grams: 75,
      },
      {
        foodId: "kentang",
        label: "Kentang panggang",
        grams: 150,
      },
      {
        foodId: "sayur",
        label: "Sayuran campur",
        grams: 100,
      },
      {
        foodId: "saus",
        label: "Saus",
        grams: 15,
      },
    ],
  },
  {
    id: "mbg",
    title: "Menu MBG",
    image: "/demo/mbg.jpg",
    caption: "Nasi, lauk, dan sayuran",
    source: "demo",
    summary:
      "Contoh tersimpan dari referensi menu MBG. Identitas lauk dan berat merupakan asumsi demo; ubah sesuai makanan yang sebenarnya sebelum menyimpan.",
    items: [
      {
        foodId: "nasi",
        label: "Nasi putih",
        grams: 150,
      },
      {
        foodId: "telur-dadar",
        label: "Telur dadar",
        grams: 40,
        uncertain: true,
      },
      {
        foodId: "tahu",
        label: "Tahu goreng",
        grams: 40,
      },
      {
        foodId: "bakso",
        label: "Bakso",
        grams: 35,
      },
      {
        foodId: "sayur",
        label: "Sayuran campur",
        grams: 35,
      },
    ],
  },
  {
    id: "gorengan",
    title: "Menu gorengan",
    image: "/demo/gorengan.jpg",
    caption: "Contoh menu kurang bervariasi",
    source: "demo",
    summary:
      "Contoh tersimpan menu gorengan. Jenis dan berat gorengan adalah asumsi demo. Foto saja tidak memastikan resep, minyak, atau berat sebenarnya.",
    items: [
      {
        foodId: "bakwan",
        label: "Bakwan sayur",
        grams: 150,
      },
      {
        foodId: "tempe",
        label: "Tempe goreng",
        grams: 50,
      },
      {
        foodId: "tahu",
        label: "Tahu goreng",
        grams: 50,
      },
    ],
  },
];
// Reject generic or conflicting preparation names from AI; leave unmatched items visible.
export function matchFoodId(id: string | null, label: string): string | null {
  const food = FOODS.find((f) => f.id === id);
  if (!food) return null;
  const normalized = label
    .toLocaleLowerCase("id-ID")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const tokens = normalized.split(" ");
  if (food.excludeTerms?.some((term) => tokens.includes(term))) return null;
  return food.aliases?.some(
    (alias) => normalized === alias || normalized.startsWith(alias + " "),
  )
    ? food.id
    : null;
}
