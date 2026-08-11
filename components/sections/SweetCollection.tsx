"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { getMenuItem } from "@/data/menu";
import { formatPrice } from "@/lib/utils/formatPrice";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils/cn";

interface CollectionSweet {
  itemId: string;
  image: string;
  alt: string;
  span: string;
  hero?: boolean;
}

const COLLECTION: CollectionSweet[] = [
  {
    itemId: "gulab-jamun",
    image: "/images/collection/gulab-jamun.png",
    alt: "A glossy syrup-soaked gulab jamun on a warm ivory background",
    span: "col-span-2 row-span-2",
    hero: true,
  },
  {
    itemId: "white-rasgulla",
    image: "/images/collection/white-rasgulla.png",
    alt: "A white spongy rasgulla in light syrup on a warm ivory background",
    span: "col-span-1 row-span-1",
  },
  {
    itemId: "besan-barfi",
    image: "/images/collection/besan-barfi.png",
    alt: "A besan barfi with a pistachio topping on a warm ivory background",
    span: "col-span-1 row-span-2",
  },
  {
    itemId: "kaju-katli",
    image: "/images/collection/kaju-katli.png",
    alt: "A diamond-cut kaju katli with silver leaf on a warm ivory background",
    span: "col-span-1 row-span-1",
  },
  {
    itemId: "milk-cake",
    image: "/images/collection/milk-cake.png",
    alt: "A square piece of Indian milk cake on a warm ivory background",
    span: "col-span-1 row-span-1 lg:col-span-2",
  },
  {
    itemId: "boondi-ladoo",
    image: "/images/collection/boondi-ladoo.png",
    alt: "A round boondi ladoo on a warm ivory background",
    span: "col-span-1 row-span-1 lg:col-span-2",
  },
];

export function SweetCollection() {
  return (
    <section className="bg-peach px-6 py-20 lg:px-10 lg:py-28">
      <Reveal className="text-center">
        <Eyebrow className="justify-center">The Collection</Eyebrow>
        <h2 className="mt-4 font-display text-[36px] leading-[0.95] text-ink lg:text-[52px]">
          A gallery of sweets
        </h2>
      </Reveal>

      <div className="mx-auto mt-12 grid max-w-6xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:auto-rows-[220px] lg:gap-6">
        {COLLECTION.map((sweet, i) => {
          const item = getMenuItem(sweet.itemId);
          if (!item) return null;
          return (
            <motion.div
              key={sweet.itemId}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={cn("group relative aspect-square overflow-hidden rounded-image lg:aspect-auto", sweet.span)}
            >
              <Link href={`/menu#${item.id}`} className="absolute inset-0">
                <Image
                  src={sweet.image}
                  alt={sweet.alt}
                  fill
                  sizes={sweet.hero ? "(min-width: 1024px) 50vw, 90vw" : "(min-width: 1024px) 25vw, 45vw"}
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  priority={sweet.hero}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent px-5 pb-4 pt-12">
                  <span
                    className={cn(
                      "block font-display text-cream",
                      sweet.hero ? "text-2xl lg:text-3xl" : "text-lg lg:text-xl"
                    )}
                  >
                    {item.name.replace(/\s*\(1 lb\)/, "")}
                  </span>
                  <span className="mt-1 block font-body text-sm text-cream/80">{formatPrice(item.price)}</span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
