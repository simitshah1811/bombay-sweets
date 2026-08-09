import Link from "next/link";
import { MENU_CATEGORIES } from "@/data/menu";

export function MenuCategoryNav() {
  return (
    <nav
      aria-label="Menu categories"
      className="sticky top-[85px] z-30 -mx-6 overflow-x-auto border-b border-ink/10 bg-cream/95 px-6 py-4 backdrop-blur-sm lg:-mx-10 lg:px-10"
    >
      <div className="flex w-max gap-2.5">
        {MENU_CATEGORIES.map((category) => (
          <Link
            key={category.id}
            href={`#${category.id}`}
            className="whitespace-nowrap rounded-pill border border-ink/20 px-4 py-2 font-body text-sm text-ink/80 transition-colors hover:border-ink hover:text-ink"
          >
            {category.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
