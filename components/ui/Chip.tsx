import { cn } from "@/lib/utils/cn";

export function Chip({
  selected = false,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "rounded-pill border font-body text-sm px-5 py-3 min-h-11 transition-all duration-200 ease-out",
        selected
          ? "border-saffron bg-saffron text-cream"
          : "border-ink/30 bg-transparent text-ink hover:border-ink hover:-translate-y-0.5",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
