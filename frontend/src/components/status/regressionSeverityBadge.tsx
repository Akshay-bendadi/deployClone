import type { RegressionSeverity } from "../../types/domain";
import { Badge } from "../ui/badge";

const SEVERITY_CLASS: Record<RegressionSeverity, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-review text-review-foreground",
  HIGH: "bg-block/70 text-block-foreground",
  CRITICAL: "bg-block text-block-foreground",
};

export function RegressionSeverityBadge({ severity }: { severity: RegressionSeverity }) {
  return <Badge className={SEVERITY_CLASS[severity]}>{severity}</Badge>;
}
