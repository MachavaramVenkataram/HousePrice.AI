from typing import Dict, Any, List, Optional, Union
from pydantic import BaseModel, Field, ConfigDict


class PropertyFeatures(BaseModel):
    """Features for Ames Housing property valuation with reasonable physical domain bounds."""
    GrLivArea: float = Field(default=1710.0, ge=300.0, le=10000.0, description="Above grade living area (sq ft)")
    TotalBsmtSF: float = Field(default=856.0, ge=0.0, le=7000.0, description="Total basement area (sq ft)")
    FirstFlrSF: float = Field(default=856.0, alias="1stFlrSF", ge=300.0, le=6000.0, description="First Floor area (sq ft)")
    SecondFlrSF: float = Field(default=854.0, alias="2ndFlrSF", ge=0.0, le=6000.0, description="Second floor area (sq ft)")
    YearBuilt: int = Field(default=2003, ge=1850, le=2026, description="Year originally built")
    YearRemodAdd: int = Field(default=2003, ge=1850, le=2026, description="Year remodeled or modified")
    OverallQual: int = Field(default=7, ge=1, le=10, description="Overall material and finish rating (1-10)")
    OverallCond: int = Field(default=5, ge=1, le=10, description="Overall physical condition rating (1-10)")
    FullBath: int = Field(default=2, ge=0, le=6, description="Full bathrooms above grade")
    HalfBath: int = Field(default=1, ge=0, le=4, description="Half baths above grade")
    BsmtFullBath: int = Field(default=1, ge=0, le=4, description="Basement full bathrooms")
    BedroomAbvGr: int = Field(default=3, ge=0, le=10, description="Bedrooms above grade")
    TotRmsAbvGrd: int = Field(default=8, ge=2, le=18, description="Total rooms above grade (excluding baths)")
    Fireplaces: int = Field(default=1, ge=0, le=5, description="Number of fireplaces")
    GarageCars: int = Field(default=2, ge=0, le=5, description="Garage car capacity")
    GarageArea: float = Field(default=548.0, ge=0.0, le=2000.0, description="Garage area (sq ft)")
    LotArea: float = Field(default=8450.0, ge=1000.0, le=250000.0, description="Lot size in square feet")
    LotFrontage: float = Field(default=65.0, ge=0.0, le=500.0, description="Linear feet of street connected to lot")
    WoodDeckSF: float = Field(default=0.0, ge=0.0, le=2000.0, description="Wood deck area (sq ft)")
    OpenPorchSF: float = Field(default=61.0, ge=0.0, le=1000.0, description="Open porch area (sq ft)")
    MoSold: int = Field(default=2, ge=1, le=12, description="Month sold (1-12)")
    YrSold: int = Field(default=2008, ge=2000, le=2026, description="Year sold")
    Neighborhood: str = Field(default="CollgCr", description="Ames municipal neighborhood code")
    BldgType: str = Field(default="1Fam", description="Dwelling type (1Fam, 2fmCon, Duplex, TwnhsE, Twnhs)")
    HouseStyle: str = Field(default="2Story", description="House style (1Story, 2Story, 1.5Fin, etc.)")
    MSZoning: str = Field(default="RL", description="General zoning classification (RL, RM, C (all), FV, RH)")
    KitchenQual: str = Field(default="Gd", description="Kitchen quality grade (Ex, Gd, TA, Fa, Po)")
    BsmtQual: str = Field(default="Gd", description="Basement height quality (Ex, Gd, TA, Fa, Po, Missing)")
    HeatingQC: str = Field(default="Ex", description="Heating system quality (Ex, Gd, TA, Fa, Po)")
    CentralAir: str = Field(default="Y", description="Central air conditioning (Y, N)")
    GarageType: str = Field(default="Attchd", description="Garage location (Attchd, Detchd, BuiltIn, None)")
    SaleCondition: str = Field(default="Normal", description="Sale condition (Normal, Abnorml, Partial, etc.)")

    model_config = ConfigDict(populate_by_name=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "GrLivArea": self.GrLivArea,
            "TotalBsmtSF": self.TotalBsmtSF,
            "1stFlrSF": self.FirstFlrSF,
            "2ndFlrSF": self.SecondFlrSF,
            "YearBuilt": self.YearBuilt,
            "YearRemodAdd": self.YearRemodAdd,
            "OverallQual": self.OverallQual,
            "OverallCond": self.OverallCond,
            "FullBath": self.FullBath,
            "HalfBath": self.HalfBath,
            "BsmtFullBath": self.BsmtFullBath,
            "BedroomAbvGr": self.BedroomAbvGr,
            "TotRmsAbvGrd": self.TotRmsAbvGrd,
            "Fireplaces": self.Fireplaces,
            "GarageCars": self.GarageCars,
            "GarageArea": self.GarageArea,
            "LotArea": self.LotArea,
            "LotFrontage": self.LotFrontage,
            "WoodDeckSF": self.WoodDeckSF,
            "OpenPorchSF": self.OpenPorchSF,
            "MoSold": self.MoSold,
            "YrSold": self.YrSold,
            "Neighborhood": self.Neighborhood,
            "BldgType": self.BldgType,
            "HouseStyle": self.HouseStyle,
            "MSZoning": self.MSZoning,
            "KitchenQual": self.KitchenQual,
            "BsmtQual": self.BsmtQual,
            "HeatingQC": self.HeatingQC,
            "CentralAir": self.CentralAir,
            "GarageType": self.GarageType,
            "SaleCondition": self.SaleCondition,
        }


class ModelInfo(BaseModel):
    name: str = Field(description="Trained model name")
    version: str = Field(default="v1.0.0", description="Model registry version")


