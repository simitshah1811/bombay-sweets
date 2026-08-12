"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { getMenuItem } from "@/data/menu";
import { formatPrice } from "@/lib/utils/formatPrice";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { useCart } from "@/lib/cart/CartContext";
import { cn } from "@/lib/utils/cn";

interface CollectionSweet {
  itemId: string;
  navLabel: string;
  image: string;
  alt: string;
  // Only set when directly grounded in the item's real menu description --
  // never invented for items the data layer doesn't describe.
  ingredients?: string;
}

const COLLECTION: CollectionSweet[] = [
  {
    itemId: "kaju-katli",
    navLabel: "Kaju Katli",
    image: "/images/collection/kaju-katli.png",
    alt: "Diamond-cut kaju katli finished with silver leaf, pistachio and almond, on a gold plate beside a lit diya",
    ingredients: "Cashew · Milk",
  },
  {
    itemId: "gulab-jamun",
    navLabel: "Gulab Jamun",
    image: "/images/collection/gulab-jamun.png",
    alt: "A pan of glossy syrup-soaked gulab jamun finished with silver leaf",
  },
  {
    itemId: "milk-cake",
    navLabel: "Milk Cake",
    image: "/images/collection/milk-cake.png",
    alt: "A square piece of Indian milk cake on a warm ivory background",
  },
  {
    itemId: "besan-barfi",
    navLabel: "Besan Barfi",
    image: "/images/collection/besan-barfi.png",
    alt: "A besan barfi with a pistachio topping on a warm ivory background",
    ingredients: "Chickpea Flour",
  },
  {
    itemId: "white-rasgulla",
    navLabel: "Rasgulla",
    image: "/images/collection/white-rasgulla.png",
    alt: "A white spongy rasgulla in light syrup on a warm ivory background",
  },
  {
    itemId: "boondi-ladoo",
    navLabel: "Boondi Ladoo",
    image: "/images/collection/boondi-ladoo.png",
    alt: "A round boondi ladoo on a warm ivory background",
  },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// The editorial dish-index row: a small index, a name that grows dramatically
// on hover/focus/select while the rest quiet down, and a secondary line
// (ingredients, price, add-to-order) that expands in via an animated CSS
// grid track -- no JS height measurement, no layout-shift warnings, and it
// composes cleanly with prefers-reduced-motion (the transition classes are
// simply inert when motion is off, since nothing here uses transform-only
// tricks that would look broken frozen mid-way).
function DishRow({
  sweet,
  index,
  isActive,
  onSelect,
}: {
  sweet: CollectionSweet;
  index: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  const item = getMenuItem(sweet.itemId);
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  if (!item) return null;

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    add(sweet.itemId, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onMouseEnter={onSelect}
      onFocus={onSelect}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className="group flex cursor-pointer gap-5 border-b border-cream/10 py-5 outline-none first:border-t"
    >
      <span
        className={cn(
          "w-7 shrink-0 pt-2 font-label text-[11px] tabular-nums transition-colors duration-500",
          isActive ? "text-saffron" : "text-cream/25"
        )}
      >
        {pad(index + 1)}
      </span>

      <div className="flex-1">
        <span
          className={cn(
            "block origin-left leading-[0.95] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            isActive
              ? "font-display text-[40px] text-cream xl:text-[50px]"
              : "font-display text-[22px] text-cream/35 group-hover:text-cream/55"
          )}
        >
          {sweet.navLabel}
        </span>

        <div
          className={cn(
            "grid transition-all duration-500 ease-out",
            isActive ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 pb-1">
              {sweet.ingredients && (
                <span className="font-label text-xs uppercase tracking-[0.15em] text-cream/50">
                  {sweet.ingredients}
                </span>
              )}
              <span className="font-body text-cream/80">{formatPrice(item.price)}</span>
              <button
                type="button"
                onClick={handleAdd}
                className="font-body text-cream underline decoration-cream/30 underline-offset-4 transition-colors duration-300 hover:decoration-cream"
              >
                {added ? "Added" : "Add to order →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SweetCollection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSweet = COLLECTION[activeIndex];

  return (
    <section className="bg-ink px-6 py-24 lg:px-10 lg:py-32">
      <Reveal>
        <Eyebrow tone="cream">The Collection</Eyebrow>
        <h2 className="mt-4 font-display text-[40px] leading-[0.95] text-cream lg:text-[56px]">
          A little piece
          <br />
          of India.
        </h2>
      </Reveal>

      {/* Desktop: editorial index, hover/focus-driven */}
      <div className="mt-16 hidden lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 xl:gap-24">
        <div>
          {COLLECTION.map((sweet, i) => (
            <DishRow
              key={sweet.itemId}
              sweet={sweet}
              index={i}
              isActive={i === activeIndex}
              onSelect={() => setActiveIndex(i)}
            />
          ))}
        </div>

        <div className="relative aspect-[4/5] overflow-hidden rounded-image">
          <AnimatePresence initial={false}>
            <motion.div
              key={activeSweet.itemId}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={activeSweet.image}
                alt={activeSweet.alt}
                fill
                priority={activeIndex === 0}
                sizes="45vw"
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile: dedicated stacked composition, each dish with its own photo */}
      <div className="mt-12 flex flex-col lg:hidden">
        {COLLECTION.map((sweet, i) => {
          const item = getMenuItem(sweet.itemId);
          if (!item) return null;
          return (
            <Reveal key={sweet.itemId} delay={0.05} className="border-b border-cream/10 py-10 first:border-t">
              <span className="font-label text-xs tabular-nums text-cream/40">{pad(i + 1)}</span>
              <div className="relative mt-4 aspect-[4/5] w-full overflow-hidden rounded-image">
                <Image src={sweet.image} alt={sweet.alt} fill sizes="90vw" className="object-cover" />
              </div>
              <h3 className="mt-5 font-display text-[34px] leading-[0.95] text-cream">
                {item.name.replace(/\s*\(1 lb\)/, "")}
              </h3>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-2">
                {sweet.ingredients && (
                  <span className="font-label text-xs uppercase tracking-[0.15em] text-cream/50">
                    {sweet.ingredients}
                  </span>
                )}
                <span className="font-body text-cream/80">{formatPrice(item.price)}</span>
              </div>
              <AddToCartButton itemId={sweet.itemId} className="mt-4 px-5 py-2.5 text-sm" />
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
