import { PopItem, Reveal, StaggerGroup } from "./reveal";
import { TwinNetworkScene } from "./twinNetworkScene";

const STEPS = [
  {
    step: "01",
    label: "Define",
    title: "Write the workflow once",
    body: "The real request sequence your users run — create, fetch, update. Not a ping. deployClone replays it exactly, in order.",
  },
  {
    step: "02",
    label: "Run",
    title: "Deploy the twin, run it twice",
    body: "Zerops builds a live twin from the release commit. The workflow runs against it and against production, side by side.",
  },
  {
    step: "03",
    label: "Score",
    title: "Get a verdict, not a guess",
    body: "A fixed, auditable engine scores every diff — status, shape, latency — into SAFE, REVIEW, or BLOCK.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden border-t border-border py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 opacity-[0.16] dark:opacity-[0.22]"
      >
        <TwinNetworkScene />
      </div>

      <div className="mx-auto max-w-5xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            How it runs
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
            Three steps, every release.
          </h2>
        </Reveal>

        <StaggerGroup className="relative mt-16 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          <div
            aria-hidden
            className="absolute left-[16.5%] right-[16.5%] top-[13px] hidden border-t border-dashed border-border md:block"
          />
          {STEPS.map((item) => (
            <PopItem key={item.step} className="relative">
              <div className="flex items-baseline gap-2.5">
                <span className="relative z-10 bg-background pr-1 font-mono text-xs text-muted-foreground">
                  {item.step}
                </span>
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  {item.label}
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </PopItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
