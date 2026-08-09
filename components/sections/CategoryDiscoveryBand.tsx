import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";

const FEATURED_CATEGORIES = [
  { id: "sweets", name: "Sweets" },
  { id: "chaat-specials", name: "Chaat" },
  { id: "tandoori-passion", name: "Tandoori" },
  { id: "chicken-specialties", name: "Curries" },
  { id: "vegetarian-specialties", name: "Vegetarian" },
  { id: "rice-specials", name: "Biryani & Rice" },
  { id: "breads", name: "Breads" },
  { id: "namkeen-snacks", name: "Snacks" },
];

export function CategoryDiscoveryBand() {
  return (
    <section className="bg-peach px-6 py-20 lg:px-10 lg:py-28">
      <Reveal>
        <Eyebrow>06 — Browse by Craving</Eyebrow>
        <h2 className="mt-4 max-w-lg font-display text-[40px] leading-[0.95] text-ink lg:text-[56px]">
          Where do you want to start?
        </h2>
      </Reveal>

      <Reveal delay={0.1} className="mt-12 grid grid-cols-2 border-t border-ink/15 lg:grid-cols-4">
        {FEATURED_CATEGORIES.map((category) => (
          <Link
            key={category.id}
            href={`/menu#${category.id}`}
            className="group flex items-center justify-between gap-2 border-b border-r border-ink/15 px-1 py-8 [&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(4n)]:border-r-0"
          >
            <span className="font-display text-2xl text-ink transition-colors lg:text-3xl">
              {category.name}
            </span>
            <span className="font-body text-xl text-ink/40 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-ink">
              →
            </span>
          </Link>
        ))}
      </Reveal>
    </section>
  );
}
