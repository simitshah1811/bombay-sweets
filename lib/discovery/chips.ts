import type { ItemTags } from "@/data/menu-tags";

export type ChipId =
  | "SPICY"
  | "SWEET"
  | "VEGETARIAN"
  | "COMFORT_FOOD"
  | "LIGHT"
  | "HIGH_PROTEIN"
  | "SNACKS"
  | "DESSERT"
  | "SURPRISE_ME";

export interface ChipDef {
  id: ChipId;
  label: string;
  ack: string;
  score: (tags: ItemTags) => number;
}

export const CHIPS: ChipDef[] = [
  { id: "SPICY", label: "Spicy", ack: "Bringing the heat.", score: (t) => t.spiceLevel * 3 },
  { id: "SWEET", label: "Sweet", ack: "Something sweet? Easy.", score: (t) => (t.dessert ? 5 : 0) },
  {
    id: "VEGETARIAN",
    label: "Vegetarian",
    ack: "Vegetarian, coming right up.",
    score: (t) => (t.veg ? 5 : -100),
  },
  { id: "COMFORT_FOOD", label: "Comfort Food", ack: "Comfort food, on it.", score: (t) => (t.comfort ? 4 : 0) },
  { id: "LIGHT", label: "Light", ack: "Keeping it light.", score: (t) => (t.light ? 4 : 0) - t.spiceLevel },
  {
    id: "HIGH_PROTEIN",
    label: "High Protein",
    ack: "Protein-forward — these deliver.",
    score: (t) => (t.proteinForward ? 4 : 0),
  },
  { id: "SNACKS", label: "Snacks", ack: "Snack mode: activated.", score: (t) => (t.snackable ? 4 : 0) },
  { id: "DESSERT", label: "Dessert", ack: "Dessert first? We won't judge.", score: (t) => (t.dessert ? 5 : 0) },
  { id: "SURPRISE_ME", label: "Surprise Me", ack: "Surprise time. Here's what we'd pick.", score: () => 0 },
];

export function getChip(id: ChipId): ChipDef {
  return CHIPS.find((c) => c.id === id)!;
}
