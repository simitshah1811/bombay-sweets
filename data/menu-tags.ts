import { MENU_ITEMS } from "./menu";
import type { MenuItem } from "./types";

/**
 * Curatorial UI classification layer, kept separate from the factual menu
 * data in menu.ts. Tags are derived from each item's existing name/
 * description/category — they never assert new facts about a dish, only
 * how it surfaces in the "what are you craving" discovery UI.
 */
export interface ItemTags {
  spiceLevel: 0 | 1 | 2 | 3;
  veg: boolean;
  proteinForward: boolean;
  dessert: boolean;
  comfort: boolean;
  light: boolean;
  snackable: boolean;
}

const NON_VEG_WORDS = /chicken|lamb|prawn|shrimp|fish|goat|keema|mutton|egg/i;
const PROTEIN_WORDS = /chicken|lamb|prawn|fish|goat|keema|paneer|chaap|dal\b|channa|chickpea|kofta/i;

const HOT_WORDS = /vindaloo|achaari|chilli|jalfrezi|kadahi/i;
const MEDIUM_WORDS = /tikka masala|masala|do piaza|rogan\s*josh|saag|manchurian|noodles|curry/i;
const MILD_WORDS = /korma|malai|butter|makhni|coconut|mango|tikka/i;

const ZERO_SPICE_CATEGORIES = new Set([
  "breads",
  "rice-specials",
  "beverages",
  "sweets",
  "tidbits",
  "namkeen-snacks",
]);

const SNACKABLE_CATEGORIES = new Set([
  "appetizers",
  "chaat-specials",
  "namkeen-snacks",
  "tidbits",
  "indian-style-burger",
]);

const LIGHT_CATEGORIES = new Set(["chaat-specials", "tidbits", "appetizers", "namkeen-snacks"]);
const LIGHT_ITEM_OVERRIDES = new Set(["plain-steamed-rice", "pulao", "coconut-rice", "zeera-rice"]);

const COMFORT_CATEGORIES = new Set([
  "chicken-specialties",
  "lamb-specialties",
  "prawn-specialties",
  "vegetarian-specialties",
  "rice-specials",
  "breads",
  "indo-chinese",
  "indian-style-burger",
]);

function computeSpiceLevel(item: MenuItem): ItemTags["spiceLevel"] {
  if (item.categoryId === "beverages" || item.categoryId === "sweets") return 0;
  const text = `${item.name} ${item.description ?? ""}`;
  if (HOT_WORDS.test(text)) return 3;
  if (MEDIUM_WORDS.test(text)) return 2;
  if (MILD_WORDS.test(text)) return 1;
  if (ZERO_SPICE_CATEGORIES.has(item.categoryId)) return 0;
  return 0;
}

export const MENU_TAGS: Record<string, ItemTags> = Object.fromEntries(
  MENU_ITEMS.map((item) => {
    const text = `${item.name} ${item.description ?? ""}`;
    const tags: ItemTags = {
      spiceLevel: computeSpiceLevel(item),
      veg: !NON_VEG_WORDS.test(text),
      proteinForward: PROTEIN_WORDS.test(text),
      dessert: item.categoryId === "sweets",
      comfort: COMFORT_CATEGORIES.has(item.categoryId),
      light: LIGHT_ITEM_OVERRIDES.has(item.id) || LIGHT_CATEGORIES.has(item.categoryId),
      snackable: SNACKABLE_CATEGORIES.has(item.categoryId),
    };
    return [item.id, tags];
  })
);

export function getItemTags(id: string): ItemTags {
  return (
    MENU_TAGS[id] ?? {
      spiceLevel: 0,
      veg: true,
      proteinForward: false,
      dessert: false,
      comfort: false,
      light: false,
      snackable: false,
    }
  );
}
