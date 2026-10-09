from typing import Any

from pydantic import BaseModel, Field

from .prediction import PredictionInterval, PropertyFeatures


class PropertyProfile(BaseModel):
    """Structured property profile summary derived from user features."""
    living_area_sqft: float
    total_basement_sqft: float
    bedrooms: int
    full_bathrooms: int
    half_bathrooms: int
    year_built: int
    year_remodeled: int
    overall_quality: int
    overall_condition: int
    neighborhood: str
    garage_cars: int
    summary_text: str
    feature_chips: list[str]


class InputQualityAssessment(BaseModel):
    """Input quality evaluation checking physical ranges, training bounds, and unusual combinations."""
    status: str = Field(description="'Excellent', 'Good', or 'Limited'")
    score_label: str
    is_out_of_distribution: bool
    warnings: list[str] = Field(default_factory=list)
    passed_checks: list[str] = Field(default_factory=list)
    recommendation: str | None = None


class ModelPredictionSummary(BaseModel):
    model_name: str
    predicted_price: float
    lower_bound: float | None = None
    upper_bound: float | None = None


class ModelConsensus(BaseModel):
    """Consensus across multiple regression models."""
    models: list[ModelPredictionSummary]
    mean_estimate: float
    median_estimate: float
    min_estimate: float
    max_estimate: float
    spread_amount: float
    spread_percentage: float
    agreement_level: str = Field(description="'High Agreement', 'Moderate Agreement', or 'Model Disagreement'")
    disagreement_warning: str | None = None


class ReliabilityDimension(BaseModel):
    dimension: str
    status: str = Field(description="'Available', 'Limited', or 'Unavailable'")
    detail: str


class EstimateReliabilityAssessment(BaseModel):
    """Comprehensive estimate reliability based on transparent empirical evidence."""
    overall_reliability: str = Field(description="'High', 'Medium', or 'Limited'")
    summary: str
    dimensions: list[ReliabilityDimension]
    consensus: ModelConsensus | None = None


class SimilarPropertyComparable(BaseModel):
    """Actual historical property from the Ames housing dataset."""
    id: int
    record_id: str = ""
    similarity_rank: int = 1
    sale_price: float
    gr_liv_area: float
    bedrooms: int
    full_bath: int
    overall_qual: int
    year_built: int
    neighborhood: str
    price_per_sqft: float
    similarity_pct: float
    distance: float
    key_match_attributes: list[str] = Field(default_factory=list)
    why_selected: str = ""
    similarity_features: dict[str, Any] = Field(default_factory=dict)
    dataset_source: str = "Ames Housing Dataset (2006-2010)"


class ComparableInsights(BaseModel):
    """Insights comparing the model estimate against actual historical dataset records."""
    comparables: list[SimilarPropertyComparable]
    comparable_count: int
    comparable_median_price: float
    comparable_mean_price: float
    comparable_min_price: float
    comparable_max_price: float
    user_implied_price_per_sqft: float
    comparable_median_price_per_sqft: float
    positioning_summary: str
    historical_disclaimer: str = (
        "Comparable properties shown here are historical records from the Ames Housing dataset "
        "(2006–2010) and do not represent live market listings or current real-time prices."
    )


class AffordabilityRequest(BaseModel):
    budget: float = Field(default=250000.0, ge=10000.0, description="Target total property budget")
    estimated_price: float = Field(default=245000.0, ge=10000.0, description="Model estimated property price")
    down_payment: float = Field(default=50000.0, ge=0.0, description="Down payment amount in dollars")
    interest_rate_pct: float = Field(default=6.5, ge=0.0, le=25.0, description="Annual mortgage interest rate %")
    loan_term_years: int = Field(default=30, ge=5, le=40, description="Loan term in years (15, 20, 30)")
    monthly_property_tax: float = Field(default=250.0, ge=0.0, description="Estimated monthly property tax")
    monthly_home_insurance: float = Field(default=100.0, ge=0.0, description="Estimated monthly insurance")


class AffordabilityCalculation(BaseModel):
    """Illustrative mathematical mortgage and budget calculation."""
    scenario_label: str | None = "Standard Scenario"
    budget: float
    estimated_price: float
    down_payment: float
    down_payment_pct: float
    loan_amount: float
    interest_rate_pct: float
    loan_term_years: int
    monthly_principal_interest: float
    monthly_taxes_insurance: float
    total_monthly_payment: float
    total_interest_paid: float
    total_cost_of_loan: float
    upfront_cash_needed: float
    is_within_budget: bool
    budget_delta: float
    status_label: str
    disclaimer: str = (
        "Illustrative payment calculation based on standard mathematical amortization formulas. "
        "Payment calculations are illustrative and depend on the inputs you provide. "
        "They are not financial advice or mortgage pre-approvals."
    )


class MultiBudgetComparisonRequest(BaseModel):
    estimated_price: float = Field(default=245000.0, ge=10000.0)
    scenarios: list[AffordabilityRequest]


class ImprovementScenario(BaseModel):
    scenario_id: str
    name: str
    description: str
    modified_features: PropertyFeatures
    potential_estimate: float
    potential_interval: PredictionInterval | None = None
    modeled_difference: float
    top_driver: str
    user_renovation_cost: float | None = None
    net_modeled_scenario_difference: float | None = None


class ImprovementSimulationResponse(BaseModel):
    current_estimate: float
    scenarios: list[ImprovementScenario]
    disclaimer: str = (
        "Model-estimated change based on statistical relationships in the historical training data. "
        "Not a guaranteed renovation return or contractor estimate."
    )


class SavedScenarioCreate(BaseModel):
    name: str
    description: str | None = None
    features: PropertyFeatures
    predicted_price: float
    lower_bound: float | None = None
    upper_bound: float | None = None
    model_name: str = "CatBoost"
    model_version: str = "v1.0.0"


class SavedScenarioUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    features: PropertyFeatures | None = None
    predicted_price: float | None = None
    lower_bound: float | None = None
    upper_bound: float | None = None
    model_name: str | None = None
    model_version: str | None = None


class SavedScenarioResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    features: dict[str, Any]
    predicted_price: float
    lower_bound: float | None = None
    upper_bound: float | None = None
    model_name: str
    model_version: str = "v1.0.0"
    created_at: str


class PropertyProfileCreate(BaseModel):
    name: str
    description: str | None = None
    features: PropertyFeatures
    estimated_price: float
    lower_bound: float
    upper_bound: float
    model_name: str = "Voting Ensemble"
    model_version: str = "v1.0.0"


class PropertyProfileResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    features: dict[str, Any]
    estimated_price: float
    lower_bound: float
    upper_bound: float
    model_name: str
    model_version: str
    created_at: str
    updated_at: str | None = None


class PropertyProfileComparisonItem(BaseModel):
    profile_id: int
    name: str
    estimated_price: float
    lower_bound: float
    upper_bound: float
    living_area: float
    bedrooms: int
    full_bath: int
    overall_qual: int
    year_built: int
    neighborhood: str
    price_per_sqft: float
    top_contributors: list[str] = Field(default_factory=list)


class PropertyProfileComparisonResponse(BaseModel):
    profiles: list[PropertyProfileComparisonItem]
    count: int

