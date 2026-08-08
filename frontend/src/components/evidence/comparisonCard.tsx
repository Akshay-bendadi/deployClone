import type { Comparison } from "../../types/domain";
import { RegressionSeverityBadge } from "../status/regressionSeverityBadge";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";

const CATEGORY_LABEL: Record<string, string> = {
  functional: "API Contract",
  performance: "Performance",
  worker: "Worker",
};

export function ComparisonCard({ comparison }: { comparison: Comparison }) {
  return (
    <Card className="grid gap-4 p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {CATEGORY_LABEL[comparison.category] ?? comparison.category}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Production
          </p>
          <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs leading-5">
            {JSON.stringify(comparison.production_value, null, 2)}
          </pre>
        </div>
        <div className="grid gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Twin
          </p>
          <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs leading-5">
            {JSON.stringify(comparison.candidate_value, null, 2)}
          </pre>
        </div>
      </div>

      <Separator />

      <div className="grid gap-2">
        {comparison.regressions.map((regression) => (
          <div key={regression.id} className="flex items-center gap-3">
            <RegressionSeverityBadge severity={regression.severity} />
            <p className="text-sm leading-6">{regression.summary}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
