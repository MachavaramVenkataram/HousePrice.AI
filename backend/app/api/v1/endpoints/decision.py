import json
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....db.models import SavedScenario
from ....schemas.prediction import PropertyFeatures
from ....schemas.decision import (
    PropertyProfile,
    InputQualityAssessment,
    EstimateReliabilityAssessment,
    ComparableInsights,
    AffordabilityRequest,
    AffordabilityCalculation,
    ImprovementSimulationResponse,
    SavedScenarioCreate,
    SavedScenarioUpdate,
    SavedScenarioResponse,
)
from ....services.similarity_service import SimilarityService
from ....services.reliability_service import ReliabilityService
from ....services.affordability_service import AffordabilityService
from ....services.scenario_service import ScenarioService

router = APIRouter()


class ProfileRequest(PropertyFeatures):
    pass


class SimilarRequest(PropertyFeatures):
    estimated_price: float
    priority: Optional[str] = "balanced"
    top_k: Optional[int] = 5


class ReliabilityRequest(PropertyFeatures):
    interval_width: Optional[float] = None
    estimated_price: Optional[float] = None


class ImproveRequest(PropertyFeatures):
    renovation_costs: Optional[Dict[str, float]] = None


@router.post("/profile", summary="Smart Property Profile & Quality Check")
def get_property_profile(request: PropertyFeatures):
    """Generates a structured factual property profile and assesses input quality against training bounds."""
    service = ReliabilityService.get_instance()
    profile = service.generate_property_profile(request)
    quality = service.assess_input_quality(request)
    return {
        "profile": profile,
        "input_quality": quality,
    }


