"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { PillButton } from "@/components/ui/PillButton";
import { NAV_LINKS, CRAVING_HREF } from "@/lib/navigation";
import { business } from "@/data/business";

export function MobileNavSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-ink/30 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        className={cn(
          "absolute right-0 top-0 flex h-full w-[82%] max-w-sm flex-col gap-8 bg-cream px-8 py-8 shadow-[0_0_40px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between">
          <span className="font-display text-2xl text-ink">Bombay Sweets</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-full border border-ink/30 p-2 text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M1 1L17 17M17 1L1 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="font-display text-3xl text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <PillButton href={CRAVING_HREF} variant="ghost" onClick={onClose} className="w-full">
            What&rsquo;s your craving?
          </PillButton>
          <PillButton href={business.phoneHref} variant="filled" className="w-full">
            Call to order
          </PillButton>
        </div>
      </div>
    </div>
  );
}
