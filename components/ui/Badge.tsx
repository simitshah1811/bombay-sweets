import { cn } from "@/lib/utils/cn";
import type { PreparationStatus } from "@/lib/generated/prisma/client";
import { formatPrepLabel } from "@/lib/menu/prepStatus";

const dotTone = {
  veg: "bg-green",
  nonveg: "bg-maroon",
} as const;

const dotBorder = {
  veg: "border-green",
  nonveg: "border-maroon",
} as const;

// A square outline with a filled center dot -- the standard veg/non-veg
// symbol used on Indian menus. Deliberately square (not round) so it can't
// be mistaken for the round prep-time dot in PrepBadge below, which sits
// just underneath it on the same menu row.
export function DietDot({ tone, className }: { tone: keyof typeof dotTone; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border-[1.5px]",
        dotBorder[tone],
        className
      )}
      aria-hidden
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotTone[tone])} />
    </span>
  );
}

// Reuses the site's existing accent tokens rather than introducing a new
// "yellow" color -- saffron already carries the palette's warm/in-progress
// meaning (see OrderStatusTimeline's "current step" dot), green and maroon
// already carry "good"/"attention" meaning elsewhere on the site.
const prepDotTone: Record<PreparationStatus, string> = {
  GREEN: "bg-green",
  YELLOW: "bg-saffron",
  RED: "bg-maroon",
};

/**
 * Customer-facing prep-time indicator: a colored dot plus text, always
 * together -- never color alone (see formatPrepLabel). Read-only by
 * construction; nothing in this component can write back to the database.
 */
export function PrepBadge({
  status,
  minutes,
  className,
}: {
  status: PreparationStatus;
  minutes: number | null;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-label text-[11px] text-ink/60", className)}>
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", prepDotTone[status])} aria-hidden />
      {formatPrepLabel(status, minutes)}
    </span>
  );
}

export function SpiceMarks({ level, className }: { level: 0 | 1 | 2 | 3; className?: string }) {
  if (level === 0) return null;
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`Spice level ${level} of 3`}>
      {Array.from({ length: 3 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            i < level ? "bg-maroon" : "bg-ink/15"
          )}
        />
      ))}
    </span>
  );
}
