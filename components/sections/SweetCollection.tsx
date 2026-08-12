"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { motion, useMotionValue, useSpring } from "motion/react";
import { getMenuItem } from "@/data/menu";
import { formatPrice } from "@/lib/utils/formatPrice";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { cn } from "@/lib/utils/cn";

interface CollectionSweet {
  itemId: string;
  navLabel: string;
  image: string;
  alt: string;
  // Only set when directly grounded in the item's real menu description --
  // never invented for items the data layer doesn't describe.
  ingredients?: string;
  wash: string;
}

const COLLECTION: CollectionSweet[] = [
  {
    itemId: "kaju-katli",
    navLabel: "Kaju Katli",
    image: "/images/collection/kaju-katli.png",
    alt: "Diamond-cut kaju katli finished with silver leaf, pistachio and almond, on a gold plate beside a lit diya",
    ingredients: "Cashew · Milk",
    wash: "var(--color-saffron)",
  },
  {
    itemId: "gulab-jamun",
    navLabel: "Gulab Jamun",
    image: "/images/collection/gulab-jamun.png",
    alt: "A pan of glossy syrup-soaked gulab jamun finished with silver leaf",
    wash: "var(--color-maroon)",
  },
  {
    itemId: "milk-cake",
    navLabel: "Milk Cake",
    image: "/images/collection/milk-cake.png",
    alt: "A square piece of Indian milk cake on a warm ivory background",
    wash: "var(--color-peach)",
  },
  {
    itemId: "besan-barfi",
    navLabel: "Besan Barfi",
    image: "/images/collection/besan-barfi.png",
    alt: "A besan barfi with a pistachio topping on a warm ivory background",
    ingredients: "Chickpea Flour",
    wash: "var(--color-saffron)",
  },
  {
    itemId: "white-rasgulla",
    navLabel: "Rasgulla",
    image: "/images/collection/white-rasgulla.png",
    alt: "A white spongy rasgulla in light syrup on a warm ivory background",
    wash: "var(--color-cream)",
  },
  {
    itemId: "boondi-ladoo",
    navLabel: "Boondi Ladoo",
    image: "/images/collection/boondi-ladoo.png",
    alt: "A round boondi ladoo on a warm ivory background",
    wash: "var(--color-saffron)",
  },
];

const COUNT = COLLECTION.length;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Desktop-only, fine-pointer-only: an extremely subtle cursor tilt on the
// active image (max ~8px translate, max 1.04 scale) -- separate DOM layer
// from the GSAP-driven crossfade wrapper so the two never fight over the
// same transform.
function TiltImage({ image, alt, priority }: { image: string; alt: string; priority: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 120, damping: 16, mass: 0.3 });
  const springY = useSpring(y, { stiffness: 120, damping: 16, mass: 0.3 });
  const scale = useSpring(1, { stiffness: 120, damping: 18 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(((e.clientX - rect.left) / rect.width - 0.5) * 16);
    y.set(((e.clientY - rect.top) / rect.height - 0.5) * 16);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => scale.set(1.04)}
      onMouseLeave={() => {
        scale.set(1);
        x.set(0);
        y.set(0);
      }}
      style={{ x: springX, y: springY, scale }}
      className="relative h-full w-full"
    >
      <Image src={image} alt={alt} fill priority={priority} sizes="70vw" className="object-cover" />
    </motion.div>
  );
}

