import type { HTMLAttributes } from "react";

import { cn } from "../../lib/utils";

type BadgeProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "outline";
};

const variants = {
  default: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  outline: "border-border text-foreground",
} as const;

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] transition-colors",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
