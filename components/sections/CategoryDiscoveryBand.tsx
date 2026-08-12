"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { HorizontalScroller } from "@/components/motion/HorizontalScroller";
import { CATEGORY_IMAGES } from "@/data/imageManifest";
import { cn } from "@/lib/utils/cn";

const FEATURED_CATEGORIES = [
  { id: "sweets", name: "Sweets" },
  { id: "chaat-specials", name: "Chaat" },
  { id: "tandoori-passion", name: "Tandoori" },
  { id: "chicken-specialties", name: "Curries" },
  { id: "vegetarian-specialties", name: "Vegetarian" },
  { id: "rice-specials", name: "Biryani & Rice" },
  { id: "breads", name: "Breads" },
  { id: "namkeen-snacks", name: "Snacks" },
];

export function CategoryDiscoveryBand() {
  const [active, setActive] = useState(0);
  const activeCategory = FEATURED_CATEGORIES[active];
  const activeImage = CATEGORY_IMAGES[activeCategory.id];

  return (
    <section className="bg-peach px-6 py-20 lg:px-10 lg:py-28">
      <Reveal>
        <Eyebrow>06 — Browse by Craving</Eyebrow>
        <h2 className="mt-4 max-w-lg font-display text-[40px] leading-[0.95] text-ink lg:text-[56px]">
          Where do you want to start?
        </h2>
      </Reveal>

      <Reveal delay={0.1} className="mt-14 hidden lg:grid lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <ul className="flex flex-col border-t border-ink/15">
          {FEATURED_CATEGORIES.map((category, i) => (
            <li key={category.id} className="border-b border-ink/15">
              <Link
                href={`/menu#${category.id}`}
                onMouseEnter={() => setActive(i)}
                className="group flex items-center gap-6 py-6"
              >
                <span className="font-label text-xs text-ink/40">{String(i + 1).padStart(2, "0")}</span>
                <span
                  className={cn(
                    "flex-1 font-display text-3xl transition-all duration-300 xl:text-4xl",
                    i === active ? "translate-x-1.5 text-ink" : "text-ink/35"
                  )}
                >
                  {category.name}
                </span>
                <span
                  className={cn(
                    "font-body text-xl transition-all duration-300 group-hover:translate-x-1",
                    i === active ? "text-ink" : "text-ink/30"
                  )}
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-image shadow-[0_30px_60px_-20px_rgba(59,42,29,0.35)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory.id}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={activeImage.src}
                alt={activeImage.alt}
                fill
                sizes="(min-width: 1024px) 45vw, 90vw"
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent px-8 pb-8 pt-16">
            <span className="font-display text-3xl text-cream">{activeCategory.name}</span>
          </div>
        </div>
      </Reveal>

      <div className="mt-12 lg:hidden">
        <HorizontalScroller count={FEATURED_CATEGORIES.length}>
          {FEATURED_CATEGORIES.map((category) => {
            const image = CATEGORY_IMAGES[category.id];
            return (
              <Link
                key={category.id}
                href={`/menu#${category.id}`}
                className="group flex w-[220px] shrink-0 snap-start flex-col gap-3"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-image">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="220px"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                </div>
                <span className="font-display text-xl text-ink">{category.name}</span>
              </Link>
            );
          })}
        </HorizontalScroller>
      </div>
    </section>
  );
}