export function SweetCollection() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const washRefs = useRef<(HTMLDivElement | null)[]>([]);
  const jumpToRef = useRef<(index: number) => void>(() => {});
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", () => {
      const images = imageRefs.current.filter((el): el is HTMLDivElement => el !== null);
      const texts = textRefs.current.filter((el): el is HTMLDivElement => el !== null);
      const washes = washRefs.current.filter((el): el is HTMLDivElement => el !== null);

      gsap.set(images, { opacity: 0, scale: 1.05 });
      gsap.set(images[0], { opacity: 1, scale: 1 });
      gsap.set(texts, { opacity: 0, y: 16 });
      gsap.set(texts[0], { opacity: 1, y: 0 });
      gsap.set(washes, { opacity: 0 });
      gsap.set(washes[0], { opacity: 1 });

      const segment = 1 / COUNT;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapper,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          pin: wrapper.firstElementChild,
          onUpdate: (self) => {
            const idx = Math.min(COUNT - 1, Math.floor(self.progress * COUNT));
            setActiveIndex(idx);
          },
        },
        defaults: { ease: "none" },
      });

      jumpToRef.current = (index: number) => {
        const st = tl.scrollTrigger;
        if (!st) return;
        const target = st.start + ((index + 0.5) * segment) * (st.end - st.start);
        window.scrollTo({ top: target, behavior: "smooth" });
      };

      for (let i = 0; i < COUNT - 1; i++) {
        const start = (i + 0.6) * segment;
        const dur = segment * 0.35;
        tl.to(images[i], { opacity: 0, scale: 1.04, duration: dur }, start)
          .to(images[i + 1], { opacity: 1, scale: 1, duration: dur }, start)
          .to(texts[i], { opacity: 0, y: -16, duration: dur * 0.7 }, start)
          .to(texts[i + 1], { opacity: 1, y: 0, duration: dur * 0.7 }, start + dur * 0.3)
          .to(washes[i], { opacity: 0, duration: dur }, start)
          .to(washes[i + 1], { opacity: 1, duration: dur }, start);
      }

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <section className="relative bg-ink">
      <div ref={wrapperRef} className="relative lg:h-[600vh]">
        <div className="lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden">
          {/* Environmental color wash, desktop only */}
          <div className="absolute inset-0 hidden lg:block" aria-hidden>
            {COLLECTION.map((sweet, i) => (
              <div
                key={sweet.itemId}
                ref={(el) => {
                  washRefs.current[i] = el;
                }}
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse at 65% 45%, ${sweet.wash} 0%, transparent 60%)`,
                  opacity: 0.16,
                }}
              />
            ))}
          </div>

          {/* Desktop: pinned scroll-driven composition */}
          <div className="relative z-10 hidden h-full grid-cols-[0.34fr_0.66fr] gap-10 px-10 py-16 lg:grid xl:px-16">
            <div className="flex flex-col justify-between">
              <Reveal>
                <Eyebrow tone="cream">The Collection</Eyebrow>
                <h2 className="mt-4 font-display text-[44px] leading-[0.95] text-cream xl:text-[52px]">
                  A little piece
                  <br />
                  of India.
                </h2>
              </Reveal>

              <nav className="flex flex-col gap-1" aria-label="Jump to a sweet">
                {COLLECTION.map((sweet, i) => (
                  <button
                    key={sweet.itemId}
                    type="button"
                    onClick={() => jumpToRef.current(i)}
                    className={cn(
                      "group flex items-baseline gap-3 border-l py-2 pl-4 text-left transition-all duration-300",
                      i === activeIndex ? "border-cream/70" : "border-cream/15"
                    )}
                  >
                    <span
                      className={cn(
                        "font-label text-[11px] transition-colors duration-300",
                        i === activeIndex ? "text-cream/70" : "text-cream/30"
                      )}
                    >
                      {pad(i + 1)}
                    </span>
                    <span
                      className={cn(
                        "font-display text-lg transition-colors duration-300",
                        i === activeIndex ? "text-cream" : "text-cream/35 group-hover:text-cream/60"
                      )}
                    >
                      {sweet.navLabel}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="relative h-full overflow-hidden rounded-image">
              {COLLECTION.map((sweet, i) => (
                <div
                  key={sweet.itemId}
                  ref={(el) => {
                    imageRefs.current[i] = el;
                  }}
                  aria-hidden={i !== activeIndex}
                  className="absolute inset-0"
                >
                  <TiltImage image={sweet.image} alt={sweet.alt} priority={i === 0} />
                </div>
              ))}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 min-h-[300px] bg-gradient-to-t from-ink/90 via-ink/30 to-transparent px-10 pb-10 pt-24">
                {COLLECTION.map((sweet, i) => {
                  const item = getMenuItem(sweet.itemId);
                  if (!item) return null;
                  return (
                    <div
                      key={sweet.itemId}
                      ref={(el) => {
                        textRefs.current[i] = el;
                      }}
                      aria-hidden={i !== activeIndex}
                      inert={i !== activeIndex}
                      className={cn(
                        "absolute inset-x-10 bottom-10",
                        i === activeIndex ? "pointer-events-auto" : "pointer-events-none"
                      )}
                    >
                      <span className="font-label text-xs text-cream/60">
                        {pad(i + 1)} / {pad(COUNT)}
                      </span>
                      <h3 className="mt-3 font-display text-4xl leading-[0.95] text-cream xl:text-5xl">
                        {item.name.replace(/\s*\(1 lb\)/, "")}
                      </h3>
                      {sweet.ingredients && (
                        <p className="mt-2 font-label text-xs uppercase tracking-[0.15em] text-cream/60">
                          {sweet.ingredients}
                        </p>
                      )}
                      {item.description && (
                        <p className="mt-2 max-w-sm font-body text-cream/70">{item.description}</p>
                      )}
                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        <span className="font-body text-xl text-cream">{formatPrice(item.price)}</span>
                        <AddToCartButton itemId={sweet.itemId} className="px-5 py-2.5 text-sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mobile / reduced-motion: natural vertical stack, no pin */}
          <div className="px-6 py-20 lg:hidden">
            <Reveal>
              <Eyebrow tone="cream">The Collection</Eyebrow>
              <h2 className="mt-4 font-display text-[36px] leading-[0.95] text-cream">
                A little piece
                <br />
                of India.
              </h2>
            </Reveal>

            <div className="mt-12 flex flex-col gap-16">
              {COLLECTION.map((sweet, i) => {
                const item = getMenuItem(sweet.itemId);
                if (!item) return null;
                return (
                  <Reveal key={sweet.itemId} delay={0.05}>
                    <span className="font-label text-xs text-cream/50">
                      {pad(i + 1)} / {pad(COUNT)}
                    </span>
                    <div className="relative mt-3 aspect-[4/5] w-full overflow-hidden rounded-image">
                      <Image
                        src={sweet.image}
                        alt={sweet.alt}
                        fill
                        sizes="90vw"
                        className="object-cover"
                      />
                    </div>
                    <h3 className="mt-5 font-display text-3xl leading-[0.95] text-cream">
                      {item.name.replace(/\s*\(1 lb\)/, "")}
                    </h3>
                    {sweet.ingredients && (
                      <p className="mt-2 font-label text-xs uppercase tracking-[0.15em] text-cream/60">
                        {sweet.ingredients}
                      </p>
                    )}
                    {item.description && (
                      <p className="mt-2 font-body text-cream/70">{item.description}</p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <span className="font-body text-xl text-cream">{formatPrice(item.price)}</span>
                      <AddToCartButton itemId={sweet.itemId} className="px-5 py-2.5 text-sm" />
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
