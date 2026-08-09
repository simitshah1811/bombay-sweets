import { Eyebrow } from "@/components/ui/Eyebrow";
import { PillButton } from "@/components/ui/PillButton";
import { business } from "@/data/business";

export function CateringBand() {
  return (
    <section className="bg-maroon px-6 py-20 text-cream lg:px-10 lg:py-28">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-6">
        <Eyebrow tone="cream">07 — Catering</Eyebrow>
        <h2 className="font-display text-[44px] leading-[0.95] lg:text-[72px]">
          Feed the whole crowd
        </h2>
        <p className="max-w-xl font-body text-lg text-cream/85">
          Weddings, graduations, corporate events, holiday parties — we cater celebrations across
          the Tri-Cities, cooked the same way as everything else on our menu.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <PillButton href="/catering" variant="filled" className="bg-cream text-ink hover:bg-cream/85">
            Catering details
          </PillButton>
          <PillButton href={business.phoneHref} variant="ghostOnDark">
            Call to discuss
          </PillButton>
        </div>
      </div>
    </section>
  );
}
