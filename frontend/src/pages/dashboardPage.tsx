import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">Dashboard</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Project status, production vs. candidate version, and risk score land here (plan.txt
            &sect;30).
          </p>
        </div>
        <Button disabled>Test Release</Button>
      </div>
      <Card className="grid gap-2 p-6">
        <p className="text-sm font-medium text-muted-foreground">Coming soon</p>
        <p className="text-sm leading-6 text-muted-foreground">
          This screen will render live project data once the ReleaseTwin API is wired up.
        </p>
      </Card>
    </div>
  );
}
