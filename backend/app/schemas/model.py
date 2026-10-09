from typing import Any

from pydantic import BaseModel


class BenchmarkItem(BaseModel):
    model: str
    category: str
    cv_rmse_mean: float
    cv_rmse_std: float
    cv_mae_mean: float
    cv_mae_std: float
    cv_r2_mean: float
    cv_r2_std: float
    test_rmse: float
    test_mae: float
    test_r2: float
    test_mape: float
    training_time_sec: float
    inference_time_ms: float


class RegisteredModelItem(BaseModel):
    name: str
    version: str
    stage: str
    cv_metrics: dict[str, Any]
    test_metrics: dict[str, Any]
    registered_at: str
    description: str


class ModelRegistryResponse(BaseModel):
    current_production_model: str
    production_version: str
    baseline_model: str
    registered_models: list[RegisteredModelItem]
    last_updated: str


class ResidualDiagnosticsResponse(BaseModel):
    mean_residual: float
    median_residual: float
    std_residual: float
    min_residual: float
    max_residual: float
    rmse: float
    mae: float
    median_absolute_error: float
    pct_within_5_percent: float
    pct_within_10_percent: float
    pct_within_20_percent: float


class ErrorExplorerRecord(BaseModel):
    id: int
    actual_price: float
    predicted_price: float
    residual: float
    absolute_error: float
    relative_error_pct: float
    key_features: dict[str, Any]
