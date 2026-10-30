import type { FoodProfile } from "./types.ts";
// Frozen original prototype values: keep historical calculations reproducible.
export const LEGACY_FOODS: FoodProfile[] = [
  {
    id: "nasi",
    name: "Nasi putih",
    icon: "🍚",
    group: "Karbohidrat",
    per100g: {
      calories: 175,
      protein: 3.2,
      carbs: 40,
      fat: 0.3,
      fiber: 0.2,
    },
    ingredients: [
      {
        name: "Beras",
        grams: 40,
        pricePerKg: 15000,
      },
    ],
  },
  {
    id: "ayam-goreng",
    name: "Ayam goreng",
    icon: "🍗",
    group: "Protein hewani",
    per100g: {
      calories: 260,
      protein: 27,
      carbs: 5,
      fat: 14.5,
      fiber: 0,
    },
    ingredients: [
      {
        name: "Ayam mentah (alokasi bagian termakan)",
        grams: 135,
        pricePerKg: 38000,
      },
      {
        name: "Minyak goreng",
        grams: 8,
        pricePerKg: 20000,
      },
      {
        name: "Bumbu ayam",
        grams: 7,
        pricePerKg: 30000,
      },
    ],
  },
  {
    id: "ayam-panggang",
    name: "Ayam panggang",
    icon: "🍗",
    group: "Protein hewani",
    per100g: {
      calories: 210,
      protein: 29,
      carbs: 3,
      fat: 9,
      fiber: 0,
    },
    ingredients: [
      {
        name: "Ayam mentah (alokasi bagian termakan)",
        grams: 130,
        pricePerKg: 38000,
      },
      {
        name: "Bumbu panggang",
        grams: 10,
        pricePerKg: 25000,
      },
    ],
  },
  {
    id: "kentang",
    name: "Kentang panggang",
    icon: "🥔",
    group: "Karbohidrat",
    per100g: {
      calories: 120,
      protein: 2.5,
      carbs: 22,
      fat: 2.5,
      fiber: 2,
    },
    ingredients: [
      {
        name: "Kentang",
        grams: 120,
        pricePerKg: 18000,
      },
      {
        name: "Minyak goreng",
        grams: 3,
        pricePerKg: 20000,
      },
    ],
  },
  {
    id: "sayur",
    name: "Sayuran campur",
    icon: "🥬",
    group: "Sayur",
    per100g: {
      calories: 45,
      protein: 2,
      carbs: 7,
      fat: 1,
      fiber: 3,
    },
    ingredients: [
      {
        name: "Wortel",
        grams: 45,
        pricePerKg: 15000,
      },
      {
        name: "Buncis",
        grams: 40,
        pricePerKg: 18000,
      },
      {
        name: "Jagung",
        grams: 20,
        pricePerKg: 12000,
      },
      {
        name: "Bumbu sayur",
        grams: 3,
        pricePerKg: 25000,
      },
    ],
  },
  {
    id: "tempe",
    name: "Tempe goreng",
    icon: "🫘",
    group: "Protein nabati",
    per100g: {
      calories: 290,
      protein: 19,
      carbs: 14,
      fat: 18,
      fiber: 2,
    },
    ingredients: [
      {
        name: "Tempe",
        grams: 110,
        pricePerKg: 18000,
      },
      {
        name: "Minyak goreng",
        grams: 10,
        pricePerKg: 20000,
      },
      {
        name: "Bumbu",
        grams: 4,
        pricePerKg: 25000,
      },
    ],
  },
  {
    id: "tahu",
    name: "Tahu goreng",
    icon: "🧈",
    group: "Protein nabati",
    per100g: {
      calories: 170,
      protein: 11,
      carbs: 5,
      fat: 12,
      fiber: 0.5,
    },
    ingredients: [
      {
        name: "Tahu",
        grams: 120,
        pricePerKg: 14000,
      },
      {
        name: "Minyak goreng",
        grams: 8,
        pricePerKg: 20000,
      },
      {
        name: "Bumbu",
        grams: 4,
        pricePerKg: 25000,
      },
    ],
  },
  {
    id: "telur",
    name: "Telur rebus",
    icon: "🥚",
    group: "Protein hewani",
    per100g: {
      calories: 155,
      protein: 13,
      carbs: 1.1,
      fat: 11,
      fiber: 0,
    },
    ingredients: [
      {
        name: "Telur (termasuk susut cangkang)",
        grams: 115,
        pricePerKg: 30000,
      },
    ],
  },
  {
    id: "telur-dadar",
    name: "Telur dadar",
    icon: "🍳",
    group: "Protein hewani",
    per100g: {
      calories: 220,
      protein: 14,
      carbs: 2,
      fat: 17,
      fiber: 0.2,
    },
    ingredients: [
      {
        name: "Telur",
        grams: 110,
        pricePerKg: 30000,
      },
      {
        name: "Minyak goreng",
        grams: 6,
        pricePerKg: 20000,
      },
      {
        name: "Bumbu",
        grams: 5,
        pricePerKg: 25000,
      },
    ],
  },
  {
    id: "ikan",
    name: "Ikan goreng",
    icon: "🐟",
    group: "Protein hewani",
    per100g: {
      calories: 220,
      protein: 26,
      carbs: 2,
      fat: 12,
      fiber: 0,
    },
    ingredients: [
      {
        name: "Ikan mentah (alokasi bagian termakan)",
        grams: 140,
        pricePerKg: 36000,
      },
      {
        name: "Minyak goreng",
        grams: 8,
        pricePerKg: 20000,
      },
      {
        name: "Bumbu ikan",
        grams: 6,
        pricePerKg: 30000,
      },
    ],
  },
  {
    id: "bakso",
    name: "Bakso",
    icon: "🧆",
    group: "Protein hewani",
    per100g: {
      calories: 200,
      protein: 11,
      carbs: 20,
      fat: 8,
      fiber: 0.3,
    },
    ingredients: [
      {
        name: "Daging sapi",
        grams: 45,
        pricePerKg: 130000,
      },
      {
        name: "Tepung tapioka",
        grams: 20,
        pricePerKg: 14000,
      },
      {
        name: "Bumbu bakso",
        grams: 5,
        pricePerKg: 25000,
      },
    ],
  },
  {
    id: "bakwan",
    name: "Bakwan sayur",
    icon: "🥟",
    group: "Gorengan",
    per100g: {
      calories: 270,
      protein: 5,
      carbs: 35,
      fat: 12,
      fiber: 2,
    },
    ingredients: [
      {
        name: "Tepung terigu",
        grams: 45,
        pricePerKg: 13000,
      },
      {
        name: "Sayuran",
        grams: 35,
        pricePerKg: 15000,
      },
      {
        name: "Minyak goreng",
        grams: 12,
        pricePerKg: 20000,
      },
      {
        name: "Bumbu",
        grams: 5,
        pricePerKg: 25000,
      },
    ],
  },
  {
    id: "pisang",
    name: "Pisang",
    icon: "🍌",
    group: "Buah",
    per100g: {
      calories: 90,
      protein: 1,
      carbs: 23,
      fat: 0.3,
      fiber: 2.5,
    },
    ingredients: [
      {
        name: "Pisang (termasuk susut kulit)",
        grams: 150,
        pricePerKg: 18000,
      },
    ],
  },
  {
    id: "pepaya",
    name: "Pepaya",
    icon: "🍈",
    group: "Buah",
    per100g: {
      calories: 43,
      protein: 0.5,
      carbs: 11,
      fat: 0.3,
      fiber: 1.7,
    },
    ingredients: [
      {
        name: "Pepaya (termasuk susut kulit/biji)",
        grams: 140,
        pricePerKg: 10000,
      },
    ],
  },
  {
    id: "jeruk",
    name: "Jeruk",
    icon: "🍊",
    group: "Buah",
    per100g: {
      calories: 47,
      protein: 0.9,
      carbs: 12,
      fat: 0.1,
      fiber: 2.4,
    },
    ingredients: [
      {
        name: "Jeruk (termasuk susut kulit)",
        grams: 140,
        pricePerKg: 24000,
      },
    ],
  },
  {
    id: "susu",
    name: "Susu UHT tawar",
    icon: "🥛",
    group: "Susu",
    per100g: {
      calories: 61,
      protein: 3.2,
      carbs: 4.8,
      fat: 3.3,
      fiber: 0,
    },
    ingredients: [
      {
        name: "Susu UHT tawar",
        grams: 100,
        pricePerKg: 20000,
      },
    ],
  },
  {
    id: "mie",
    name: "Mi goreng",
    icon: "🍜",
    group: "Karbohidrat",
    per100g: {
      calories: 200,
      protein: 5,
      carbs: 28,
      fat: 7,
      fiber: 1.5,
    },
    ingredients: [
      {
        name: "Mi kering",
        grams: 45,
        pricePerKg: 18000,
      },
      {
        name: "Sayuran",
        grams: 20,
        pricePerKg: 15000,
      },
      {
        name: "Minyak goreng",
        grams: 5,
        pricePerKg: 20000,
      },
      {
        name: "Bumbu mi",
        grams: 8,
        pricePerKg: 25000,
      },
    ],
  },
  {
    id: "saus",
    name: "Saus",
    icon: "🥣",
    group: "Pelengkap",
    per100g: {
      calories: 90,
      protein: 1,
      carbs: 21,
      fat: 0.2,
      fiber: 0.5,
    },
    ingredients: [
      {
        name: "Saus siap pakai",
        grams: 100,
        pricePerKg: 20000,
      },
    ],
  },
];
