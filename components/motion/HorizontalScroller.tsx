"use client";

import { useRef, useState } from "react";

export function HorizontalScroller({
  children,
  count,
  className,
}: {
  children: React.ReactNode;
  count: number;
  className?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const progress = maxScroll > 0 ? el.scrollLeft / maxScroll : 0;
    setIndex(Math.round(progress * (count - 1)));
  }

  function scrollByCard(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <div className={className}>
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-6 pb-4 lg:px-10 [scrollbar-width:none]"
      >
        {children}
      </div>
      <div className="mt-6 flex items-center justify-between px-6 lg:px-10">
        <span className="font-label text-xs tracking-[0.15em] text-ink/50">
          {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            aria-label="Scroll left"
            className="rounded-control border border-ink/25 px-3 py-2 text-ink transition-colors hover:border-ink"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            aria-label="Scroll right"
            className="rounded-control border border-ink/25 px-3 py-2 text-ink transition-colors hover:border-ink"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
