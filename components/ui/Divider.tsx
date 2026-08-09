import { cn } from "@/lib/utils/cn";

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-t border-ink/12", className)} />;
}
