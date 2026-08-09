import { useEffect, useState } from "react";

import { Check, X } from "lucide-react";
import { motion } from "motion/react";

type Phase = "comparing" | "resolved";

const STEPS = [
  { method: "POST", path: "/cart", prodStatus: 201, twinStatus: 201, match: true },
  { method: "POST", path: "/checkout", prodStatus: 200, twinStatus: 200, match: true },
  { method: "GET", path: "/orders/8841", prodStatus: 200, twinStatus: 200, match: true },
] as const;

const FIELD_DIFF = { key: '"discount"', prod: '"12.00"', twin: "null" };

const METHOD_CLASS: Record<string, string> = {
  POST: "text-primary",
  GET: "text-muted-foreground",
};

export function VerdictTranscript() {
  const [phase, setPhase] = useState<Phase>("comparing");
  const [skipMotion, setSkipMotion] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setSkipMotion(true);
      setPhase("resolved");
      return;
    }
    const timer = setTimeout(() => setPhase("resolved"), 1650);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/90 shadow-[0_60px_140px_-40px_hsl(var(--primary)/0.28)] backdrop-blur">
      {/* header */}
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Workflow &middot; checkout.replay
          </span>
        </div>
        <VerdictStamp phase={phase} skipMotion={skipMotion} />
      </div>

      {/* transcript */}
      <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
        <Column kind="production" host="checkout.deployclone.app" steps={STEPS} field={FIELD_DIFF} side="prod" />
        <Column kind="twin" host="candidate-8f2a1.twin.zerops.app" steps={STEPS} field={FIELD_DIFF} side="twin" />
      </div>

      {/* signal strip */}
      <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
        {[
          ["3/3", "Status codes match"],
          ["3/4", "Response fields match"],
          ["+142ms", "P95 latency delta"],
        ].map(([v, l]) => (
          <div key={l} className="px-3 py-3 text-center">
            <p className="font-display text-base font-bold tracking-tight">{v}</p>
            <p className="mt-0.5 text-[10px] uppercase leading-tight tracking-wide text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-border px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          LLM explains &mdash; it doesn&rsquo;t decide
        </p>
        <p className="mt-2 border-l-2 border-border pl-3 text-[13px] italic leading-6 text-muted-foreground">
          &ldquo;The twin&rsquo;s checkout response is missing the discount field production returns &mdash; the
          promo-header fallback likely wasn&rsquo;t ported. That&rsquo;s a customer-facing regression, not
          noise.&rdquo;
        </p>
      </div>
    </div>
  );
}

function Column({
  kind,
  host,
  steps,
  field,
  side,
}: {
  kind: "production" | "twin";
  host: string;
  steps: typeof STEPS;
  field: typeof FIELD_DIFF;
  side: "prod" | "twin";
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-2">
        <EnvDot kind={kind} />
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em]">{kind}</span>
      </div>
      <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{host}</p>

      <div className="mt-3.5 space-y-1.5">
        {steps.map((step) => (
          <div key={step.path} className="flex items-center gap-2 font-mono text-[12.5px] leading-6">
            <span className={`w-9 shrink-0 font-semibold ${METHOD_CLASS[step.method]}`}>{step.method}</span>
            <span className="truncate text-foreground/80">{step.path}</span>
            <span className="ml-auto flex shrink-0 items-center gap-1.5 text-muted-foreground">
              {side === "prod" ? step.prodStatus : step.twinStatus}
              {side === "twin" ? <Check className="h-3 w-3 text-safe" /> : null}
            </span>
          </div>
        ))}

        <div
          className={
            side === "twin"
              ? "-mx-2 mt-2 flex items-center gap-2 rounded-md bg-block/10 px-2 py-1.5 font-mono text-[12.5px] leading-6 ring-1 ring-inset ring-block/25"
              : "mt-2 flex items-center gap-2 font-mono text-[12.5px] leading-6"
          }
        >
          <span className="shrink-0 text-muted-foreground">{field.key}:</span>
          <span className={side === "twin" ? "truncate font-semibold text-block" : "truncate text-foreground/80"}>
            {side === "prod" ? field.prod : field.twin}
          </span>
          {side === "twin" ? <X className="ml-auto h-3 w-3 shrink-0 text-block" /> : null}
        </div>
      </div>
    </div>
  );
}

function EnvDot({ kind }: { kind: "production" | "twin" }) {
  if (kind === "production") {
    return <span className="inline-block h-2 w-2 shrink-0 rounded-[2.5px] bg-primary" />;
  }
  return <span className="inline-block h-2 w-2 shrink-0 rounded-[2.5px] border border-dashed border-primary/60" />;
}

function VerdictStamp({ phase, skipMotion }: { phase: Phase; skipMotion: boolean }) {
  if (phase === "comparing") {
    return (
      <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        comparing
        <span className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1 w-1 animate-pulse rounded-full bg-muted-foreground motion-reduce:animate-none"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </span>
      </span>
    );
  }

  const stampClass =
    "inline-flex items-center rounded-md border-2 border-block px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-block";

  if (skipMotion) {
    return <span className={`${stampClass} -rotate-2`}>Block</span>;
  }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 1.5, rotate: 0 }}
      animate={{ opacity: 1, scale: 1, rotate: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 15 }}
      className={stampClass}
    >
      Block
    </motion.span>
  );
}
