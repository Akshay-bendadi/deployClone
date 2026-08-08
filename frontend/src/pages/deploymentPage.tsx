import { Card } from "../components/ui/card";

export function DeploymentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">Candidate Deployment</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Live candidate environment creation steps land here (plan.txt &sect;31).
        </p>
      </div>
      <Card className="grid gap-2 p-6">
        <p className="text-sm font-medium text-muted-foreground">Coming soon</p>
        <p className="text-sm leading-6 text-muted-foreground">
          This screen will stream real deployment step statuses from the worker.
        </p>
      </Card>
    </div>
  );
}
