import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PillButton } from "@/components/ui/PillButton";
import { NAV_LINKS, CRAVING_HREF } from "@/lib/navigation";
import { business } from "@/data/business";
import { Reveal } from "@/components/motion/Reveal";
import { Wordmark } from "@/components/ui/Wordmark";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-cream">
      <Reveal y={0} className="mx-auto grid max-w-[1600px] gap-12 px-6 py-16 lg:grid-cols-[1.2fr_1fr_1fr] lg:px-10 lg:py-24">
        <div className="flex flex-col gap-5">
          <Wordmark tone="cream" size="large" />
          <p className="max-w-sm font-body text-cream/70">{business.tagline}</p>
          <PillButton href={CRAVING_HREF} variant="ghostOnDark" className="w-fit">
            What&rsquo;s your craving?
          </PillButton>
        </div>

        <div className="flex flex-col gap-4">
          <Eyebrow tone="cream">Explore</Eyebrow>
          <nav className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-body text-cream/80 transition-colors hover:text-cream"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-4">
          <Eyebrow tone="cream">Visit</Eyebrow>
          <address className="not-italic font-body text-cream/80 leading-relaxed">
            {business.addressLine}
            <br />
            <a href={business.phoneHref} className="hover:text-cream">
              {business.phone}
            </a>
            <br />
            <a href={`mailto:${business.email}`} className="hover:text-cream">
              {business.email}
            </a>
          </address>
          <div className="font-body text-sm text-cream/60">
            {business.hours.map((h) => (
              <div key={h.days}>
                {h.days}: {h.time}
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="border-t border-cream/15 px-6 py-6 lg:px-10">
        <p className="font-body text-xs text-cream/50">
          © {new Date().getFullYear()} {business.legalName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
