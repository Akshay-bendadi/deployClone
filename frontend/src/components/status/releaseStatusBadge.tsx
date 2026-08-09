import { CheckCircle2, CircleAlert, Loader2, OctagonX, XCircle } from "lucide-react";

import { releaseStatusClass } from "../../lib/status";
import type { ReleaseStatus } from "../../types/domain";
import { Badge } from "../ui/badge";

const STATUS_ICON: Record<ReleaseStatus, React.ReactNode> = {
  CREATED: null,
  DEPLOYING: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  READY: null,
  TESTING: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  SAFE: <CheckCircle2 className="h-3.5 w-3.5" />,
  REVIEW: <CircleAlert className="h-3.5 w-3.5" />,
  BLOCKED: <OctagonX className="h-3.5 w-3.5" />,
  FAILED: <XCircle className="h-3.5 w-3.5" />,
};

export function ReleaseStatusBadge({ status }: { status: ReleaseStatus }) {
  return (
    <Badge className={`flex items-center gap-1.5 ${releaseStatusClass(status)}`}>
      {STATUS_ICON[status]}
      {status}
    </Badge>
  );
}
