import { Navigate, useNavigate } from "react-router-dom";

import { TwinDiffPreview } from "../components/marketing/twinDiffPreview";
import { Button } from "../components/ui/button";
import { useAuth } from "../lib/auth";

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (isAuthenticated) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-12 py-12 text-center">
      <div className="space-y-6">
        <h1 className="text-5xl leading-[1.05] tracking-[-0.03em] sm:text-6xl">
          A green deployment
          <br />
          doesn&rsquo;t mean a safe release.
        </h1>
        <p className="mx-auto max-w-xl text-lg leading-8 text-muted-foreground">
          deployClone deploys a twin of your release, runs your real workflows against
          production and the twin, and tells you whether it&rsquo;s safe to ship &mdash; before
          your users find out it isn&rsquo;t.
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={() => navigate("/signup")}>Get started</Button>
          <Button variant="outline" onClick={() => navigate("/login")}>
            Sign in
          </Button>
        </div>
      </div>

      <div className="space-y-3 text-left">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          The kind of regression a passing health check misses
        </p>
        <TwinDiffPreview />
      </div>
    </div>
  );
}
