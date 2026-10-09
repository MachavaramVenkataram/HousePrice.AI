from typing import Any

from pydantic import BaseModel


class DatasetProfileResponse(BaseModel):
    source: str
    rows: int
    total_columns: int
    target: str
    numeric_features_count: int
    categorical_features_count: int
    numeric_features: list[str]
    categorical_features: list[str]
    target_distribution: dict[str, Any]
    missing_values: dict[str, Any]
    duplicates_count: int
    data_quality_score: float
    data_quality_methodology: str
    unique_neighborhoods: list[str]


class PaginatedDatasetResponse(BaseModel):
    total_rows: int
    total: int
    page: int
    page_size: int
    total_pages: int
    columns: list[str]
    data: list[dict[str, Any]]
    rows: list[dict[str, Any]]


class LocationSummary(BaseModel):
    neighborhood: str
    count: int
    mean_price: float
    median_price: float
    min_price: float
    max_price: float
    mean_liv_area: float
