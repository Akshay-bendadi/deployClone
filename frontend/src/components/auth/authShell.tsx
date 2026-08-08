import type { ReactNode } from "react";

import { TwinDiffPreview } from "../marketing/twinDiffPreview";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-12 py-6 lg:grid-cols-2 lg:items-center lg:py-12">
      <div className="hidden space-y-6 lg:block">
        <h1 className="text-4xl leading-[1.1] tracking-[-0.03em]">
          Test releases before they reach production.
        </h1>
        <p className="max-w-md text-base leading-7 text-muted-foreground">
          deployClone deploys a twin of your release and runs your real workflows against it and
          production &mdash; then gives you a verdict backed by evidence, not a guess.
        </p>
        <TwinDiffPreview />
      </div>
      <div className="mx-auto w-full max-w-sm">{children}</div>
    </div>
  );
}
