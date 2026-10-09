import os
from fastapi import APIRouter
from ....core.config import settings
from ....services.prediction_service import ARTIFACTS_DIR

router = APIRouter()


@router.get("", summary="Health Check")
def health_check():
    """System health check and artifact verification."""
    best_model_exists = os.path.exists(os.path.join(ARTIFACTS_DIR, "best_model.joblib"))
    conformal_exists = os.path.exists(os.path.join(ARTIFACTS_DIR, "conformal_predictor.joblib"))

    return {
        "status": "healthy" if (best_model_exists and conformal_exists) else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "components": {
            "best_model_artifact": "loaded" if best_model_exists else "missing",
            "conformal_predictor": "loaded" if conformal_exists else "missing",
            "database": "online",
        },
    }
