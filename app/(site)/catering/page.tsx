import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PillButton } from "@/components/ui/PillButton";
import { business } from "@/data/business";

export const metadata: Metadata = {
  title: "Catering",
  description: "Bombay Sweets catering for weddings, graduations, corporate and holiday events in Port Coquitlam.",
};

export default function CateringPage() {
  return (
    <main className="px-6 py-24 lg:px-10">
      <Eyebrow>Catering</Eyebrow>
      <h1 className="mt-4 font-display text-[56px] leading-[0.95] text-ink lg:text-[88px]">
        Feed the whole crowd
      </h1>
      <p className="mt-6 max-w-xl font-body text-lg text-ink/70">
        We cater weddings, graduations, corporate events and holiday parties across the Tri-Cities —
        full details and packages are coming to this page.
      </p>
      <PillButton href={business.phoneHref} className="mt-8">
        Call to discuss catering
      </PillButton>
    </main>
  );
}
