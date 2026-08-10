import { Reveal } from "@/components/motion/Reveal";
import { PillButton } from "@/components/ui/PillButton";

export function SweetFinalCTA() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center gap-6 bg-cream px-6 py-24 text-center">
      <Reveal className="flex flex-col items-center gap-6">
        <p className="font-label text-xs uppercase tracking-[0.2em] text-ink/50">
          Made to be shared
        </p>
        <h2 className="max-w-2xl font-display text-[44px] leading-[0.95] text-ink lg:text-[76px]">
          Explore the collection
        </h2>
        <PillButton href="/menu#sweets" className="mt-2">
          Order now
        </PillButton>
      </Reveal>
    </section>
  );
}
