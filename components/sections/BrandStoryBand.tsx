import Image from "next/image";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";

export function BrandStoryBand() {
  return (
    <section className="grid gap-10 px-6 py-20 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-28">
      <Reveal y={0} className="lg:sticky lg:top-28 lg:h-fit">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-image bg-peach">
          <Image
            src="/images/heritage/sweets-platter.jpg"
            alt="An assortment of Indian sweets including barfi, ladoo, and jalebi"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </Reveal>

      <div className="flex flex-col justify-center gap-6">
        <Reveal>
          <Eyebrow>05 — Our Story</Eyebrow>
          <h2 className="mt-4 font-display text-[40px] leading-[0.95] text-ink lg:text-[56px]">
            Rooted in tradition,
            <br />
            made for today
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="max-w-lg font-body text-lg leading-relaxed text-ink/75">
            Bombay Sweets has spent decades bringing North Indian cooking and Indian sweets to
            Port Coquitlam — built on quality, affordability, and recipes that don&rsquo;t cut
            corners.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="max-w-lg font-body text-lg leading-relaxed text-ink/75">
            Bread is made fresh in-house every day. Dishes are cooked to order with fresh
            vegetables and good meat, the same way they always have been. Customer satisfaction
            has kept us growing — and kept the tradition alive.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
