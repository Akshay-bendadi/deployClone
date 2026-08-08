import type { TestRunStatus } from "../../types/domain";
import { Badge } from "../ui/badge";

const STATUS_CLASS: Record<TestRunStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  running: "bg-primary/10 text-primary",
  passed: "bg-safe text-safe-foreground",
  failed: "bg-block text-block-foreground",
};

export function TestRunStatusBadge({ status }: { status: TestRunStatus }) {
  return <Badge className={STATUS_CLASS[status]}>{status}</Badge>;
}
