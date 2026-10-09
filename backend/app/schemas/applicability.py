from typing import Any, Literal

from pydantic import BaseModel, Field


class ApplicabilityCheck(BaseModel):
    name: str = Field(description="Identifier for the check, e.g. 'numeric_range', 'categorical_support'")
    status: Literal["passed", "warning", "limited", "unsupported", "available", "unavailable", "compatible", "potentially_mismatched"] = Field(
        description="Status of this individual applicability check"
    )
    message: str = Field(description="Clear, non-technical explanation of the check outcome")
    details: dict[str, Any] | None = Field(default=None, description="Detailed technical telemetry and stats")


class DatasetScopeInfo(BaseModel):
    dataset_name: str = Field(default="Ames Housing Dataset")
    dataset_source: str = Field(default="Dean De Cock (2011), Journal of Statistics Education / Ames City Assessor's Office")
    geographic_scope: str = Field(default="Ames, Iowa, United States (25 residential neighborhoods)")
    historical_period: str = Field(default="2006 – 2010 (Pre-2011 residential property transactions)")
    target_variable: str = Field(default="SalePrice (Nominal USD)")
    market_warning: str = Field(
        default="This model is trained strictly on historical residential sales in Ames, Iowa between 2006 and 2010. It cannot be used as an appraisal or reliable valuation for other geographic markets (such as Indian real estate or European housing markets) without domain retraining."
    )
    known_limitations: list[str] = Field(
        default_factory=lambda: [
            "Geographic specificity: Strictly calibrated for Ames, Iowa residential market.",
            "Temporal window: Reflects macroeconomic conditions between 2006 and 2010.",
            "Unmeasured physical defects: Cannot detect unrecorded structural or plumbing flaws.",
            "Non-statutory estimate: Statistical estimation with uncertainty intervals, not a certified appraisal.",
        ]
    )


class ModelApplicabilityResponse(BaseModel):
    status: Literal["passed", "limited", "warning", "unsupported"] = Field(
        description="Overall model applicability status"
    )
    overall_summary: str = Field(description="Concise summary for user decision support")
    checks: list[ApplicabilityCheck] = Field(description="Individual granular validation checks")
    limitations: list[str] = Field(description="Applicable model and dataset limitations")
    scope: DatasetScopeInfo = Field(default_factory=DatasetScopeInfo)
    actionable_guidance: str | None = Field(default=None, description="Actionable recommendation for the user")
