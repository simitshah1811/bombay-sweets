"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { PillButton } from "@/components/ui/PillButton";
import { NAV_LINKS, CRAVING_HREF } from "@/lib/navigation";
import { MobileNavSheet } from "@/components/layout/MobileNavSheet";
import { Wordmark } from "@/components/ui/Wordmark";
import { CartButton } from "@/components/cart/CartButton";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled ? "bg-cream/90 backdrop-blur-md shadow-[0_1px_0_rgba(59,42,29,0.1)]" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-6 py-5 lg:px-10">
        <Link href="/" className="shrink-0">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-[15px] text-ink/80 transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <PillButton href={CRAVING_HREF} variant="ghost">
            What&rsquo;s your craving?
          </PillButton>
          <CartButton />
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="flex min-h-11 items-center gap-2 rounded-pill border border-ink/30 px-4 py-3 lg:hidden"
        >
          <span className="font-body text-sm text-ink">Menu</span>
        </button>
      </div>

      <MobileNavSheet open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
