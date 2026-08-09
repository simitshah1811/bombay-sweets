"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

export function ParallaxImage({
  children,
  strength = 60,
}: {
  children: React.ReactNode;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, strength]);

  return (
    <motion.div ref={ref} style={{ y }} className="absolute inset-0 -top-[8%] h-[116%]">
      {children}
    </motion.div>
  );
}
