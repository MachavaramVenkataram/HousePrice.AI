from fastapi import APIRouter, HTTPException

from ....schemas.target_price import TargetPriceRequest, TargetPriceResponse
from ....services.target_price_service import FEATURE_METADATA, TargetPriceService

router = APIRouter()


@router.post("/search", response_model=TargetPriceResponse, summary="Search Scenarios for Target Price")
def search_target_price_scenarios(request: TargetPriceRequest):
    """Explores feasible property feature combinations that produce model estimates close to a user target price using the real regression pipeline."""
    service = TargetPriceService.get_instance()
    try:
        return service.search_target_scenarios(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Target price search failed: {e!s}")


@router.get("/capabilities", summary="Get Target Price Search Capabilities")
def get_search_capabilities():
    """Returns supported changeable features, empirical ranges, step increments, and objective descriptions."""
    return {
        "supported_features": FEATURE_METADATA,
        "objectives": [
            {
                "id": "balanced",
                "name": "Balanced Scenario (Recommended)",
                "description": "Balances closeness to target budget (60% weight) with minimal disruption to starting property architecture (40% weight).",
            },
            {
                "id": "closest_target",
                "name": "Closest Target",
                "description": "Minimizes the absolute dollar difference between the model price estimate and the target budget.",
            },
            {
                "id": "smallest_feature_changes",
                "name": "Smallest Feature Changes",
                "description": "Minimizes normalized deviations from starting property specifications while keeping estimates within close range of target.",
            },
        ],
        "dataset_price_range": {"min": 35000, "max": 755000, "median": 163000, "mean": 180921},
    }
