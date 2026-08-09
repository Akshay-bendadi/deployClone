import type { ReactNode } from "react";

import { TwinGlyph } from "../twinGlyph";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex gap-3">
        <TwinGlyph className="mt-1.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          {eyebrow ? (
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-xl font-semibold tracking-[-0.02em]">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
