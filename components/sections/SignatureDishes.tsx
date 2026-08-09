import Image from "next/image";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getMenuItem } from "@/data/menu";
import { formatPrice } from "@/lib/utils/formatPrice";

const SIGNATURE_DISHES = [
  {
    itemId: "butter-paneer",
    image: "/images/heritage/curry-kadai.jpg",
    alt: "Cubes of paneer in a creamy tomato gravy, finished with cream and cilantro",
  },
  {
    itemId: "chicken-tikka-masala",
    image: "/images/heritage/tikka-curry.jpg",
    alt: "Charred chicken tikka pieces simmered in a rich tomato gravy",
  },
  {
    itemId: "chicken-biryani",
    image: "/images/heritage/thali-spread.jpg",
    alt: "A spread of copper kadai bowls with rice and curries",
  },
  {
    itemId: "kaju-katli",
    image: "/images/heritage/sweets-platter.jpg",
    alt: "An assortment of Indian sweets including barfi, ladoo, and jalebi",
  },
  {
    itemId: "paneer-tikka",
    image: "/images/placeholder.svg",
    alt: "Paneer tikka",
  },
  {
    itemId: "chaat-papdi",
    image: "/images/placeholder.svg",
    alt: "Chaat papdi",
  },
] as const;

export function SignatureDishes() {
  return (
    <section className="py-20 lg:py-28">
      <div className="px-6 lg:px-10">
        <Eyebrow>03 — Signature Dishes</Eyebrow>
        <h2 className="mt-4 max-w-lg font-display text-[44px] leading-[0.95] text-ink lg:text-[64px]">
          A few favourites
        </h2>
      </div>

      <div className="mt-12 flex gap-5 overflow-x-auto px-6 pb-4 lg:px-10 [scrollbar-width:none]">
        {SIGNATURE_DISHES.map(({ itemId, image, alt }) => {
          const item = getMenuItem(itemId);
          if (!item) return null;
          return (
            <Link
              key={itemId}
              href={`/menu#${itemId}`}
              className="group flex w-[260px] shrink-0 flex-col gap-4 lg:w-[320px]"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-image bg-peach">
                <Image
                  src={image}
                  alt={alt}
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
      </div>
    </section>
  );
}
