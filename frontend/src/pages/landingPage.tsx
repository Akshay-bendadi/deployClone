import { ArrowRight } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";

import { HowItWorks } from "../components/marketing/howItWorks";
import { LandingBackground } from "../components/marketing/landingBackground";
import { LandingFeatures } from "../components/marketing/landingFeatures";
import { Reveal } from "../components/marketing/reveal";
import { VerdictTranscript } from "../components/marketing/verdictTranscript";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { useAuth } from "../lib/auth";

const STATS = [
  { value: "0", label: "Mocked responses — every diff is a real call" },
  { value: "3", label: "Signals scored: status, shape, latency" },
  { value: "100%", label: "Deterministic — no model in the scoring path" },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-3xl gap-4 py-24">
        <Skeleton className="mx-auto h-12 w-2/3" />
        <Skeleton className="mx-auto h-6 w-1/2" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="relative">
      <section className="relative overflow-hidden">
        <LandingBackground />

        <div className="mx-auto max-w-3xl px-6 pb-8 pt-10 text-center sm:pt-16">
          <Reveal immediate>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-safe motion-reduce:animate-none" />
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Real Zerops deploys &middot; real workflows &middot; zero mocks
              </span>
            </div>
          </Reveal>

          <Reveal immediate delay={0.08}>
            <h1 className="mt-7 text-[clamp(2.5rem,5.4vw,3.75rem)] font-semibold leading-[1.04] tracking-[-0.03em]">
              A green deployment
              <br />
              doesn&rsquo;t mean a <span className="text-primary">safe release</span>.
            </h1>
          </Reveal>

          <Reveal immediate delay={0.16}>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              deployClone stands a twin of your release commit next to production, replays your real
              request workflows against both, and turns the diff into a verdict &mdash; before your
              users find the regression for you.
            </p>
          </Reveal>

          <Reveal immediate delay={0.24}>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" className="gap-2 h-11 px-6" onClick={() => navigate("/signup")}>
                Get started
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 px-6"
                onClick={() => navigate("/login")}
              >
                Sign in
              </Button>
            </div>
          </Reveal>

          <Reveal immediate delay={0.32}>
            <dl className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-4 border-t border-border pt-8 sm:grid-cols-3">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <dt className="font-display text-2xl font-bold tracking-tight">{stat.value}</dt>
                  <dd className="mx-auto mt-1 max-w-[14rem] text-[11px] leading-4 text-muted-foreground sm:max-w-none">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal immediate delay={0.42} className="mx-auto max-w-3xl px-6 pb-20 pt-14 sm:pb-28">
          <VerdictTranscript />
        </Reveal>
      </section>

      <HowItWorks />

      <LandingFeatures />

      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <Reveal>
            <div className="mx-auto mb-7 inline-flex -rotate-2 items-center rounded-md border-2 border-dashed border-muted-foreground/30 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Verdict: pending
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
              Test the release, not just the deploy.
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="mt-6 flex justify-center gap-3">
              <Button size="lg" className="gap-2 h-11 px-6" onClick={() => navigate("/signup")}>
                Get started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
