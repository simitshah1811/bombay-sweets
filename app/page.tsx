import { Eyebrow } from "@/components/ui/Eyebrow";
import { PillButton } from "@/components/ui/PillButton";
import { Chip } from "@/components/ui/Chip";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-start justify-center gap-6 px-8 py-24">
      <Eyebrow>Bombay Sweets · Port Coquitlam</Eyebrow>
      <h1 className="font-display text-[72px] leading-[0.9] tracking-[-0.02em] text-ink">
        What&rsquo;s your craving?
      </h1>
      <p className="max-w-xl font-body text-lg text-ink/80">
        Design tokens sanity check — Fraunces display, Lora body, Inter labels.
      </p>
      <div className="flex flex-wrap gap-3">
        <Chip selected>Spicy</Chip>
        <Chip>Sweet</Chip>
        <Chip>Vegetarian</Chip>
      </div>
      <PillButton href="/menu">See Menu</PillButton>
    </main>
  );
}
