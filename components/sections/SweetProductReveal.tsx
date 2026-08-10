"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { getMenuItem } from "@/data/menu";
import { formatPrice } from "@/lib/utils/formatPrice";
import { PillButton } from "@/components/ui/PillButton";
import { business } from "@/data/business";

interface RevealSweet {
  itemId: string;
  image: string;
  alt: string;
  bg: string;
}

const REVEAL_SWEETS: RevealSweet[] = [
  {
    itemId: "kaju-katli",
    image: "/images/heritage/sweets-platter.jpg",
    alt: "Kaju Katli",
    bg: "bg-cream",
  },
  {
    itemId: "gulab-jamun",
    image: "/images/heritage/sweets-platter.jpg",
    alt: "Gulab Jamun",
    bg: "bg-peach",
  },
  {
    itemId: "milk-cake",
    image: "/images/heritage/sweets-platter.jpg",
    alt: "Milk Cake",
    bg: "bg-cream",
  },
];

export function SweetProductReveal() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const bgRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const bgs = bgRefs.current.filter((el): el is HTMLDivElement => el !== null);
      const images = imageRefs.current.filter((el): el is HTMLDivElement => el !== null);
      const texts = textRefs.current.filter((el): el is HTMLDivElement => el !== null);

      gsap.set(bgs, { opacity: 0 });
      gsap.set(bgs[0], { opacity: 1 });
      gsap.set(images, { opacity: 0, scale: 0.75, rotate: 0, filter: "blur(0px)" });
      gsap.set(images[0], { opacity: 1, scale: 1 });
      gsap.set(texts, { opacity: 0, y: 16 });
      gsap.set(texts[0], { opacity: 1, y: 0 });

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

      // Transition 1 -> 2: rotate-out / slide-in-from-behind
      tl.to(bgs[0], { opacity: 0, duration: 0.1 }, 0.28)
        .to(bgs[1], { opacity: 1, duration: 0.1 }, 0.28)
        .to(texts[0], { opacity: 0, y: -16, duration: 0.08 }, 0.28)
        .to(images[0], { opacity: 0, scale: 1.15, rotate: 12, duration: 0.12 }, 0.28)
        .fromTo(
          images[1],
          { opacity: 0, scale: 0.7, rotate: -8 },
          { opacity: 1, scale: 1, rotate: 0, duration: 0.12 },
          0.3
        )
        .to(texts[1], { opacity: 1, y: 0, duration: 0.08 }, 0.38);

      // Transition 2 -> 3: emerge from a soft haze (blur + scale)
      tl.to(bgs[1], { opacity: 0, duration: 0.1 }, 0.62)
        .to(bgs[2], { opacity: 1, duration: 0.1 }, 0.62)
        .to(texts[1], { opacity: 0, y: -16, duration: 0.08 }, 0.62)
        .to(images[1], { opacity: 0, filter: "blur(18px)", scale: 1.1, duration: 0.12 }, 0.62)
        .fromTo(
          images[2],
          { opacity: 0, filter: "blur(24px)", scale: 0.9 },
          { opacity: 1, filter: "blur(0px)", scale: 1, duration: 0.12 },
          0.64
        )
        .to(texts[2], { opacity: 1, y: 0, duration: 0.08 }, 0.72);

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={wrapperRef} className="relative h-[300vh] motion-reduce:h-auto">
      <div className="sticky top-0 h-screen w-full overflow-hidden motion-reduce:static motion-reduce:h-auto">
        {REVEAL_SWEETS.map((sweet, i) => (
          <div
            key={`bg-${sweet.itemId}`}
            ref={(el) => {
              bgRefs.current[i] = el;
            }}
            className={`absolute inset-0 ${sweet.bg} motion-reduce:hidden`}
          />
        ))}

        {REVEAL_SWEETS.map((sweet, i) => {
          const item = getMenuItem(sweet.itemId);
          if (!item) return null;
          return (
            <div
              key={sweet.itemId}
              className="absolute inset-0 z-10 flex h-full w-full flex-col items-center justify-center gap-8 px-6 motion-reduce:relative motion-reduce:inset-auto motion-reduce:h-auto motion-reduce:border-b motion-reduce:border-ink/10 motion-reduce:py-16 motion-reduce:last:border-b-0 lg:flex-row lg:gap-16 lg:px-16"
            >
              <div
                ref={(el) => {
                  imageRefs.current[i] = el;
                }}
                className="relative aspect-square w-full max-w-md overflow-hidden rounded-image motion-reduce:opacity-100"
              >
                <Image
                  src={sweet.image}
                  alt={sweet.alt}
                  fill
                  sizes="(min-width: 1024px) 480px, 90vw"
                  className="object-cover"
                  priority={i === 0}
                />
              </div>

              <div
                ref={(el) => {
                  textRefs.current[i] = el;
                }}
                className="flex max-w-md flex-col items-center gap-4 text-center motion-reduce:opacity-100 lg:items-start lg:text-left"
              >
                <h2 className="font-display text-[44px] leading-[0.95] text-ink lg:text-[64px]">
                  {item.name.replace(/\s*\(1 lb\)/, "")}
                </h2>
                {item.description && (
                  <p className="font-body text-lg text-ink/70">{item.description}</p>
                )}
                <span className="font-body text-2xl text-ink">{formatPrice(item.price)}</span>
                <PillButton href={business.phoneHref} className="mt-2">
                  Call to order
                </PillButton>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
