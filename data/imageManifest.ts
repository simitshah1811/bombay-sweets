export interface ManifestImage {
  src: string;
  alt: string;
}

/**
 * Populated during the imagery pass. Dish/category entries are added as
 * real (re-encoded archival) or AI-generated photoreal images land in
 * public/images/. Until then, lookups fall back to the neutral placeholder
 * so nothing renders a broken image.
 */
export const DISH_IMAGES: Record<string, ManifestImage> = {};

export const CATEGORY_IMAGES: Record<string, ManifestImage> = {};

export const PLACEHOLDER_IMAGE: ManifestImage = {
  src: "/images/placeholder.svg",
  alt: "Bombay Sweets",
};

export function getDishImage(itemId: string, categoryId: string): ManifestImage {
  return DISH_IMAGES[itemId] ?? CATEGORY_IMAGES[categoryId] ?? PLACEHOLDER_IMAGE;
}
