from typing import Dict, Any, List, Optional, Literal
from pydantic import BaseModel, Field
from .prediction import PropertyFeatures, PredictionInterval


class FeatureConstraint(BaseModel):
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    allowed_values: Optional[List[Any]] = None


class TargetPriceRequest(BaseModel):
    target_price: float = Field(..., gt=10000, le=2000000, description="Target model price estimate in USD")
    starting_features: PropertyFeatures = Field(description="Starting baseline property profile")
    changeable_features: Optional[List[str]] = Field(
        default=None,
        description="List of feature keys permitted to vary during search (e.g. GrLivArea, OverallQual, BedroomAbvGr, FullBath, GarageCars, Neighborhood)"
    )
    feature_constraints: Optional[Dict[str, FeatureConstraint]] = Field(
        default=None,
        description="Optional explicit bounds or allowed values for specific features"
    )
    objective: Literal["closest_target", "smallest_feature_changes", "balanced"] = Field(
        default="balanced",
        description="Search objective: 'closest_target', 'smallest_feature_changes', or 'balanced'"
    )
    max_scenarios: int = Field(default=5, ge=1, le=10, description="Maximum number of candidate scenarios to return")


class ChangedFeatureItem(BaseModel):
    feature: str = Field(description="Feature identifier, e.g. GrLivArea")
    feature_label: str = Field(description="Human-readable feature label, e.g. Above-Grade Living Area")
    original_value: Any = Field(description="Value in starting property profile")
    new_value: Any = Field(description="Optimized value in this candidate scenario")
    delta: Optional[float] = Field(default=None, description="Numerical difference (new - original)")
    unit: str = Field(default="", description="Unit of measurement (sq ft, rooms, etc.)")


class TargetPriceScenario(BaseModel):
    id: str = Field(description="Unique scenario identifier")
    name: str = Field(description="Descriptive scenario headline")
    features: PropertyFeatures = Field(description="Complete property features producing this estimate")
    predicted_price: float = Field(description="Actual model estimate produced by inference pipeline")
    prediction_interval: Optional[PredictionInterval] = Field(default=None, description="Conformal prediction interval if available")
    difference_from_target: float = Field(description="predicted_price - target_price")
    absolute_difference: float = Field(description="abs(difference_from_target)")
    percentage_difference: float = Field(description="Relative percent delta from target")
    changed_features: List[ChangedFeatureItem] = Field(description="Granular list of features altered from starting baseline")
    changed_count: int = Field(description="Number of changed features")
    model_name: str = Field(description="Active model used for evaluation")
    model_version: str = Field(description="Model registry version")
    objective_score: float = Field(description="Objective optimization score (lower is better)")
    applicability_warnings: List[str] = Field(default_factory=list, description="Any applicability or distribution flags")


class TargetPriceResponse(BaseModel):
    target_amount: float = Field(description="Target model estimate sought by user")
    objective: str = Field(description="Objective used: Closest Target, Smallest Feature Changes, or Balanced Scenario")
    objective_explanation: str = Field(description="Mathematical explanation of the objective function applied")
    scenarios: List[TargetPriceScenario] = Field(description="Best matching feasible property configurations")
    feasible_count: int = Field(description="Number of feasible scenarios discovered")
    explanation: Optional[str] = Field(default=None, description="Detailed explanation if no or few feasible scenarios were found")
    disclaimer: str = Field(
        default="These scenarios show how the trained model responds to different property inputs. They do not guarantee real-world prices or indicate that a property with these characteristics is available at the target."
    )
