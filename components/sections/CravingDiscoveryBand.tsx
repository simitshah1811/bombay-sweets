import { Eyebrow } from "@/components/ui/Eyebrow";
import { DiscoveryPanel } from "@/components/discovery/DiscoveryPanel";

export function CravingDiscoveryBand() {
  return (
    <section id="discover" className="scroll-mt-24 bg-peach px-6 py-20 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow className="justify-center">02 — What are you craving?</Eyebrow>
          <h2 className="mt-4 font-display text-[44px] leading-[0.95] text-ink lg:text-[64px]">
            Tell us what sounds good.
          </h2>
          <p className="mt-5 font-body text-lg text-ink/70">
            Pick a craving or describe it in your own words — we&rsquo;ll point you to the dishes
            that fit.
          </p>
        </div>

        <DiscoveryPanel />
      </div>
    </section>
  );
}
