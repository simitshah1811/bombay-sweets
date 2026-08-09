import type { MenuItem } from "@/data/types";
import { getItemTags } from "@/data/menu-tags";
import { DietDot, SpiceMarks } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils/formatPrice";

export function MenuItemRow({ item }: { item: MenuItem }) {
  const tags = getItemTags(item.id);

  return (
    <div
      id={item.id}
      className="-mx-3 flex items-start justify-between gap-6 rounded-control border-b border-ink/10 px-3 py-5 transition-colors duration-200 first:pt-0 last:border-b-0 hover:bg-peach/50"
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <DietDot tone={tags.veg ? "veg" : "nonveg"} />
          <span className="font-body text-[17px] font-medium text-ink">{item.name}</span>
          <SpiceMarks level={tags.spiceLevel} />
        </div>
        {item.description && (
          <p className="max-w-xl font-body text-sm leading-relaxed text-ink/60">{item.description}</p>
        )}
      </div>
      <span className="shrink-0 font-body text-[17px] text-ink">{formatPrice(item.price)}</span>
    </div>
  );
}
