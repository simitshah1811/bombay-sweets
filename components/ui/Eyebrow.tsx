import { cn } from "@/lib/utils/cn";

export function Eyebrow({
  children,
  className,
  tone = "ink",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "ink" | "cream";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 font-label text-xs font-medium uppercase tracking-[0.2em]",
        tone === "ink" ? "text-ink/70" : "text-cream/80",
        className
      )}
    >
      <span className={cn("h-px w-6", tone === "ink" ? "bg-ink/40" : "bg-cream/50")} />
      {children}
    </div>
  );
}
