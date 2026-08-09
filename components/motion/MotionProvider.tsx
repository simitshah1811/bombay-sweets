"use client";

import { MotionConfig } from "motion/react";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <SmoothScrollProvider>{children}</SmoothScrollProvider>
    </MotionConfig>
  );
}