@router.post("/similar", response_model=ComparableInsights, summary="Historical Property Comparables")
def get_similar_properties(
    features: PropertyFeatures,
    estimated_price: float = Query(default=200000.0, description="Model estimated property price"),
    priority: str = Query(default="balanced", description="Similarity priority: 'balanced', 'size', 'quality', 'location', 'neighborhood', 'age'"),
    match_scope: str = Query(default="balanced", description="Match scope: 'closest', 'balanced', 'broader'"),
    top_k: int = Query(default=5, ge=1, le=10, description="Number of historical records to retrieve"),
):
    """Finds nearest historical Ames housing records using standardized multi-feature distance."""
    service = SimilarityService.get_instance()
    try:
        return service.find_similar_properties(
            features_dict=features.to_dict(),
            estimated_price=estimated_price,
            priority=priority,
            top_k=top_k,
            match_scope=match_scope,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparable search failed: {str(e)}")


@router.post("/reliability", response_model=EstimateReliabilityAssessment, summary="Estimate Reliability Center")
def get_estimate_reliability(
    features: PropertyFeatures,
    interval_width: Optional[float] = Query(default=None),
    estimated_price: Optional[float] = Query(default=None),
):
    """Evaluates multi-model consensus, interval width, input distribution, and calibration availability."""
    service = ReliabilityService.get_instance()
    try:
        return service.evaluate_estimate_reliability(
            features=features,
            interval_width=interval_width,
            estimated_price=estimated_price,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reliability evaluation failed: {str(e)}")


@router.post("/affordability", response_model=AffordabilityCalculation, summary="Affordability & Budget Planner")
def calculate_affordability(request: AffordabilityRequest):
    """Calculates illustrative monthly payment, loan amount, and budget comparison using transparent formulas."""
    service = AffordabilityService.get_instance()
    try:
        return service.calculate(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Affordability calculation failed: {str(e)}")


@router.post("/affordability/compare", response_model=List[AffordabilityCalculation], summary="Compare Budget Scenarios")
def compare_budget_scenarios(scenarios: List[AffordabilityRequest]):
    """Evaluates multiple budget configurations side-by-side (e.g. Budget A, B, C)."""
    service = AffordabilityService.get_instance()
    try:
        return service.calculate_multi(scenarios)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Budget comparison failed: {str(e)}")


class ImprovementPayload(BaseModel):
    features: Optional[PropertyFeatures] = None
    renovation_costs: Optional[Dict[str, float]] = None


@router.post("/improve", response_model=ImprovementSimulationResponse, summary="Property Improvement Simulator")
def simulate_improvements(
    payload: Dict[str, Any],
):
    """Simulates property improvements through trained models and computes modeled difference."""
    service = ScenarioService.get_instance()
    try:
        if "features" in payload and isinstance(payload["features"], dict):
            feats = PropertyFeatures(**payload["features"])
            costs = payload.get("renovation_costs")
        else:
            feats = PropertyFeatures(**payload)
            costs = None

        return service.simulate_improvements(
            base_features=feats,
            renovation_costs=costs,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Improvement simulation failed: {str(e)}")


@router.post("/scenarios", response_model=SavedScenarioResponse, summary="Save User Scenario")
def save_scenario(
    request: SavedScenarioCreate,
    db: Session = Depends(get_db),
):
    """Persists a property scenario to the database for cross-scenario comparison."""
    from ....core.database import engine, Base
    Base.metadata.create_all(bind=engine)
    rec = SavedScenario(
        name=request.name,
        description=request.description,
        features_json=json.dumps(request.features.to_dict()),
        predicted_price=request.predicted_price,
        lower_bound=request.lower_bound,
        upper_bound=request.upper_bound,
        model_name=request.model_name,
        model_version=request.model_version,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return SavedScenarioResponse(**rec.to_dict())


@router.get("/scenarios", response_model=List[SavedScenarioResponse], summary="List Saved Scenarios")
def list_saved_scenarios(
    db: Session = Depends(get_db),
):
    """Returns saved property scenarios for multi-scenario comparison."""
    recs = db.query(SavedScenario).order_by(SavedScenario.created_at.desc()).limit(20).all()
    return [SavedScenarioResponse(**r.to_dict()) for r in recs]


@router.put("/scenarios/{scenario_id}", response_model=SavedScenarioResponse, summary="Update Saved Scenario")
def update_saved_scenario(
    scenario_id: int,
    request: SavedScenarioUpdate,
    db: Session = Depends(get_db),
):
    """Updates an existing scenario (rename, edit parameters, or re-estimated price)."""
    rec = db.query(SavedScenario).filter(SavedScenario.id == scenario_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Scenario not found")
    if request.name is not None:
        rec.name = request.name
    if request.description is not None:
        rec.description = request.description
    if request.features is not None:
        rec.features_json = json.dumps(request.features.to_dict())
    if request.predicted_price is not None:
        rec.predicted_price = request.predicted_price
    if request.lower_bound is not None:
        rec.lower_bound = request.lower_bound
    if request.upper_bound is not None:
        rec.upper_bound = request.upper_bound
    if request.model_name is not None:
        rec.model_name = request.model_name
    if request.model_version is not None:
        rec.model_version = request.model_version
    db.commit()
    db.refresh(rec)
    return SavedScenarioResponse(**rec.to_dict())


@router.post("/scenarios/{scenario_id}/duplicate", response_model=SavedScenarioResponse, summary="Duplicate Saved Scenario")
def duplicate_saved_scenario(
    scenario_id: int,
    db: Session = Depends(get_db),
):
    """Duplicates an existing scenario for branching analysis."""
    rec = db.query(SavedScenario).filter(SavedScenario.id == scenario_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Scenario not found")
    new_rec = SavedScenario(
        name=f"Copy of {rec.name}",
        description=rec.description,
        features_json=rec.features_json,
        predicted_price=rec.predicted_price,
        lower_bound=rec.lower_bound,
        upper_bound=rec.upper_bound,
        model_name=rec.model_name,
        model_version=rec.model_version,
    )
    db.add(new_rec)
    db.commit()
    db.refresh(new_rec)
    return SavedScenarioResponse(**new_rec.to_dict())


@router.delete("/scenarios/{scenario_id}", summary="Delete Saved Scenario")
def delete_saved_scenario(
    scenario_id: int,
    db: Session = Depends(get_db),
):
    """Removes a saved scenario from the database."""
    rec = db.query(SavedScenario).filter(SavedScenario.id == scenario_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Scenario not found")
    db.delete(rec)
    db.commit()
    return {"status": "success", "message": f"Scenario #{scenario_id} removed"}


# --- Property Profiles Endpoints ---

from ....schemas.decision import (
    PropertyProfileCreate,
    PropertyProfileResponse,
    PropertyProfileComparisonResponse,
)
from ....services.profile_service import ProfileService


@router.post("/profiles", response_model=PropertyProfileResponse, summary="Create Property Profile")
def create_property_profile(
    request: PropertyProfileCreate,
    db: Session = Depends(get_db),
):
    """Creates a persistent property profile (e.g. 'My Current Home', 'Property A')."""
    from ....core.database import engine, Base
    Base.metadata.create_all(bind=engine)
    service = ProfileService.get_instance()
    return service.create_profile(request, db)


@router.get("/profiles", response_model=List[PropertyProfileResponse], summary="List Property Profiles")
def list_property_profiles(
    limit: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Lists saved property profiles."""
    from ....core.database import engine, Base
    Base.metadata.create_all(bind=engine)
    service = ProfileService.get_instance()
    return service.list_profiles(db, limit=limit)


@router.delete("/profiles/{profile_id}", summary="Delete Property Profile")
def delete_property_profile(
    profile_id: int,
    db: Session = Depends(get_db),
):
    """Deletes a property profile."""
    service = ProfileService.get_instance()
    deleted = service.delete_profile(profile_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"status": "success", "message": f"Profile #{profile_id} deleted"}


@router.post("/profiles/compare", response_model=PropertyProfileComparisonResponse, summary="Compare Property Profiles")
def compare_property_profiles(
    profile_ids: List[int],
    db: Session = Depends(get_db),
):
    """Compares saved property profiles side-by-side."""
    service = ProfileService.get_instance()
    return service.compare_profiles(profile_ids, db)

