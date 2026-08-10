export interface ManifestImage {
  src: string;
  alt: string;
}

/**
 * Populated during the imagery pass. Dish/category entries are added as
 * real (re-encoded archival) or AI-generated photoreal images land in
 * public/images/. Lookups fall back to the neutral placeholder so nothing
 * renders a broken image where coverage is still incomplete.
 */
export const DISH_IMAGES: Record<string, ManifestImage> = {
  "butter-paneer": {
    src: "/images/dishes/butter-paneer.png",
    alt: "Cubes of paneer in a creamy tomato gravy in a copper kadai, garnished with cream and cilantro",
  },
  "paneer-tikka": {
    src: "/images/dishes/paneer-tikka.png",
    alt: "Grilled paneer tikka skewers with charred edges in a cast iron skillet with lemon and mint",
  },
  "chaat-papdi": {
    src: "/images/dishes/chaat-papdi.png",
    alt: "Chaat papdi topped with chickpeas, yogurt, chutneys and sev in a steel bowl",
  },
  "chicken-tikka-masala": {
    src: "/images/heritage/tikka-curry.jpg",
    alt: "Charred chicken tikka pieces simmered in a rich tomato gravy",
  },
  "chicken-biryani": {
    src: "/images/heritage/thali-spread.jpg",
    alt: "A spread of copper kadai bowls with rice and curries",
  },
  "kaju-katli": {
    src: "/images/heritage/sweets-platter.jpg",
    alt: "An assortment of Indian sweets including barfi, ladoo, and jalebi",
  },
};

export const CATEGORY_IMAGES: Record<string, ManifestImage> = {
  appetizers: {
    src: "/images/categories/appetizers.png",
    alt: "Assorted fried Indian appetizers with mint and tamarind chutney on a slate plate",
  },
  "indo-chinese": {
    src: "/images/categories/indo-chinese.png",
    alt: "Chilli paneer tossed with bell peppers and onions in a glossy sauce in a wok",
  },
  "indian-style-burger": {
    src: "/images/categories/indian-style-burger.png",
    alt: "An aloo tikki burger with lettuce, tomato and onion on a toasted bun",
  },
  "tandoori-passion": {
    src: "/images/categories/tandoori-passion.png",
    alt: "Tandoori chicken skewers grilling over glowing coals",
  },
  "chicken-specialties": {
    src: "/images/categories/chicken-specialties.png",
    alt: "Butter chicken curry with basmati rice in a copper bowl",
  },
  "lamb-specialties": {
    src: "/images/categories/lamb-specialties.png",
    alt: "Lamb rogan josh curry with whole spices in a copper bowl",
  },
  "rice-specials": {
    src: "/images/heritage/thali-spread.jpg",
    alt: "A spread of copper kadai bowls with rice and curries",
  },
  sweets: {
    src: "/images/heritage/sweets-platter.jpg",
    alt: "An assortment of Indian sweets including barfi, ladoo, and jalebi",
  },
  "vegetarian-specialties": {
    // Direct fit: butter paneer is itself a vegetarian-specialties dish.
    src: "/images/dishes/butter-paneer.png",
    alt: "Cubes of paneer in a creamy tomato gravy in a copper kadai, garnished with cream and cilantro",
  },
  "chaat-specials": {
    // Direct fit: chaat papdi is itself a chaat-specials dish.
    src: "/images/dishes/chaat-papdi.png",
    alt: "Chaat papdi topped with chickpeas, yogurt, chutneys and sev in a steel bowl",
  },
  "namkeen-snacks": {
    // Approximate: closest existing photo is fried savory appetizers, not the
    // namkeen mixes themselves.
    src: "/images/categories/appetizers.png",
    alt: "Assorted fried Indian appetizers with mint and tamarind chutney on a slate plate",
  },
  tidbits: {
    // Approximate: chaat papdi's yogurt/chutney components overlap with this
    // category (raita, chutneys) more than any other photo on hand.
    src: "/images/dishes/chaat-papdi.png",
    alt: "Chaat papdi topped with chickpeas, yogurt, chutneys and sev in a steel bowl",
  },
  "prawn-specialties": {
    // Approximate: no seafood photo exists yet; a gravy-based meat curry in a
    // bowl is the closest visual analog on hand.
    src: "/images/categories/lamb-specialties.png",
    alt: "A rich red gravy curry with whole spices in a copper bowl",
  },
  breads: {
    // Approximate: no naan/roti photo exists yet; a bun is the closest bread
    // texture on hand.
    src: "/images/categories/indian-style-burger.png",
    alt: "A toasted bun with visible bread texture",
  },
};

export const PLACEHOLDER_IMAGE: ManifestImage = {
  src: "/images/placeholder.svg",
  alt: "Bombay Sweets",
};

export function getDishImage(itemId: string, categoryId: string): ManifestImage {
  return DISH_IMAGES[itemId] ?? CATEGORY_IMAGES[categoryId] ?? PLACEHOLDER_IMAGE;
}
