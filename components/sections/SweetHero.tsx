"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PillButton } from "@/components/ui/PillButton";
import { CRAVING_HREF } from "@/lib/navigation";
import { HERO_FULL_IMAGE, HERO_MACRO_IMAGE } from "@/lib/heroSequence";

/**
 * Cinematic "push-in / macro-reveal / release" scroll sequence:
 * the sweet scales up as if the camera is pushing toward it, cross-fades
 * into a macro texture shot of itself, then cross-fades back out and
 * settles to one side as the editorial line and CTA reveal beside it.
 * Pinned + scrubbed with GSAP ScrollTrigger; skipped entirely under
 * prefers-reduced-motion (CSS fallback renders a plain static hero).
 */
export function SweetHero() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fullLayerRef = useRef<HTMLDivElement>(null);
  const macroLayerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const fullLayer = fullLayerRef.current;
    const macroLayer = macroLayerRef.current;
    const text = textRef.current;
    if (!wrapper || !fullLayer || !macroLayer || !text) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set(macroLayer, { opacity: 0, scale: 1.15 });
      gsap.set(fullLayer, { opacity: 1, scale: 1, x: 0 });
      gsap.set(text, { opacity: 0, x: 40 });

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

      tl.to(fullLayer, { scale: 1.35, duration: 0.35 }, 0)
        .to(fullLayer, { opacity: 0, duration: 0.15 }, 0.3)
        .to(macroLayer, { opacity: 1, scale: 1.4, duration: 0.15 }, 0.3)
        .to(macroLayer, { scale: 1.6, duration: 0.15 }, 0.45)
        .to(macroLayer, { opacity: 0, duration: 0.15 }, 0.55)
        .fromTo(fullLayer, { opacity: 0, scale: 1.1 }, { opacity: 1, duration: 0.15 }, 0.55)
        .to(fullLayer, { scale: 0.85, x: "-16%", duration: 0.3 }, 0.6)
        .to(text, { opacity: 1, x: 0, duration: 0.25 }, 0.68);

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative h-[320vh] motion-reduce:h-auto"
    >
      <div className="sticky top-0 flex h-screen w-full items-center overflow-hidden bg-cream motion-reduce:static motion-reduce:h-auto motion-reduce:flex-col motion-reduce:gap-10 motion-reduce:py-24">
        <div
          ref={fullLayerRef}
          className="absolute inset-0 flex items-center justify-center motion-reduce:relative motion-reduce:inset-auto motion-reduce:h-[60vh] motion-reduce:w-full"
        >
          <div className="relative h-[55vh] w-[55vh] max-w-full">
            <Image
              src={HERO_FULL_IMAGE.src}
              alt={HERO_FULL_IMAGE.alt}
              fill
              priority
              sizes="(min-width: 1024px) 55vh, 80vw"
              className="rounded-image object-cover"
            />
          </div>
        </div>

        <div
          ref={macroLayerRef}
          className="absolute inset-0 opacity-0 motion-reduce:hidden"
        >
          <Image
            src={HERO_MACRO_IMAGE.src}
            alt={HERO_MACRO_IMAGE.alt}
            fill
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: "35% 45%" }}
          />
        </div>

        <div
          ref={textRef}
          className="relative z-10 ml-auto flex w-full max-w-lg flex-col gap-5 px-6 opacity-0 motion-reduce:mx-auto motion-reduce:opacity-100 motion-reduce:text-center lg:px-16"
        >
          <Eyebrow>Port Coquitlam, BC</Eyebrow>
          <h1 className="font-display text-[44px] leading-[0.95] text-ink lg:text-[68px]">
            Crafted by hand.
          </h1>
          <p className="max-w-md font-body text-lg text-ink/70">
            Real Indian sweets, made fresh every day — a little piece of tradition in every
            piece.
          </p>
          <div className="mt-2 flex flex-wrap gap-3 motion-reduce:justify-center">
            <PillButton href={CRAVING_HREF}>Tell us what you&rsquo;re craving</PillButton>
            <PillButton href="/menu" variant="ghost">
              See the menu
            </PillButton>
          </div>
        </div>
      </div>
    </div>
  );
}
