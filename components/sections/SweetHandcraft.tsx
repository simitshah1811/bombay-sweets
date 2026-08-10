"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { Eyebrow } from "@/components/ui/Eyebrow";

const HANDS_IMAGE = {
  src: "/images/heritage/sweets-platter.jpg",
  alt: "Hands preparing a sweet",
};

const FINISHED_IMAGE = {
  src: "/images/handcraft/finished-ladoo.jpg",
  alt: "A tin of freshly made boondi ladoo in paper liners",
};

/**
 * Match-cut: hands preparing a sweet parallax-drifts, then cross-fades
 * (with a scale-through) into the finished sweet, reinforcing the link
 * between craft and product.
 */
export function SweetHandcraft() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const handsRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const hands = handsRef.current;
    const finished = finishedRef.current;
    const text = textRef.current;
    if (!wrapper || !hands || !finished || !text) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set(hands, { opacity: 1, scale: 1.05, y: 0 });
      gsap.set(finished, { opacity: 0, scale: 1.2 });
      gsap.set(text, { opacity: 0, y: 16 });

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

      tl.to(text, { opacity: 1, y: 0, duration: 0.2 }, 0.05)
        .to(hands, { y: -40, duration: 0.55 }, 0)
        .to(hands, { opacity: 0, scale: 0.92, duration: 0.25 }, 0.55)
        .to(finished, { opacity: 1, scale: 1, duration: 0.3 }, 0.6)
        .to(text, { opacity: 0, y: -16, duration: 0.15 }, 0.6);

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={wrapperRef} className="relative h-[200vh] motion-reduce:h-auto">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-ink motion-reduce:static motion-reduce:h-auto">
        <div ref={handsRef} className="absolute inset-0 motion-reduce:relative motion-reduce:h-[70vh]">
          <Image
            src={HANDS_IMAGE.src}
            alt={HANDS_IMAGE.alt}
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-ink/30" />
        </div>

        <div
          ref={finishedRef}
          className="absolute inset-0 opacity-0 motion-reduce:relative motion-reduce:h-[70vh] motion-reduce:opacity-100"
        >
          <Image
            src={FINISHED_IMAGE.src}
            alt={FINISHED_IMAGE.alt}
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>

        <div
          ref={textRef}
          className="relative z-10 flex h-full flex-col items-center justify-center gap-4 px-6 text-center opacity-0 motion-reduce:absolute motion-reduce:inset-0 motion-reduce:top-0 motion-reduce:h-[70vh] motion-reduce:opacity-100"
        >
          <Eyebrow tone="cream" className="justify-center">
            The Craft
          </Eyebrow>
          <h2 className="max-w-lg font-display text-[36px] leading-[0.95] text-cream lg:text-[52px]">
            Every piece, shaped by hand
          </h2>
        </div>
      </div>
    </div>
  );
}
