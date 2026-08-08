import { Card } from "../components/ui/card";

export function EvidencePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">Evidence</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Regression evidence per category (API contract, performance, worker) lands here (plan.txt
          &sect;33).
        </p>
      </div>
      <Card className="grid gap-2 p-6">
        <p className="text-sm font-medium text-muted-foreground">Coming soon</p>
        <p className="text-sm leading-6 text-muted-foreground">
          This screen will show side-by-side production vs. candidate evidence for each regression.
        </p>
      </Card>
    </div>
  );
}
