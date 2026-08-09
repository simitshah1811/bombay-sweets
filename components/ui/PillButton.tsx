import Link from "next/link";
import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/utils/cn";

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill font-body font-medium text-[15px] leading-none px-6 py-3.5 transition-colors duration-200 whitespace-nowrap";

const variants = {
  filled: "bg-saffron text-cream hover:bg-ink",
  ghost: "border border-ink/70 text-ink bg-transparent hover:bg-ink hover:text-cream",
  ghostOnDark: "border border-cream/70 text-cream bg-transparent hover:bg-cream hover:text-ink",
} as const;

type Variant = keyof typeof variants;

type PillButtonProps<T extends ElementType> = {
  as?: T;
  variant?: Variant;
  href?: string;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

export function PillButton<T extends ElementType = "button">({
  as,
  variant = "filled",
  href,
  className,
  children,
  ...props
}: PillButtonProps<T>) {
  const classes = cn(base, variants[variant], className);

  if (href) {
    const isExternal = /^https?:\/\//.test(href) || href.startsWith("tel:") || href.startsWith("mailto:");
    if (isExternal) {
      return (
        <a href={href} className={classes} {...props}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  const Component = as ?? "button";
  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}
