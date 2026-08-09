import { useEffect, useState } from "react";

import type { Deployment, DeploymentStatus } from "../../types/domain";
import { cn } from "../../lib/utils";

const STATUS_ICON: Record<DeploymentStatus, string> = {
  pending: "○",
  in_progress: "◐",
  complete: "✓",
  failed: "✕",
};

const STATUS_CLASS: Record<DeploymentStatus, string> = {
  pending: "text-muted-foreground",
  in_progress: "text-primary",
  complete: "text-safe",
  failed: "text-block",
};

const STATUS_LABEL: Record<DeploymentStatus, string> = {
  pending: "pending",
  in_progress: "running",
  complete: "pass",
  failed: "fail",
};

function formatElapsed(startedAt: string, endedAt?: string | null): string {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const seconds = Math.max(0, Math.floor((end - start) / 1000));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function ElapsedTimer({ startedAt, finishedAt }: { startedAt: string; finishedAt?: string | null }) {
  const [, tick] = useState(0);

  useEffect(() => {
    if (finishedAt) return;
    const interval = setInterval(() => tick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [finishedAt]);

  return <span>{formatElapsed(startedAt, finishedAt)}</span>;
}

export function DeploymentStepRow({ step, firstStartedAt }: { step: Deployment; firstStartedAt?: string | null }) {
  const elapsed = step.started_at ? (
    <ElapsedTimer startedAt={firstStartedAt ?? step.started_at} finishedAt={step.finished_at} />
  ) : null;

  return (
    <div className="grid gap-1">
      <div className="flex items-center gap-3">
        <span className={cn("font-mono text-lg leading-none", STATUS_CLASS[step.status])}>
          {STATUS_ICON[step.status]}
        </span>
        <span className="flex-1 text-sm leading-6">{step.step}</span>
        {elapsed ? (
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {elapsed}
          </span>
        ) : null}
        <span
          className={cn(
            "w-14 text-right font-mono text-xs font-medium",
            STATUS_CLASS[step.status],
          )}
        >
          {STATUS_LABEL[step.status]}
        </span>
      </div>
      {step.status === "failed" && step.reason ? (
        <p className="pl-8 text-sm leading-6 text-block">{step.reason}</p>
      ) : null}
    </div>
  );
}
