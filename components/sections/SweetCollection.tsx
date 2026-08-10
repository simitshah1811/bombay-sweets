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
    image: "/images/heritage/sweets-platter.jpg",
    alt: "Gulab Jamun",
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
    image: "/images/heritage/sweets-platter.jpg",
    alt: "Besan Barfi",
    depth: 0.7,
    top: "48%",
    left: "72%",
    size: 230,
  },
  {
    itemId: "kaju-katli",
    image: "/images/heritage/sweets-platter.jpg",
    alt: "Kaju Katli",
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

export function SweetCollection() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const heading = headingRef.current;
    if (!wrapper || !heading) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
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
    <div ref={wrapperRef} className="relative h-[260vh] motion-reduce:h-auto">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-peach motion-reduce:static motion-reduce:h-auto motion-reduce:py-20">
        <div
          ref={headingRef}
          className="relative z-10 px-6 pt-16 text-center motion-reduce:opacity-100 lg:px-10"
        >
          <h2 className="font-display text-[36px] leading-[0.95] text-ink lg:text-[52px]">
            A gallery of sweets
          </h2>
        </div>

        <div className="relative mx-auto h-full max-w-5xl motion-reduce:static motion-reduce:grid motion-reduce:h-auto motion-reduce:grid-cols-2 motion-reduce:gap-6 motion-reduce:px-6 motion-reduce:py-12 sm:motion-reduce:grid-cols-3">
          {COLLECTION.map((sweet, i) => {
            const item = getMenuItem(sweet.itemId);
            if (!item) return null;
            return (
              <div
                key={sweet.itemId}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="absolute flex flex-col items-center gap-2 motion-reduce:static motion-reduce:opacity-100"
                style={{
                  top: sweet.top,
                  left: sweet.left,
                  width: sweet.size,
                }}
              >
                <div
                  className="relative aspect-square w-full overflow-hidden rounded-image shadow-[0_30px_60px_-20px_rgba(59,42,29,0.35)]"
                  style={{ zIndex: Math.round(sweet.depth * 10) }}
                >
                  <Image
                    src={sweet.image}
                    alt={sweet.alt}
                    fill
                    sizes="280px"
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
