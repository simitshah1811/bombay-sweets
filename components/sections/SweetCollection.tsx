"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { getMenuItem } from "@/data/menu";
import { formatPrice } from "@/lib/utils/formatPrice";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { useCart } from "@/lib/cart/CartContext";
import { cn } from "@/lib/utils/cn";

interface SweetSpecimen {
  itemId: string;
  // Art-directed line breaks for the display name -- deliberately not
  // uniform (e.g. single-word names stay on one line) per the brief.
  lines: string[];
  image: string;
  alt: string;
  // Only set when directly grounded in the item's real menu description --
  // never invented for items the data layer doesn't describe.
  ingredients?: string;
}

const SWEETS: SweetSpecimen[] = [
  {
    itemId: "kaju-katli",
    lines: ["Kaju", "Katli"],
    image: "/images/collection/kaju-katli.png",
    alt: "Diamond-cut kaju katli finished with silver leaf, pistachio and almond, on a gold plate beside a lit diya",
    ingredients: "Cashew · Milk",
  },
  {
    itemId: "gulab-jamun",
    lines: ["Gulab", "Jamun"],
    image: "/images/collection/gulab-jamun.png",
    alt: "A pan of glossy syrup-soaked gulab jamun finished with silver leaf",
  },
  {
    itemId: "milk-cake",
    lines: ["Milk", "Cake"],
    image: "/images/collection/milk-cake.png",
    alt: "A square piece of Indian milk cake on a warm ivory background",
  },
  {
    itemId: "besan-barfi",
    lines: ["Besan", "Barfi"],
    image: "/images/collection/besan-barfi.png",
    alt: "A besan barfi with a pistachio topping on a warm ivory background",
    ingredients: "Chickpea Flour",
  },
  {
    itemId: "white-rasgulla",
    lines: ["Rasgulla"],
    image: "/images/collection/white-rasgulla.png",
    alt: "A white spongy rasgulla in light syrup on a warm ivory background",
  },
  {
    itemId: "boondi-ladoo",
    lines: ["Boondi", "Ladoo"],
    image: "/images/collection/boondi-ladoo.png",
    alt: "A round boondi ladoo on a warm ivory background",
  },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Real item names carry their real weight as a "(1 lb)" suffix already --
// split it out rather than hardcoding or inventing a unit.
function splitNameAndWeight(fullName: string): { name: string; weight: string | null } {
  const match = fullName.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (match) return { name: match[1].trim(), weight: match[2].trim() };
  return { name: fullName, weight: null };
}

function EditorialAddToOrder({ itemId }: { itemId: string }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        add(itemId, 1);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1200);
      }}
      className="group inline-flex items-center gap-2 font-label text-xs uppercase tracking-[0.2em] text-cream"
    >
      <span>{added ? "Added" : "Add to Order"}</span>
      <span className="relative h-px w-6 overflow-hidden bg-cream/30">
        <span className="absolute inset-0 origin-left scale-x-0 bg-saffron transition-transform duration-500 ease-out group-hover:scale-x-100" />
      </span>
      <span aria-hidden className="transition-transform duration-500 ease-out group-hover:translate-x-1">
        →
      </span>
    </button>
  );
}

