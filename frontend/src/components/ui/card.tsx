import type { HTMLAttributes } from "react";

import { cn } from "../../lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-card/90 p-6 shadow-2xl backdrop-blur",
        className,
      )}
      {...props}
    >
      {props.children}
    </div>
  );
}
