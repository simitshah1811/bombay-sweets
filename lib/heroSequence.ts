/**
 * Hero sweet imagery for the push-in / macro-reveal / release scroll
 * sequence. Two photos of ONE sweet: a full shot and a macro/texture shot.
 * Currently placeholders (same source photo, cropped differently) so the
 * scroll mechanism is wired and testable before the real photos exist —
 * see SWEETS_ASSET_SHOTLIST.md for the shot specs. Swap these two paths
 * once real photos land; no other code changes needed.
 */
export const HERO_PHOTOS_READY = false;

export const HERO_FULL_IMAGE = {
  src: "/images/heritage/sweets-platter.jpg",
  alt: "A signature Bombay Sweets sweet, presented on a warm neutral background",
};

export const HERO_MACRO_IMAGE = {
  src: "/images/heritage/sweets-platter.jpg",
  alt: "Extreme close-up of the sweet's texture",
};
