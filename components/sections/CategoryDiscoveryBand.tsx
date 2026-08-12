"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { HorizontalScroller } from "@/components/motion/HorizontalScroller";
import { CATEGORY_IMAGES } from "@/data/imageManifest";
import { getCategoryItems } from "@/data/menu";
import { cn } from "@/lib/utils/cn";

// Short, evocative lines grounded in what's actually true of each real
// category (per data/menu.ts) -- not claims about the business, just
// editorial framing, the same way the hero/section headlines are.
const FEATURED_CATEGORIES = [
  { id: "sweets", name: "Sweets", tagline: "Milk-based mithai, finished with silver leaf." },
  { id: "chaat-specials", name: "Chaat", tagline: "Crisp, tangy, and layered to order." },
  { id: "tandoori-passion", name: "Tandoori", tagline: "Marinated and finished over live fire." },
  { id: "chicken-specialties", name: "Curries", tagline: "Slow-simmered gravies, rich with spice." },
  { id: "vegetarian-specialties", name: "Vegetarian", tagline: "Vegetable and paneer specialties, done right." },
  { id: "rice-specials", name: "Biryani & Rice", tagline: "Layered rice, cooked low and slow." },
  { id: "breads", name: "Breads", tagline: "Baked fresh in the tandoor, to order." },
  { id: "namkeen-snacks", name: "Snacks", tagline: "Small plates, made for sharing." },
];

const COUNT = FEATURED_CATEGORIES.length;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function CategoryDiscoveryBand() {
  const [active, setActive] = useState(0);
  const activeCategory = FEATURED_CATEGORIES[active];

  return (
    <section className="bg-peach px-6 py-20 lg:px-10 lg:py-28">
      <Reveal className="text-center">
        <Eyebrow className="justify-center">06 — The Menu</Eyebrow>
        <h2 className="mt-4 font-display text-[40px] leading-[0.95] text-ink lg:text-[56px]">
          Every craving, framed.
        </h2>
      </Reveal>

      {/* Desktop: a horizontal procession of arches, all eight visible at once */}
      <Reveal delay={0.1} className="mt-16 hidden lg:block">
        <div className="flex items-end justify-center gap-2 xl:gap-3 2xl:gap-4">
          {FEATURED_CATEGORIES.map((category, i) => {
            const image = CATEGORY_IMAGES[category.id];
            const isActive = i === active;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={isActive}
                aria-label={`Show ${category.name}`}
                className="group flex flex-col items-center gap-3 rounded-t-full outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2 focus-visible:ring-offset-peach"
              >
                <span
                  className={cn(
                    "font-label text-[10px] tabular-nums transition-colors duration-500",
                    isActive ? "text-ink/50" : "text-ink/25"
                  )}
                >
                  {pad(i + 1)}
                </span>

                <div
                  className={cn(
                    "relative overflow-hidden rounded-t-full border transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    isActive
                      ? "h-[270px] w-[138px] -translate-y-3 border-ink/25 shadow-[0_20px_40px_-16px_rgba(59,42,29,0.4)] xl:h-[310px] xl:w-[162px] 2xl:h-[360px] 2xl:w-[188px]"
                      : "h-[208px] w-[104px] translate-y-0 border-ink/10 group-hover:-translate-y-1 xl:h-[240px] xl:w-[124px] 2xl:h-[280px] 2xl:w-[144px]"
                  )}
                >
                  {image && (
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="(min-width: 1536px) 190px, (min-width: 1280px) 165px, 140px"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  )}
                </div>

                <span
                  className={cn(
                    "font-display leading-[1.1] transition-all duration-500",
                    isActive ? "text-lg text-ink" : "text-sm text-ink/80 group-hover:text-ink"
                  )}
                >
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mx-auto mt-8 max-w-md text-center">
          <p className="font-body text-ink/70">{activeCategory.tagline}</p>
          <Link
            href={`/menu#${activeCategory.id}`}
            className="mt-3 inline-block font-label text-xs uppercase tracking-[0.15em] text-ink/70 underline decoration-ink/30 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
          >
            Explore →
          </Link>
        </div>
      </Reveal>

      {/* Mobile: one large arch at a time, swipe/tap through */}
      <div className="mt-12 lg:hidden">
        <HorizontalScroller count={COUNT}>
          {FEATURED_CATEGORIES.map((category, i) => {
            const image = CATEGORY_IMAGES[category.id];
            const sampleDishes = getCategoryItems(category.id)
              .slice(0, 3)
              .map((item) => item.name.replace(/\s*\(1 lb\)/, ""));
            return (
              <Link
                key={category.id}
                href={`/menu#${category.id}`}
                className="flex w-[240px] shrink-0 snap-start flex-col items-center gap-4 text-center"
              >
                <span className="font-label text-[10px] tabular-nums text-ink/40">{pad(i + 1)}</span>
                <div className="relative h-[300px] w-[190px] overflow-hidden rounded-t-full border border-ink/10">
                  {image && (
                    <Image src={image.src} alt={image.alt} fill sizes="190px" className="object-cover" />
                  )}
                </div>
                <span className="font-display text-2xl text-ink">{category.name}</span>
                {sampleDishes.length > 0 && (
                  <span className="font-body text-sm text-ink/60">{sampleDishes.join(" · ")}</span>
                )}
              </Link>
            );
          })}
        </HorizontalScroller>
      </div>

      <p className="mt-14 text-center font-body text-sm italic text-ink/50">
        Eight ways to crave it. One menu.
      </p>
    </section>
  );
}
