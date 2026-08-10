"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { Eyebrow } from "@/components/ui/Eyebrow";

interface Ingredient {
  label: string;
  angle: number; // degrees, starting scatter direction
  radius: number; // px, starting distance from center
  image?: string;
}

const PLACEHOLDER_IMAGE = "/images/heritage/sweets-platter.jpg";
const CENTER_IMAGE = "/images/macro/besan-barfi-full.png";

const INGREDIENTS: Ingredient[] = [
  { label: "Pistachio", angle: 0, radius: 320, image: "/images/ingredients/pistachio.png" },
  { label: "Almond", angle: 51, radius: 300, image: "/images/ingredients/almond.png" },
  { label: "Saffron", angle: 103, radius: 330, image: "/images/macro/saffron-strands.png" },
  { label: "Cardamom", angle: 154, radius: 290, image: "/images/ingredients/cardamom.png" },
  { label: "Rose Petals", angle: 206, radius: 310, image: "/images/ingredients/rose-petals.png" },
  { label: "Milk", angle: 257, radius: 300, image: "/images/ingredients/milk.png" },
  { label: "Sugar", angle: 309, radius: 320, image: "/images/ingredients/sugar.png" },
];

export function SweetIngredientStory() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const ingredientRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const center = centerRef.current;
    const heading = headingRef.current;
    if (!wrapper || !center || !heading) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const items = ingredientRefs.current.filter((el): el is HTMLDivElement => el !== null);
      const labels = labelRefs.current.filter((el): el is HTMLDivElement => el !== null);

      gsap.set(heading, { opacity: 0, y: 20 });
      gsap.set(center, { opacity: 0, scale: 0.8 });
      items.forEach((el, i) => {
        const { angle, radius } = INGREDIENTS[i];
        const rad = (angle * Math.PI) / 180;
        gsap.set(el, {
          xPercent: -50,
          yPercent: -50,
          x: Math.cos(rad) * radius,
          y: Math.sin(rad) * radius,
          opacity: 0,
          scale: 0.6,
        });
      });
      gsap.set(labels, { opacity: 0 });

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

      tl.to(heading, { opacity: 1, y: 0, duration: 0.15 }, 0);
      tl.to(center, { opacity: 1, scale: 1, duration: 0.2 }, 0.1);

      items.forEach((el, i) => {
        const start = 0.15 + i * 0.09;
        tl.to(el, { opacity: 1, scale: 1, x: 0, y: 0, duration: 0.35 }, start);
        tl.to(labels[i], { opacity: 1, duration: 0.15 }, start + 0.2);
      });

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={wrapperRef} className="relative h-[280vh] motion-reduce:h-auto">
      <div className="sticky top-0 flex h-screen w-full flex-col items-center overflow-hidden bg-cream motion-reduce:static motion-reduce:h-auto motion-reduce:gap-10 motion-reduce:py-24">
        <div ref={headingRef} className="relative z-20 pt-16 text-center motion-reduce:opacity-100">
          <Eyebrow className="justify-center">What Goes Into Every Bite</Eyebrow>
          <h2 className="mt-4 font-display text-[36px] leading-[0.95] text-ink lg:text-[52px]">
            Simple ingredients, done properly
          </h2>
        </div>

        <div className="relative flex-1 w-full motion-reduce:hidden">
          <div
            ref={centerRef}
            className="absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full shadow-[0_30px_60px_-20px_rgba(59,42,29,0.4)]"
          >
            <Image
              src={CENTER_IMAGE}
              alt="A diamond-cut besan barfi topped with silver leaf"
              fill
              sizes="220px"
              className="object-cover"
            />
          </div>

          {INGREDIENTS.map((ingredient, i) => (
            <div
              key={ingredient.label}
              ref={(el) => {
                ingredientRefs.current[i] = el;
              }}
              className="absolute left-1/2 top-1/2 flex flex-col items-center gap-2"
            >
              <div className="h-16 w-16 overflow-hidden rounded-full border border-ink/15 bg-peach shadow-[0_12px_24px_-8px_rgba(59,42,29,0.3)]">
                <Image
                  src={ingredient.image ?? PLACEHOLDER_IMAGE}
                  alt={ingredient.label}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              </div>
              <span
                ref={(el) => {
                  labelRefs.current[i] = el;
                }}
                className="font-label text-xs uppercase tracking-[0.15em] text-ink/70"
              >
                {ingredient.label}
              </span>
            </div>
          ))}
        </div>

        <div className="hidden motion-reduce:grid motion-reduce:w-full motion-reduce:max-w-2xl motion-reduce:grid-cols-4 motion-reduce:gap-6 motion-reduce:px-6">
          {INGREDIENTS.map((ingredient) => (
            <div key={ingredient.label} className="flex flex-col items-center gap-2">
              <div className="h-16 w-16 overflow-hidden rounded-full border border-ink/15 bg-peach">
                <Image
                  src={ingredient.image ?? PLACEHOLDER_IMAGE}
                  alt={ingredient.label}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="font-label text-xs uppercase tracking-[0.15em] text-ink/70">
                {ingredient.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
