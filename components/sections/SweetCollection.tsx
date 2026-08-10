"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { getMenuItem } from "@/data/menu";
import { formatPrice } from "@/lib/utils/formatPrice";

interface CollectionSweet {
  itemId: string;
  image: string;
  alt: string;
  depth: number; // 0 = furthest back, 1 = closest/foreground
  top: string;
  left: string;
  size: number; // px, base diameter
}

const COLLECTION: CollectionSweet[] = [
  {
    itemId: "gulab-jamun",
    image: "/images/macro/gulab-jamun-syrup.png",
    alt: "A glossy syrup-soaked gulab jamun",
    depth: 0.9,
    top: "18%",
    left: "16%",
    size: 260,
  },
  {
    itemId: "white-rasgulla",
    image: "/images/heritage/sweets-platter.jpg",
    alt: "White Rasgulla",
    depth: 0.4,
    top: "10%",
    left: "62%",
    size: 190,
  },
  {
    itemId: "besan-barfi",
    image: "/images/macro/besan-barfi-full.png",
    alt: "A diamond-cut besan barfi topped with silver leaf",
    depth: 0.7,
    top: "48%",
    left: "72%",
    size: 230,
  },
  {
    itemId: "kaju-katli",
    image: "/images/macro/kaju-katli-diamond.png",
    alt: "A diamond-cut kaju katli showing its cashew texture",
    depth: 0.55,
    top: "58%",
    left: "12%",
    size: 210,
  },
  {
    itemId: "milk-cake",
    image: "/images/heritage/sweets-platter.jpg",
    alt: "Milk Cake",
    depth: 0.25,
    top: "35%",
    left: "42%",
    size: 170,
  },
  {
    itemId: "boondi-ladoo",
    image: "/images/heritage/sweets-platter.jpg",
    alt: "Boondi Ladoo",
    depth: 1,
    top: "68%",
    left: "40%",
    size: 280,
  },
];

// Below this, the desktop floating/parallax arrangement is replaced by a
// plain static grid — scattered absolute-percent positions don't translate
// to narrow viewports, and the brief explicitly asks for fewer simultaneous
// moving elements on mobile rather than a shrunk desktop layout.
const DESKTOP_QUERY = "(prefers-reduced-motion: no-preference) and (min-width: 1024px)";

export function SweetCollection() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const heading = headingRef.current;
    if (!wrapper || !heading) return;

    const mm = gsap.matchMedia();

    mm.add(DESKTOP_QUERY, () => {
      const cards = cardRefs.current.filter((el): el is HTMLDivElement => el !== null);

      gsap.set(cards, { opacity: 0, y: 60, scale: 0.85 });
      gsap.set(heading, { opacity: 0, y: 20 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapper,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          pin: wrapper.firstElementChild,
        },
        defaults: { ease: "none" },
      });

      tl.to(heading, { opacity: 1, y: 0, duration: 0.12 }, 0);

      cards.forEach((card, i) => {
        const sweet = COLLECTION[i];
        const start = 0.05 + i * 0.03;
        tl.to(card, { opacity: 1, scale: 1, y: 0, duration: 0.18 }, start);
        // Depth-based parallax across the remainder of the pin: closer
        // (higher depth) sweets travel further for a stronger foreground feel.
        tl.to(card, { y: -sweet.depth * 220, duration: 0.75 }, start + 0.1);
      });

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={wrapperRef} className="relative h-auto lg:motion-reduce:h-auto lg:h-[260vh]">
      <div className="w-full overflow-hidden bg-peach py-16 lg:sticky lg:top-0 lg:h-screen lg:py-0 lg:motion-reduce:static lg:motion-reduce:h-auto lg:motion-reduce:py-20">
        <div
          ref={headingRef}
          className="relative z-10 px-6 text-center opacity-100 lg:pt-16 lg:opacity-0 lg:motion-reduce:opacity-100 lg:px-10"
        >
          <h2 className="font-display text-[36px] leading-[0.95] text-ink lg:text-[52px]">
            A gallery of sweets
          </h2>
        </div>

        <div className="relative mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-6 px-6 lg:mt-0 lg:block lg:h-full lg:gap-0 lg:px-0 lg:motion-reduce:grid lg:motion-reduce:grid-cols-3 lg:motion-reduce:gap-6 lg:motion-reduce:px-6 lg:motion-reduce:py-12 sm:grid-cols-3">
          {COLLECTION.map((sweet, i) => {
            const item = getMenuItem(sweet.itemId);
            if (!item) return null;
            return (
              <div
                key={sweet.itemId}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="flex flex-col items-center gap-2 opacity-100 lg:absolute lg:opacity-0 lg:motion-reduce:static lg:motion-reduce:w-auto lg:motion-reduce:opacity-100"
                style={{
                  top: sweet.top,
                  left: sweet.left,
                }}
              >
                <div
                  className="relative aspect-square w-full overflow-hidden rounded-image shadow-[0_30px_60px_-20px_rgba(59,42,29,0.35)] lg:w-[var(--sweet-size)]"
                  style={{ zIndex: Math.round(sweet.depth * 10), "--sweet-size": `${sweet.size}px` } as React.CSSProperties}
                >
                  <Image
                    src={sweet.image}
                    alt={sweet.alt}
                    fill
                    sizes="(min-width: 1024px) 280px, 45vw"
                    className="object-cover"
                  />
                </div>
                <span className="font-body text-sm text-ink">{item.name}</span>
                <span className="font-body text-xs text-ink/60">{formatPrice(item.price)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
