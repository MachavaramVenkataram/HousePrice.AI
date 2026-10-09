from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class DatasetProfileResponse(BaseModel):
    source: str
    rows: int
    total_columns: int
    target: str
    numeric_features_count: int
    categorical_features_count: int
    numeric_features: List[str]
    categorical_features: List[str]
    target_distribution: Dict[str, Any]
    missing_values: Dict[str, Any]
    duplicates_count: int
    data_quality_score: float
    data_quality_methodology: str
    unique_neighborhoods: List[str]


class PaginatedDatasetResponse(BaseModel):
    total_rows: int
    total: int
    page: int
    page_size: int
    total_pages: int
    columns: List[str]
    data: List[Dict[str, Any]]
    rows: List[Dict[str, Any]]


class LocationSummary(BaseModel):
    neighborhood: str
    count: int
    mean_price: float
    median_price: float
    min_price: float
    max_price: float
    mean_liv_area: float
