import type { TestRun, Workflow } from "../../types/domain";
import { TestRunStatusBadge } from "../status/testRunStatusBadge";
import { Card } from "../ui/card";

function ResultCell({ testRun, label }: { testRun: TestRun | undefined; label: string }) {
  return (
    <div className="grid gap-1">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      {testRun ? (
        <TestRunStatusBadge status={testRun.status} />
      ) : (
        <span className="text-sm text-muted-foreground">&mdash;</span>
      )}
    </div>
  );
}

export function WorkflowResultRow({
  workflow,
  productionRun,
  candidateRun,
}: {
  workflow: Workflow;
  productionRun: TestRun | undefined;
  candidateRun: TestRun | undefined;
}) {
  return (
    <Card className="grid grid-cols-[1fr_auto_auto] items-center gap-6 p-5">
      <p className="text-sm font-semibold">{workflow.name}</p>
      <ResultCell testRun={productionRun} label="Production" />
      <ResultCell testRun={candidateRun} label="Twin" />
    </Card>
  );
}