export function SweetCollection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = SWEETS[activeIndex];
  const activeItem = getMenuItem(active.itemId);

  if (!activeItem) return null;

  const { weight } = splitNameAndWeight(activeItem.name);

  return (
    <section className="bg-ink px-6 py-24 lg:px-10 lg:py-32">
      <Reveal>
        <Eyebrow tone="cream">The Sweet Collection</Eyebrow>
      </Reveal>

      {/* Desktop: hero + editorial index, three zones */}
      <div className="mt-14 hidden lg:grid lg:grid-cols-[0.85fr_1.3fr_0.75fr] lg:items-center lg:gap-10 xl:gap-14">
        {/* LEFT: hero typography */}
        <div>
          <div className="flex items-center gap-3">
            <span className="h-px w-6 bg-saffron/50" aria-hidden />
            <span className="font-label text-xs tracking-[0.2em] text-saffron">{pad(activeIndex + 1)}</span>
          </div>

          <h3 className="mt-5 font-display leading-[0.88] text-cream">
            {active.lines.map((line) => (
              <span key={line} className="block text-[52px] xl:text-[64px] 2xl:text-[76px]">
                {line}
              </span>
            ))}
          </h3>

          {active.ingredients && (
            <p className="mt-5 font-label text-xs uppercase tracking-[0.15em] text-cream/60">
              {active.ingredients}
            </p>
          )}

          {activeItem.description && (
            <p className="mt-4 max-w-xs font-body text-cream/70">{activeItem.description}</p>
          )}

          <div className="mt-6 flex items-baseline gap-2">
            <span className="font-body text-2xl text-cream">{formatPrice(activeItem.price)}</span>
            {weight && (
              <span className="font-label text-[11px] uppercase tracking-[0.1em] text-cream/40">
                Per {weight}
              </span>
            )}
          </div>

          <div className="mt-7">
            <EditorialAddToOrder itemId={active.itemId} />
          </div>
        </div>

        {/* CENTER: hero photograph */}
        <div className="relative aspect-[4/5] w-full">
          <AnimatePresence initial={false}>
            <motion.div
              key={active.itemId}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 overflow-hidden rounded-t-[999px_/_140px]"
            >
              <Image
                src={active.image}
                alt={active.alt}
                fill
                priority={activeIndex === 0}
                sizes="45vw"
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* RIGHT: compact editorial index of the other five */}
        <div className="flex flex-col">
          {SWEETS.map((sweet, i) => {
            if (i === activeIndex) return null;
            const item = getMenuItem(sweet.itemId);
            if (!item) return null;
            return (
              <button
                key={sweet.itemId}
                type="button"
                onClick={() => setActiveIndex(i)}
                aria-label={`Show ${item.name}`}
                className="group flex items-center gap-4 border-b border-cream/10 py-4 text-left outline-none first:border-t focus-visible:bg-cream/5"
              >
                <span className="font-label text-[11px] tabular-nums text-cream/35">{pad(i + 1)}</span>
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
                  <Image src={sweet.image} alt="" fill sizes="44px" className="object-cover" />
                </div>
                <span className="flex-1 font-display leading-[1.05] text-cream/70 transition-colors duration-300 group-hover:text-cream">
                  {sweet.lines.map((line) => (
                    <span key={line} className="block text-base">
                      {line}
                    </span>
                  ))}
                </span>
                <span
                  aria-hidden
                  className="font-body text-cream/30 transition-all duration-300 group-hover:translate-x-1 group-hover:text-cream/70"
                >
                  →
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile: hero-first, tap through the rest */}
      <div className="mt-10 lg:hidden">
        <Reveal>
          <div className="flex items-center gap-3">
            <span className="h-px w-6 bg-saffron/50" aria-hidden />
            <span className="font-label text-xs tracking-[0.2em] text-saffron">{pad(activeIndex + 1)}</span>
          </div>
          <h3 className="mt-4 font-display leading-[0.9] text-cream">
            {active.lines.map((line) => (
              <span key={line} className="block text-[44px]">
                {line}
              </span>
            ))}
          </h3>
        </Reveal>

        <div className="relative mt-6 aspect-[4/5] w-full overflow-hidden rounded-t-[999px_/_120px]">
          <Image src={active.image} alt={active.alt} fill priority sizes="90vw" className="object-cover" />
        </div>

        {active.ingredients && (
          <p className="mt-5 font-label text-xs uppercase tracking-[0.15em] text-cream/60">
            {active.ingredients}
          </p>
        )}
        {activeItem.description && (
          <p className="mt-3 font-body text-cream/70">{activeItem.description}</p>
        )}
        <div className="mt-5 flex items-baseline gap-2">
          <span className="font-body text-2xl text-cream">{formatPrice(activeItem.price)}</span>
          {weight && (
            <span className="font-label text-[11px] uppercase tracking-[0.1em] text-cream/40">
              Per {weight}
            </span>
          )}
        </div>
        <div className="mt-6">
          <EditorialAddToOrder itemId={active.itemId} />
        </div>

        <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none]">
          {SWEETS.map((sweet, i) => {
            const item = getMenuItem(sweet.itemId);
            if (!item) return null;
            const isActive = i === activeIndex;
            return (
              <button
                key={sweet.itemId}
                type="button"
                onClick={() => setActiveIndex(i)}
                aria-label={`Show ${item.name}`}
                className="flex w-16 shrink-0 snap-start flex-col items-center gap-2"
              >
                <div
                  className={cn(
                    "relative h-14 w-14 shrink-0 overflow-hidden rounded-full border transition-colors duration-300",
                    isActive ? "border-saffron" : "border-cream/15"
                  )}
                >
                  <Image src={sweet.image} alt="" fill sizes="56px" className="object-cover" />
                </div>
                <span
                  className={cn(
                    "font-label text-[10px] tabular-nums transition-colors duration-300",
                    isActive ? "text-saffron" : "text-cream/40"
                  )}
                >
                  {pad(i + 1)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
