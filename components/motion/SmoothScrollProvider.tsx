"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Mobile browsers resize the viewport (the address bar collapsing/expanding
// as the page scrolls) far more often than desktop does. Without this,
// every one of those resizes makes ScrollTrigger recalculate its pinned
// sections' start/end points mid-scroll -- on a phone that shows up as the
// pinned scroll-driven sections (SweetHandcraft, SweetIngredientStory)
// simply not animating, or animating once and then freezing. This is
// GSAP's own documented fix for exactly that symptom.
ScrollTrigger.config({ ignoreMobileResize: true });

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3),
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
