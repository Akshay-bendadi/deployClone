import { ComparisonCard } from "../components/evidence/comparisonCard";
import { Card } from "../components/ui/card";
import { useComparisonsQuery } from "../hooks/queries/useComparisons";
import { useProjectContext } from "../hooks/useProjectContext";

export function EvidencePage() {
  const { latestRelease } = useProjectContext();
  const isActive = latestRelease.status === "DEPLOYING" || latestRelease.status === "TESTING";

  const comparisonsQuery = useComparisonsQuery(latestRelease.id, isActive);
  const withRegressions = (comparisonsQuery.data ?? []).filter((c) => c.regressions.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.02em]">Evidence</h2>
        <p className="mt-1 text-sm text-muted-foreground">Regression evidence per category.</p>
      </div>

      {comparisonsQuery.isSuccess && withRegressions.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            No regressions found yet &mdash; either the release hasn't been tested, or the{" "}
            {latestRelease.version} twin matched production on every check.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {withRegressions.map((comparison) => (
            <ComparisonCard key={comparison.id} comparison={comparison} />
          ))}
        </div>
      )}
    </div>
  );
}
