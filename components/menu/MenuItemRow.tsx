import type { MenuItemForDisplay } from "@/lib/menu/queries";
import { DietDot, SpiceMarks, PrepBadge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils/formatPrice";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { cn } from "@/lib/utils/cn";

export function MenuItemRow({ item }: { item: MenuItemForDisplay }) {
  return (
    <div
      id={item.id}
      className={cn(
        "-mx-3 flex items-start justify-between gap-6 rounded-control border-b border-ink/10 px-3 py-5 transition-colors duration-200 first:pt-0 last:border-b-0 hover:bg-peach/50",
        !item.isAvailable && "opacity-50"
      )}
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <DietDot tone={item.isVegetarian ? "veg" : "nonveg"} />
          <span className="font-body text-[17px] font-medium text-ink">{item.name}</span>
          <SpiceMarks level={(item.spiceLevel ?? 0) as 0 | 1 | 2 | 3} />
        </div>
        {item.description && (
          <p className="max-w-xl font-body text-sm leading-relaxed text-ink/60">{item.description}</p>
        )}
        {item.isAvailable && (
          <PrepBadge status={item.preparationStatus} minutes={item.preparationMinutes} className="mt-0.5" />
        )}
        {!item.isAvailable && (
          <span className="font-label text-[11px] uppercase tracking-[0.15em] text-maroon">
            Currently unavailable
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="font-body text-[17px] text-ink">{formatPrice(item.price)}</span>
        {item.isAvailable ? (
          <AddToCartButton
            itemId={item.id}
            itemName={item.name}
            price={item.price}
            modifierGroups={item.modifierGroups}
            preparationStatus={item.preparationStatus}
            preparationMinutes={item.preparationMinutes}
            size="compact"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/20 font-body text-lg leading-none text-ink/30"
          >
            &mdash;
          </span>
        )}
      </div>
    </div>
  );
}
