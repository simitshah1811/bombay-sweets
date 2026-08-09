import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: "Menu — Bombay Sweets",
  description: "The full Bombay Sweets menu: sweets, chaat, tandoori, curries, breads and more.",
};

export default function MenuPage() {
  return (
    <main className="px-6 py-24 lg:px-10">
      <Eyebrow>Full Menu</Eyebrow>
      <h1 className="mt-4 font-display text-[56px] leading-[0.95] text-ink lg:text-[88px]">
        Everything we make
      </h1>
      <p className="mt-6 max-w-xl font-body text-lg text-ink/70">
        The full menu is coming together — every category and dish, priced and ready to browse.
      </p>
    </main>
  );
}
