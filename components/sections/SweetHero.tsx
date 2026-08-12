"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PillButton } from "@/components/ui/PillButton";
import { CRAVING_HREF } from "@/lib/navigation";
import { cn } from "@/lib/utils/cn";

const HERO_IMAGE = {
  src: "/images/hero/hero-kaju-katli.png",
  alt: "A diamond-cut kaju katli finished in silver leaf, resting on a dark stone surface with scattered cashews",
};

const HERO_VIDEO_SRC = "/videos/hero-kaju-katli.mp4";

// The supplied photo/video frame the sweet right-of-center with negative
// space on the left, reserved for the text column below. Bias object-fit
// cropping toward that point so the subject survives any viewport ratio.
const MEDIA_OBJECT_POSITION = "68% center";

const DESKTOP_QUERY = "(min-width: 1024px)";

// Plain CSS transitions rather than a JS animation loop: a single mount
// effect flips `entered`, and the browser's own compositor handles each
// item's fade/rise on its staggered `delay-[…]`. Simpler and more robust
// than coordinating several independently-timed animate() calls, and it
// degrades safely -- if JS never runs, content is still in the DOM, just
// held at its (readable) pre-entrance state via the reduced-motion escape
// hatch below.
function EntranceItem({
  entered,
  delayMs,
  className,
  children,
}: {
  entered: boolean;
  delayMs: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{ transitionDelay: entered ? `${delayMs}ms` : "0ms" }}
      className={cn(
        "transition-[opacity,transform] duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
        "motion-reduce:transition-none motion-reduce:delay-0",
        entered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}

function HeroMedia({ isDesktop }: { isDesktop: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (!isDesktop) return;
    const video = videoRef.current;
    if (!video) return;

    let retried = false;
    const markReady = () => setVideoReady(true);
    video.addEventListener("playing", markReady);

    // The `autoPlay` attribute alone can silently fail (browser autoplay
    // policy, power-saving mode, an extension). Only fade the video in
    // once it has actually started playing -- if it never does, the
    // poster image underneath just keeps showing, which is the correct
    // fallback rather than revealing a frozen paused frame that looks
    // identical to a static image.
    const attemptPlay = () => {
      video.play().catch(() => {
        if (retried) return;
        retried = true;
        window.setTimeout(attemptPlay, 400);
      });
    };
    attemptPlay();

    return () => {
      video.removeEventListener("playing", markReady);
    };
  }, [isDesktop]);

  return (
    <>
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1 }}
        animate={isDesktop ? { scale: 1 } : { scale: 1.05 }}
        transition={
          isDesktop
            ? { duration: 0 }
            : { duration: 10, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
        }
      >
        <Image
          src={HERO_IMAGE.src}
          alt={HERO_IMAGE.alt}
          fill
          priority
          sizes="100vw"
          style={{ objectPosition: MEDIA_OBJECT_POSITION }}
          className="object-cover"
        />
      </motion.div>
      {isDesktop && (
        <motion.video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={HERO_IMAGE.src}
          initial={{ opacity: 0 }}
          animate={{ opacity: videoReady ? 1 : 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ objectPosition: MEDIA_OBJECT_POSITION }}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={HERO_VIDEO_SRC} type="video/mp4" />
        </motion.video>
      )}
    </>
  );
}

function ScrollIndicator() {
  return (
    <motion.div
      animate={{ y: [0, 6, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-cream/70"
    >
      <span className="font-label text-[10px] uppercase tracking-[0.3em]">Scroll</span>
      <span aria-hidden className="text-sm leading-none">
        ↓
      </span>
    </motion.div>
  );
}

/**
 * Cinematic hero: the supplied Kaju Katli video (desktop, lg+) or still
 * image (mobile/tablet) is the visual protagonist, with a left-weighted
 * text column and a slow, restrained scroll-linked exit. No pinning --
 * native scroll stays intact throughout.
 */
export function SweetHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    // One-time read of a browser-only media query; can't run during SSR render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDesktop(window.matchMedia(DESKTOP_QUERY).matches);
    // Kick off the entrance sequence once mounted.
    setEntered(true);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const mediaScale = useTransform(scrollYProgress, [0, 1], [1, 1.03]);
  const textY = useTransform(scrollYProgress, [0, 0.7], [0, -32]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  return (
    <section ref={sectionRef} className="relative h-screen w-full overflow-hidden bg-ink">
      <motion.div style={{ scale: mediaScale }} className="absolute inset-0">
        <HeroMedia isDesktop={isDesktop} />
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-r from-ink/60 via-ink/15 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent" />

      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="relative z-10 flex h-full max-w-lg flex-col justify-center px-6 lg:px-16"
      >
        <EntranceItem entered={entered} delayMs={1000}>
          <Eyebrow tone="cream">Port Coquitlam, BC</Eyebrow>
        </EntranceItem>

        <EntranceItem entered={entered} delayMs={1300} className="mt-4">
          <h1 className="font-display text-[clamp(48px,10vw,80px)] leading-[0.95] text-cream lg:text-[clamp(64px,7vw,110px)]">
            What&rsquo;s your
            <br />
            craving?
          </h1>
        </EntranceItem>

        <EntranceItem entered={entered} delayMs={1800} className="mt-5 max-w-md">
          <p className="font-body text-lg text-cream/85">
            Real Indian sweets and North Indian cooking, made fresh every day in Port Coquitlam.
          </p>
        </EntranceItem>

        <EntranceItem entered={entered} delayMs={2200} className="mt-8 flex flex-wrap gap-3">
          <PillButton href={CRAVING_HREF} className="group">
            <span className="inline-flex items-center gap-2">
              <span className="transition-transform duration-[380ms] ease-out group-hover:translate-x-[2px]">
                Tell us what you&rsquo;re craving
              </span>
              <span aria-hidden className="transition-transform duration-[380ms] ease-out group-hover:translate-x-1">
                →
              </span>
            </span>
          </PillButton>
          <PillButton href="/menu" variant="ghostOnDark">
            See the menu
          </PillButton>
        </EntranceItem>
      </motion.div>

      <ScrollIndicator />
    </section>
  );
}
