from typing import Any, Literal

from pydantic import BaseModel, Field


class ReleaseValidationCriterion(BaseModel):
    criterion_name: str
    description: str
    status: Literal["passed", "failed", "warning"]
    threshold: str
    observed_value: Any
    message: str


class ModelCandidateSummary(BaseModel):
    name: str
    version: str
    stage: str  # "Production", "Validation", "Archived", "Rejected"
    cv_metrics: dict[str, Any]
    test_metrics: dict[str, Any]
    artifact_path: str
    parameters: dict[str, Any] = Field(default_factory=dict)
    description: str = ""
    registered_at: str
    is_production: bool = False
    is_candidate: bool = False


class ModelValidationResult(BaseModel):
    candidate_name: str
    candidate_version: str
    is_promotable: bool
    summary: str
    criteria: list[ReleaseValidationCriterion]
    latency_ms: float
    preprocessing_compatible: bool
    interval_coverage: float | None = None
    mean_interval_width: float | None = None
    evaluated_at: str


class ModelComparisonMetricRow(BaseModel):
    metric: str
    label: str
    current_value: Any
    candidate_value: Any
    difference: float | None = None
    improvement: bool | None = None
    unit: str = ""


class ModelComparisonResult(BaseModel):
    current_model: str
    current_version: str
    candidate_model: str
    candidate_version: str
    comparison_rows: list[ModelComparisonMetricRow]
    overall_recommendation: str
    better_model: str


class PromotionRequest(BaseModel):
    candidate_name: str
    approver: str = Field(default="Authorized Lead Data Scientist", min_length=2)
    notes: str | None = Field(default="Model verified against validation criteria and approved for production release.")


class CancelCandidateRequest(BaseModel):
    candidate_name: str
    reason: str | None = Field(default="Validation thresholds or qualitative criteria not met.")


class RollbackRequest(BaseModel):
    approver: str = Field(default="Authorized Lead Data Scientist", min_length=2)
    notes: str | None = Field(default="Emergency or planned rollback to previously verified production model.")


class ModelReleaseHistoryItem(BaseModel):
    id: int
    timestamp: str
    model_name: str
    model_version: str
    action: str
    previous_model: str | None = None
    previous_version: str | None = None
    approver: str
    notes: str | None = None
    validation_metrics: dict[str, Any] = Field(default_factory=dict)


class ModelReleaseStatusResponse(BaseModel):
    current_production_model: ModelCandidateSummary
    candidates: list[ModelCandidateSummary]
    baseline_model: ModelCandidateSummary | None = None
    dataset_version: str = "Ames Housing v1.0 (1,460 rows, 81 attributes)"
    training_run_id: str | None = None
    promotion_criteria: list[str]
    can_rollback: bool
    rollback_target: str | None = None
    recent_releases: list[ModelReleaseHistoryItem]
