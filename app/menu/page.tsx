import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { MenuCategoryNav } from "@/components/menu/MenuCategoryNav";
import { MenuCategorySection } from "@/components/menu/MenuCategorySection";
import { MENU_CATEGORIES } from "@/data/menu";

export const metadata: Metadata = {
  title: "Menu — Bombay Sweets",
  description: "The full Bombay Sweets menu: sweets, chaat, tandoori, curries, breads and more.",
};

export default function MenuPage() {
  return (
    <main className="px-6 lg:px-10">
      <div className="py-16 lg:py-24">
        <Eyebrow>Full Menu</Eyebrow>
        <h1 className="mt-4 font-display text-[56px] leading-[0.95] text-ink lg:text-[88px]">
          Everything we make
        </h1>
        <p className="mt-6 max-w-xl font-body text-lg text-ink/70">
          Every dish, priced and ready to order. Call ahead for pickup, or browse and find what
          you&rsquo;re craving.
        </p>
      </div>

      <MenuCategoryNav />

      <div className="divide-y divide-ink/10">
        {MENU_CATEGORIES.map((category) => (
          <MenuCategorySection key={category.id} category={category} />
        ))}
      </div>
    </main>
  );
}