class PredictionRequest(BaseModel):
    features: PropertyFeatures
    model_override: Optional[str] = Field(default=None, description="Optional model selection: 'Voting Ensemble', 'Baseline', 'XGBoost', 'CatBoost', 'LightGBM'")
    coverage_level: Optional[float] = Field(default=0.90, ge=0.50, le=0.99, description="Configured empirical coverage target (e.g. 0.90 or 0.95)")


class UncertaintyInfo(BaseModel):
    method: str = Field(default="conformal_prediction", description="Statistical uncertainty quantification method")
    interval_width: float = Field(description="Prediction interval width: upper - lower")
    uncertainty_level: Optional[str] = Field(default="Moderate", description="'Lower', 'Moderate', or 'Higher' uncertainty")
    target_coverage: Optional[float] = Field(default=0.90, description="Configured empirical coverage target")
    observed_coverage: Optional[float] = Field(default=None, description="Observed empirical coverage on held-out evaluation set")
    mean_interval_width: Optional[float] = Field(default=None, description="Mean interval width on evaluation set")
    calibration_dataset: Optional[str] = Field(default="Ames Housing Calibration Split (Holdout)", description="Dataset used for conformal calibration")
    calibration_samples: Optional[int] = Field(default=292, description="Number of holdout calibration samples")


class PredictionInterval(BaseModel):
    lower: float = Field(description="Lower bound of conformal prediction interval")
    upper: float = Field(description="Upper bound of conformal prediction interval")
    coverage: float = Field(default=0.90, description="Empirical conformal coverage target")
    lower_bound: Optional[float] = Field(default=None, description="Lower bound (backwards compatible)")
    upper_bound: Optional[float] = Field(default=None, description="Upper bound (backwards compatible)")
    margin: Optional[float] = Field(default=None, description="Half-width conformal quantile margin")
    interval_width: Optional[float] = Field(default=None, description="upper - lower")
    confidence_level: Optional[float] = Field(default=0.90, description="Empirical coverage target (backwards compatible)")
    coverage_guarantee: str = Field(default="90% Empirical Conformal Coverage")
    method: str = Field(default="Split Conformal Prediction")
    uncertainty_level: str = Field(default="Moderate", description="'Lower', 'Moderate', or 'Higher' uncertainty")
    explanation: str = Field(
        default="This interval represents uncertainty around this individual model prediction. It indicates a range in which future observations are expected to fall with the configured empirical coverage under the calibration procedure. It is not a guaranteed market price."
    )
    calibration_samples: int = Field(default=292, description="Number of holdout calibration samples")
    target_coverage: Optional[float] = Field(default=0.90)
    observed_coverage: Optional[float] = Field(default=None)
    mean_interval_width: Optional[float] = Field(default=None)


class FeatureContribution(BaseModel):
    feature: str
    impact: float
    absolute_impact: float
    direction: str  # "positive" | "negative"
    label: str  # "Increased model estimate" | "Reduced model estimate"
    contribution_tier: str = Field(default="Moderate contribution", description="e.g. Strong positive contribution, Negative contribution")
    raw_value: Optional[Any] = None


class ExplanationSummary(BaseModel):
    method: str = Field(default="SHAP", description="Explainability method (SHAP or Linear Coefficients)")
    features: List[FeatureContribution] = Field(default_factory=list)
    interpretation_notice: str = Field(
        default="Feature contributions describe how the model arrived at this prediction; they do not establish causal relationships."
    )


class PredictionResponse(BaseModel):
    prediction: float = Field(description="Estimated property value from trained ML model")
    predicted_price: float = Field(description="Estimated property value (backwards compatible)")
    model: Union[ModelInfo, str] = Field(description="Name or metadata of active trained regression model")
    model_version: str = Field(default="v1.0.0")
    prediction_interval: Optional[PredictionInterval] = Field(default=None, description="Conformal prediction interval, or None if unavailable")
    uncertainty: Optional[UncertaintyInfo] = Field(default=None, description="Uncertainty quantification details")
    explanation: ExplanationSummary = Field(default_factory=ExplanationSummary)
    explanations: List[FeatureContribution] = Field(default_factory=list, description="List of top feature attributions")
    applicability: Optional[Dict[str, Any]] = Field(default=None, description="Model applicability and domain validation assessment")
    metadata: Dict[str, Any]
    disclaimer: str = Field(
        default="This is a machine-learning estimate based on historical housing data, not an official property appraisal or guaranteed market valuation."
    )



class WhatIfRequest(BaseModel):
    base_features: PropertyFeatures
    modified_features: PropertyFeatures
    model_override: Optional[str] = None


class WhatIfResponse(BaseModel):
    original_price: float
    new_price: float
    difference: float
    percentage_change: float
    model: Union[ModelInfo, str]
    original_interval: Optional[PredictionInterval] = None
    new_interval: Optional[PredictionInterval] = None
    top_diverging_factors: List[Dict[str, Any]]
    statement: str = "Model estimate changes by..."
    disclaimer: str = "Model simulation based on historical data. Does not represent a guaranteed change in future market value."


class SensitivityRequest(BaseModel):
    base_features: PropertyFeatures
    target_feature: str = Field(default="GrLivArea")
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    steps: int = Field(default=15, ge=5, le=50)


class SensitivityResponse(BaseModel):
    target_feature: str
    points: List[Dict[str, float]]  # [{"feature_value": 1500, "predicted_price": 240000}]
    model: str


class FeedbackRequest(BaseModel):
    prediction_id: int
    feedback: str = Field(..., pattern="^(accurate|inaccurate)$")
    comment: Optional[str] = None

