import Image from "next/image";
import type { DiscoveryResult } from "@/lib/discovery/score";
import { getDishImage } from "@/data/imageManifest";
import { formatPrice } from "@/lib/utils/formatPrice";
import { PillButton } from "@/components/ui/PillButton";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

export function ResultCard({ result }: { result: DiscoveryResult }) {
  const { item, reasons } = result;
  const image = getDishImage(item.id, item.categoryId);

  return (
    <div className="flex flex-col overflow-hidden rounded-image bg-cream text-left">
      <div className="relative aspect-[4/3] w-full bg-peach">
        <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 25vw, 90vw" className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-body text-lg font-medium text-ink">{item.name}</span>
          <span className="font-body text-ink/70">{formatPrice(item.price)}</span>
        </div>
        {item.description && (
          <p className="font-body text-sm leading-relaxed text-ink/60">{item.description}</p>
        )}
        {reasons.length > 0 && (
          <p className="font-label text-xs uppercase tracking-[0.15em] text-saffron">
            {reasons.join(" · ")}
          </p>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <PillButton href={`/menu#${item.id}`} variant="ghost" className="px-4 py-2 text-sm">
            View on menu
          </PillButton>
          <AddToCartButton itemId={item.id} className="px-4 py-2 text-sm" />
        </div>
      </div>
    </div>
  );
}
