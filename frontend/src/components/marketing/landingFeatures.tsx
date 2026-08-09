import { PopItem, Reveal, StaggerGroup } from "./reveal";

const SIGNALS = [
  {
    key: "Status",
    title: "Every status code, matched exactly",
    body: "Not just 2xx vs. failure — the full code, on every step of the workflow, on both environments.",
    prod: "200",
    twin: "200",
    match: true,
  },
  {
    key: "Shape",
    title: "Field-by-field response comparison",
    body: "Renamed fields, dropped fields, changed types — the diff a health check can't see, because it never reads the body.",
    prod: '"discount": "12.00"',
    twin: '"discount": null',
    match: false,
  },
  {
    key: "Latency",
    title: "P50 / P95 deltas, not pass/fail timing",
    body: "A twin that works but answers three times slower is still a regression. Latency is scored, not just logged.",
    prod: "118ms",
    twin: "340ms",
    match: false,
  },
];

export function LandingFeatures() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <Reveal className="mx-auto max-w-xl text-center">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">What gets compared</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
          Evidence, not vibes.
        </h2>
      </Reveal>

      <StaggerGroup className="mt-14 divide-y divide-border overflow-hidden rounded-2xl border border-border">
        {SIGNALS.map((signal) => (
          <PopItem key={signal.key}>
            <div className="grid grid-cols-1 items-center gap-6 bg-card px-6 py-7 sm:grid-cols-[7rem_1fr_auto] sm:gap-8 sm:px-8">
              <span className="font-display text-lg font-bold tracking-tight text-primary sm:text-xl">
                {signal.key}
              </span>

              <div>
                <h3 className="font-display text-base font-semibold tracking-tight sm:text-lg">{signal.title}</h3>
                <p className="mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">{signal.body}</p>
              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-[11px]">
                <span className="text-muted-foreground">{signal.prod}</span>
                <span className="text-muted-foreground/50">&rarr;</span>
                <span className={signal.match ? "text-safe" : "font-semibold text-block"}>{signal.twin}</span>
              </div>
            </div>
          </PopItem>
        ))}
      </StaggerGroup>

      <Reveal delay={0.1}>
        <p className="mx-auto mt-8 max-w-lg text-center font-mono text-[11px] leading-5 text-muted-foreground">
          These three signals feed one fixed scoring engine. Same input, same verdict, every time &mdash; no model in
          the loop until it&rsquo;s time to explain the result.
        </p>
      </Reveal>
    </section>
  );
}
