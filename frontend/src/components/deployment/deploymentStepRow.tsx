import type { Deployment, DeploymentStatus } from "../../types/domain";

const STEP_ICON: Record<DeploymentStatus, string> = {
  pending: "○",
  in_progress: "◐",
  complete: "✓",
  failed: "✕",
};

const STEP_CLASS: Record<DeploymentStatus, string> = {
  pending: "text-muted-foreground",
  in_progress: "text-primary",
  complete: "text-safe",
  failed: "text-block",
};

export function DeploymentStepRow({ step }: { step: Deployment }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`font-mono text-lg ${STEP_CLASS[step.status]}`}>
        {STEP_ICON[step.status]}
      </span>
      <span className="text-sm leading-6">{step.step}</span>
    </div>
  );
}
