import type { FoodProfile } from "./types.ts";
export function normalizedFoodName(value: string) {
  return value
    .toLocaleLowerCase("id-ID")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\bmie\b/g, "mi")
    .replace(/\bsaos\b/g, "saus")
    .replace(/\bdaging (ayam|sapi)\b/g, "$1")
    .replace(/\s+/g, " ");
}
function compatible(f: FoodProfile, text: string) {
  const words = text.split(" ");
  if (
    f.group === "Buah" &&
    ["goreng", "rebus", "kukus", "jus", "smoothie", "manisan", "keripik"].some(
      (t) => words.includes(t),
    )
  )
    return false;
  if (
    f.id === "oat" &&
    ["susu", "yogurt", "madu", "gula"].some((t) => words.includes(t))
  )
    return false;
  if (f.excludeTerms?.some((t) => words.includes(t))) return false;
  return [f.name, ...(f.aliases ?? [])].some((value) => {
    const alias = normalizedFoodName(value);
    if (text === alias) return true;
    // Accept neutral descriptions only; do not turn a different recipe into a match.
    return (
      text.startsWith(alias + " ") &&
      text
        .slice(alias.length + 1)
        .split(" ")
        .every((t) => ["matang", "masakan", "segar", "polos"].includes(t))
    );
  });
}
export function resolveFoodId(
  foods: FoodProfile[],
  id: string | null,
  label: string,
) {
  const text = normalizedFoodName(label);
  if (id) {
    const f = foods.find((f) => f.id === id);
    return f && compatible(f, text) ? f.id : null;
  }
  const candidates = foods.filter((f) => compatible(f, text));
  return candidates.length === 1 ? candidates[0].id : null;
}
