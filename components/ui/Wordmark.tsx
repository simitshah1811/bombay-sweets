import { cn } from "@/lib/utils/cn";

export function Wordmark({
  tone = "ink",
  size = "default",
  className,
}: {
  tone?: "ink" | "cream";
  size?: "default" | "large";
  className?: string;
}) {
  return (
    <span className={cn("flex flex-col leading-[0.85]", className)}>
      <span
        className={cn(
          "font-display",
          size === "large" ? "text-[40px] lg:text-[56px]" : "text-[26px] lg:text-[30px]",
          tone === "ink" ? "text-ink" : "text-cream"
        )}
      >
        Bombay
      </span>
      <span
        className={cn(
          "font-label font-medium uppercase",
          size === "large" ? "mt-1 text-sm tracking-[0.4em]" : "text-[10px] tracking-[0.35em] lg:text-[11px]",
          "text-saffron"
        )}
      >
        Sweets
      </span>
    </span>
  );
}
