from fastapi import APIRouter, HTTPException
from ....schemas.prediction import PropertyFeatures
from ....schemas.applicability import ModelApplicabilityResponse, DatasetScopeInfo
from ....services.model_applicability_service import ModelApplicabilityService, SUPPORTED_CATEGORIES

router = APIRouter()


@router.post("/check", response_model=ModelApplicabilityResponse, summary="Evaluate Model Applicability")
def check_model_applicability(features: PropertyFeatures):
    """Evaluates whether an input property profile is represented adequately by the Ames training data across 8 validation pillars."""
    service = ModelApplicabilityService.get_instance()
    try:
        return service.evaluate_applicability(features)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Applicability evaluation failed: {str(e)}")


@router.get("/scope", response_model=DatasetScopeInfo, summary="Get Dataset Geographic & Historical Scope")
def get_dataset_scope():
    """Returns official dataset source, geographic territory, historical period, and documented model limitations."""
    return DatasetScopeInfo()


@router.get("/supported-categories", summary="Get Supported Categorical Values")
def get_supported_categories():
    """Returns dictionary of all supported, observed categorical values across Ames Housing dataset features."""
    return SUPPORTED_CATEGORIES
