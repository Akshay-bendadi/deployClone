import { Card } from "../components/ui/card";

export function TestRunPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">Test Run</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Production vs. candidate workflow results land here (plan.txt &sect;32).
        </p>
      </div>
      <Card className="grid gap-2 p-6">
        <p className="text-sm font-medium text-muted-foreground">Coming soon</p>
        <p className="text-sm leading-6 text-muted-foreground">
          This screen will show workflow-by-workflow pass/fail for both environments.
        </p>
      </Card>
    </div>
  );
}
