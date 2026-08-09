import Image from "next/image";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PillButton } from "@/components/ui/PillButton";
import { CRAVING_HREF } from "@/lib/navigation";

export function Hero() {
  return (
    <section className="relative h-[88vh] min-h-[600px] w-full overflow-hidden">
      <Image
        src="/images/heritage/curry-kadai.jpg"
        alt="A copper kadai of paneer curry, garnished with cream and cilantro"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-ink/5" />

      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-16 lg:px-10 lg:pb-20">
        <Eyebrow tone="cream">Port Coquitlam, BC</Eyebrow>
        <h1 className="mt-4 max-w-3xl font-display text-[52px] leading-[0.95] text-cream lg:text-[84px]">
          What&rsquo;s your craving?
        </h1>
        <p className="mt-5 max-w-md font-body text-lg text-cream/85">
          Real North Indian cooking and Indian sweets, made fresh every day.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <PillButton href={CRAVING_HREF}>Tell us what you&rsquo;re craving</PillButton>
          <PillButton href="/menu" variant="ghostOnDark">
            See the menu
          </PillButton>
        </div>
      </div>
    </section>
  );
}
