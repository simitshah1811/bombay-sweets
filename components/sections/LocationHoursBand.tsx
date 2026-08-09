import { Eyebrow } from "@/components/ui/Eyebrow";
import { PillButton } from "@/components/ui/PillButton";
import { business } from "@/data/business";

export function LocationHoursBand() {
  return (
    <section id="visit" className="scroll-mt-24 grid gap-10 px-6 py-20 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-28">
      <div className="flex flex-col justify-center gap-6">
        <Eyebrow>08 — Visit</Eyebrow>
        <h2 className="font-display text-[40px] leading-[0.95] text-ink lg:text-[56px]">Find us</h2>

        <div className="flex flex-col gap-1 font-body text-lg text-ink/80">
          <span>{business.address.street}</span>
          <span>
            {business.address.city}, {business.address.region} {business.address.postalCode}
          </span>
        </div>

        <div className="flex flex-col gap-1 font-body text-lg text-ink/80">
          {business.hours.map((h) => (
            <span key={h.days}>
              {h.days}: {h.time}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-1 font-body text-lg text-ink/80">
          <a href={business.phoneHref} className="w-fit hover:text-ink">
            {business.phone}
          </a>
          <a href={`mailto:${business.email}`} className="w-fit hover:text-ink">
            {business.email}
          </a>
        </div>

        <PillButton href={business.mapsHref} className="mt-2 w-fit">
          Get directions
        </PillButton>
      </div>

      <div className="aspect-[4/3] w-full overflow-hidden rounded-image lg:aspect-auto">
        <iframe
          title="Bombay Sweets location map"
          src={`https://maps.google.com/maps?q=${encodeURIComponent(business.addressLine)}&z=15&output=embed`}
          className="h-full min-h-[360px] w-full border-0 grayscale-[15%]"
          loading="lazy"
        />
      </div>
    </section>
  );
}
