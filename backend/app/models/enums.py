import enum


class ReleaseStatus(str, enum.Enum):
    CREATED = "CREATED"
    DEPLOYING = "DEPLOYING"
    READY = "READY"
    TESTING = "TESTING"
    SAFE = "SAFE"
    REVIEW = "REVIEW"
    BLOCKED = "BLOCKED"
    FAILED = "FAILED"


class EnvironmentKind(str, enum.Enum):
    PRODUCTION = "production"
    CANDIDATE = "candidate"


class DeploymentStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETE = "complete"
    FAILED = "failed"


class TestRunStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"


class ComparisonCategory(str, enum.Enum):
    FUNCTIONAL = "functional"
    PERFORMANCE = "performance"
    WORKER = "worker"


class RegressionSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RiskVerdict(str, enum.Enum):
    SAFE = "SAFE"
    REVIEW = "REVIEW"
    HIGH_RISK = "HIGH_RISK"
    BLOCK = "BLOCK"
