import { releaseStatusClass } from "../../lib/status";
import type { ReleaseStatus } from "../../types/domain";
import { Badge } from "../ui/badge";

export function ReleaseStatusBadge({ status }: { status: ReleaseStatus }) {
  return <Badge className={releaseStatusClass(status)}>{status}</Badge>;
}
