import Image from "next/image";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getMenuItem } from "@/data/menu";
import { getDishImage } from "@/data/imageManifest";
import { formatPrice } from "@/lib/utils/formatPrice";
import { Reveal } from "@/components/motion/Reveal";
import { HorizontalScroller } from "@/components/motion/HorizontalScroller";

const SIGNATURE_DISH_IDS = [
  "butter-paneer",
  "chicken-tikka-masala",
  "chicken-biryani",
  "kaju-katli",
  "paneer-tikka",
  "chaat-papdi",
] as const;

export function SignatureDishes() {
  return (
    <section className="py-20 lg:py-28">
      <Reveal className="px-6 lg:px-10">
        <Eyebrow>03 — Signature Dishes</Eyebrow>
        <h2 className="mt-4 max-w-lg font-display text-[44px] leading-[0.95] text-ink lg:text-[64px]">
          A few favourites
        </h2>
      </Reveal>

      <HorizontalScroller count={SIGNATURE_DISH_IDS.length} className="mt-12">
        {SIGNATURE_DISH_IDS.map((itemId) => {
          const item = getMenuItem(itemId);
          if (!item) return null;
          const image = getDishImage(itemId, item.categoryId);
          return (
            <Link
              key={itemId}
              href={`/menu#${itemId}`}
              className="group flex w-[260px] shrink-0 snap-start flex-col gap-4 lg:w-[320px]"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-image bg-peach">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1024px) 320px, 260px"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-body text-lg text-ink">{item.name}</span>
                <span className="font-body text-ink/70">{formatPrice(item.price)}</span>
              </div>
            </Link>
          );
        })}
      </HorizontalScroller>
    </section>
  );
}
