import { riskVerdictClass, riskVerdictLabel } from "../../lib/status";
import type { RiskVerdict } from "../../types/domain";
import { Badge } from "../ui/badge";

export function RiskVerdictBadge({ verdict }: { verdict: RiskVerdict }) {
  return <Badge className={riskVerdictClass(verdict)}>{riskVerdictLabel(verdict)}</Badge>;
}
