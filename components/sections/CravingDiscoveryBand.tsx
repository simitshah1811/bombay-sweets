import { Eyebrow } from "@/components/ui/Eyebrow";
import { Chip } from "@/components/ui/Chip";

const INTENTS = [
  "Spicy",
  "Sweet",
  "Vegetarian",
  "Comfort Food",
  "Light",
  "High Protein",
  "Snacks",
  "Dessert",
  "Surprise Me",
];

export function CravingDiscoveryBand() {
  return (
    <section id="discover" className="scroll-mt-24 bg-peach px-6 py-20 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <Eyebrow className="justify-center">02 — What are you craving?</Eyebrow>
        <h2 className="mt-4 font-display text-[44px] leading-[0.95] text-ink lg:text-[64px]">
          Tell us what sounds good.
        </h2>
        <p className="mt-5 font-body text-lg text-ink/70">
          Pick a craving or describe it in your own words — we&rsquo;ll point you to the dishes
          that fit.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {INTENTS.map((intent) => (
            <Chip key={intent}>{intent}</Chip>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-lg">
          <input
            type="text"
            placeholder="Or describe your craving — “something spicy and vegetarian”"
            className="w-full rounded-pill border border-ink/25 bg-cream px-6 py-4 font-body text-ink placeholder:text-ink/40 focus:border-ink focus:outline-none"
            disabled
          />
        </div>
      </div>
    </section>
  );
}
