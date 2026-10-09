from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from ....services.dataset_service import DatasetService
from ....schemas.dataset import DatasetProfileResponse, PaginatedDatasetResponse

router = APIRouter()


@router.get("/profile", response_model=DatasetProfileResponse, summary="Ames Housing Data Profile")
def get_dataset_profile():
    """Returns real dataset documentation, statistics, missing values, and quality score."""
    service = DatasetService.get_instance()
    return service.get_profile()


@router.get("/rows", response_model=PaginatedDatasetResponse, summary="Query Dataset with Pagination")
def query_dataset_rows(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=15, ge=5, le=100),
    search: Optional[str] = Query(default=None),
    neighborhood: Optional[str] = Query(default=None),
    min_price: Optional[float] = Query(default=None),
    max_price: Optional[float] = Query(default=None),
    min_bedrooms: Optional[int] = Query(default=None),
    sort_by: str = Query(default="SalePrice"),
    sort_desc: bool = Query(default=True),
):
    """Server-side paginated explorer for the Ames Housing dataset."""
    service = DatasetService.get_instance()
    return service.query_rows(
        page=page,
        page_size=page_size,
        search=search,
        neighborhood=neighborhood,
        min_price=min_price,
        max_price=max_price,
        min_bedrooms=min_bedrooms,
        sort_by=sort_by,
        sort_desc=sort_desc,
    )


@router.get("/locations", summary="Location & Neighborhood Analytics")
def get_location_analytics():
    """Returns price distribution, counts, and metrics by geographic neighborhood."""
    service = DatasetService.get_instance()
    return service.get_location_analytics()
