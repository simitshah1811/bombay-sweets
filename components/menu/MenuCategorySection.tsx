import type { MenuCategory } from "@/data/types";
import { getCategoryItems } from "@/data/menu";
import { MenuItemRow } from "@/components/menu/MenuItemRow";

export function MenuCategorySection({ category }: { category: MenuCategory }) {
  const items = getCategoryItems(category.id);

  return (
    <section id={category.id} className="scroll-mt-36 py-14 first:pt-0">
      <div className="mb-8 flex items-baseline gap-4">
        <span className="font-label text-xs text-ink/40">{String(category.order).padStart(2, "0")}</span>
        <h2 className="font-display text-4xl text-ink lg:text-5xl">{category.name}</h2>
      </div>
      <div>
        {items.map((item) => (
          <MenuItemRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
