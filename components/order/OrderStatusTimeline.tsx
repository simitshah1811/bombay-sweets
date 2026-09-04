import { cn } from "@/lib/utils/cn";

const STEPS = [
  { index: 0, label: "Order placed" },
  { index: 1, label: "Payment confirmed" },
  { index: 2, label: "Restaurant accepted" },
  { index: 3, label: "Preparing" },
  { index: 4, label: "Ready for pickup" },
  { index: 5, label: "Completed" },
] as const;

/**
 * Purely a rendering of the order's REAL current progressIndex (derived
 * from Order.status by the caller) -- never a time-based or simulated
 * animation. A step is only ever shown as done because the database says
 * the order actually reached it.
 */
export function OrderStatusTimeline({ progressIndex }: { progressIndex: number }) {
  return (
    <ol className="flex flex-col gap-0">
      {STEPS.map((step, i) => {
        const done = progressIndex > step.index;
        const current = progressIndex === step.index;
        const isLast = i === STEPS.length - 1;
        return (
          <li key={step.index} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-label text-xs",
                  done ? "bg-green text-cream" : current ? "bg-saffron text-cream" : "border border-ink/20 text-ink/30"
                )}
                aria-hidden
              >
                {done ? "✓" : current ? "●" : "○"}
              </span>
              {!isLast && <span className={cn("w-px flex-1 min-h-6", done ? "bg-green" : "bg-ink/15")} />}
            </div>
            <span
              className={cn(
                "pb-6 font-body text-sm",
                done ? "text-ink" : current ? "font-medium text-ink" : "text-ink/40"
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
