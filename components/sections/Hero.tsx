"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PillButton } from "@/components/ui/PillButton";
import { CRAVING_HREF } from "@/lib/navigation";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { StaggerText } from "@/components/motion/StaggerText";
import { MagneticButton } from "@/components/motion/MagneticButton";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  return (
    <section className="relative h-[88vh] min-h-[600px] w-full overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: EASE }}
        className="absolute inset-0"
      >
        <ParallaxImage strength={80}>
          <Image
            src="/images/heritage/curry-kadai.jpg"
            alt="A copper kadai of paneer curry, garnished with cream and cilantro"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </ParallaxImage>
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-ink/5" />

      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-16 lg:px-10 lg:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
        >
          <Eyebrow tone="cream">Port Coquitlam, BC</Eyebrow>
        </motion.div>

        <h1 className="mt-4 max-w-3xl font-display text-[52px] leading-[0.95] text-cream lg:text-[84px]">
          <StaggerText text="What’s your craving?" delay={0.35} />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.75, ease: EASE }}
          className="mt-5 max-w-md font-body text-lg text-cream/85"
        >
          Real North Indian cooking and Indian sweets, made fresh every day.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9, ease: EASE }}
          className="mt-8 flex flex-wrap gap-3"
        >
          <MagneticButton>
            <PillButton href={CRAVING_HREF}>Tell us what you&rsquo;re craving</PillButton>
          </MagneticButton>
          <MagneticButton>
            <PillButton href="/menu" variant="ghostOnDark">
              See the menu
            </PillButton>
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
}
