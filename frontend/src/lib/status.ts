import type { ReleaseStatus, RiskVerdict } from "../types/domain";

export function riskVerdictClass(verdict: RiskVerdict): string {
  switch (verdict) {
    case "SAFE":
      return "bg-safe text-safe-foreground";
    case "REVIEW":
      return "bg-review text-review-foreground";
    case "HIGH_RISK":
    case "BLOCK":
      return "bg-block text-block-foreground";
  }
}

export function riskVerdictLabel(verdict: RiskVerdict): string {
  switch (verdict) {
    case "SAFE":
      return "SAFE TO SHIP";
    case "REVIEW":
      return "REVIEW";
    case "HIGH_RISK":
      return "HIGH RISK";
    case "BLOCK":
      return "BLOCKED";
  }
}

export function releaseStatusClass(status: ReleaseStatus): string {
  switch (status) {
    case "SAFE":
      return "bg-safe text-safe-foreground";
    case "REVIEW":
      return "bg-review text-review-foreground";
    case "BLOCKED":
    case "FAILED":
      return "bg-block text-block-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}
