import Image from "next/image";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";

export function MenuExploreBand() {
  return (
    <section className="grid gap-10 px-6 py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-10 lg:py-28">
      <Reveal className="order-2 flex flex-col items-start gap-5 lg:order-1">
        <Eyebrow>04 — Full Menu</Eyebrow>
        <h2 className="font-display text-[40px] leading-[0.95] text-ink lg:text-[56px]">
          Fifteen kinds of craving, one menu
        </h2>
        <p className="max-w-md font-body text-lg text-ink/70">
          Chaat, tandoori, curries, biryani, breads, snacks, sweets — every dish we make, priced
          and ready to browse.
        </p>
        <Link
          href="/menu"
          className="font-body text-[17px] font-medium text-ink underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-ink"
        >
          Browse the full menu →
        </Link>
      </Reveal>
      <Reveal delay={0.1} className="order-1 lg:order-2">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-image bg-peach">
          <Image
            src="/images/heritage/thali-spread.jpg"
            alt="A spread of copper kadai bowls with rice and curries"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </Reveal>
    </section>
  );
}
