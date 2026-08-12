"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PillButton } from "@/components/ui/PillButton";
import { CRAVING_HREF } from "@/lib/navigation";

const HERO_FRAMES = [
  {
    src: "/images/hero/hero-cinemagraph-1.png",
    alt: "Hands placing a square of edible silver leaf onto a besan barfi",
  },
  {
    src: "/images/hero/hero-cinemagraph-2.png",
    alt: "Hands pressing silver leaf onto a besan barfi, almonds and pistachios scattered nearby",
  },
  {
    src: "/images/hero/hero-cinemagraph-3.png",
    alt: "Hands lifting away from a finished silver-leafed Indian sweet",
  },
];

const FRAME_DURATION_MS = 4500;
const CROSSFADE_SECONDS = 1.6;

/**
 * A slow, looping crossfade across three AI-generated stills of hands
 * decorating a sweet, each with its own gentle Ken Burns zoom — reads as
 * ambient motion (a "cinemagraph") without requiring real video. Autoplay
 * is gated on prefers-reduced-motion; reduced-motion users get a single
 * static frame.
 */
function HeroCinemagraph() {
  const [index, setIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(false);

  useEffect(() => {
    // One-time read of a browser-only media query; can't run during SSR render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAutoplay(window.matchMedia("(prefers-reduced-motion: no-preference)").matches);
  }, []);

  useEffect(() => {
    if (!autoplay) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % HERO_FRAMES.length);
    }, FRAME_DURATION_MS);
    return () => window.clearInterval(id);
  }, [autoplay]);

  const frame = HERO_FRAMES[index];

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence>
        <motion.div
          key={frame.src}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: CROSSFADE_SECONDS, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: 1.06 }}
            transition={{ duration: FRAME_DURATION_MS / 1000 + CROSSFADE_SECONDS, ease: "linear" }}
            className="absolute inset-0"
          >
            <Image
              src={frame.src}
              alt={frame.alt}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Full-bleed hero. Everything renders at full opacity immediately — the
 * image and text are never gated behind scroll/JS state, only enhanced by
 * it, so there's no chance of a blank first paint. Scroll adds a subtle
 * 3D-feeling parallax: the image scales, drifts, and tilts in perspective
 * as the section scrolls past, via Framer Motion's scroll tracking (no
 * pinning involved, so there's no pin-jump risk from late-loading fonts).
 */
export function SweetHero() {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [0, 6]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={sectionRef} className="relative h-screen w-full overflow-hidden bg-ink">
      <div className="absolute inset-0" style={{ perspective: 1200 }}>
        <motion.div
          style={{ scale, y, rotateX, transformOrigin: "center top" }}
          className="absolute inset-0"
        >
          <HeroCinemagraph />
        </motion.div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-ink/10" />

      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="relative z-10 flex h-full flex-col justify-end px-6 pb-20 lg:px-10 lg:pb-24"
      >
        <Eyebrow tone="cream">Port Coquitlam, BC</Eyebrow>
        <h1 className="mt-4 max-w-3xl font-display text-[52px] leading-[0.95] text-cream lg:text-[92px]">
          What&rsquo;s your craving?
        </h1>
        <p className="mt-5 max-w-md font-body text-lg text-cream/85">
          Real Indian sweets and North Indian cooking, made fresh every day in Port Coquitlam.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <PillButton href={CRAVING_HREF}>Tell us what you&rsquo;re craving</PillButton>
          <PillButton href="/menu" variant="ghostOnDark">
            See the menu
          </PillButton>
        </div>
      </motion.div>
    </section>
  );
}
