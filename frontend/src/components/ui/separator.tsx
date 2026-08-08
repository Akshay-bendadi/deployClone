import type { HTMLAttributes } from "react";

import { cn } from "../../lib/utils";

type SeparatorProps = HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
};

export function Separator({ className, orientation = "horizontal", ...props }: SeparatorProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        orientation === "vertical" ? "h-full w-px" : "h-px w-full",
        "shrink-0 bg-border",
        className,
      )}
      {...props}
    />
  );
}
