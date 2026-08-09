import { CheckCircle2, CircleAlert, OctagonX } from "lucide-react";

import { riskVerdictClass, riskVerdictLabel } from "../../lib/status";
import type { RiskVerdict } from "../../types/domain";
import { Badge } from "../ui/badge";

const VERDICT_ICON: Record<RiskVerdict, React.ReactNode> = {
  SAFE: <CheckCircle2 className="h-3.5 w-3.5" />,
  REVIEW: <CircleAlert className="h-3.5 w-3.5" />,
  HIGH_RISK: <OctagonX className="h-3.5 w-3.5" />,
  BLOCK: <OctagonX className="h-3.5 w-3.5" />,
};

export function RiskVerdictBadge({ verdict }: { verdict: RiskVerdict }) {
  return (
    <Badge className={`flex items-center gap-1.5 ${riskVerdictClass(verdict)}`}>
      {VERDICT_ICON[verdict]}
      {riskVerdictLabel(verdict)}
    </Badge>
  );
}
