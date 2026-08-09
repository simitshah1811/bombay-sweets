import { cn } from "@/lib/utils/cn";

const dotTone = {
  veg: "bg-green",
  nonveg: "bg-maroon",
} as const;

export function DietDot({ tone, className }: { tone: keyof typeof dotTone; className?: string }) {
  return (
    <span
      className={cn("inline-block h-2 w-2 rounded-full border border-ink/40", dotTone[tone], className)}
      aria-hidden
    />
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
