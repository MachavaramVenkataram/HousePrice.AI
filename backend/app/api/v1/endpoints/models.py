import json
import os
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....ml.models.registry import ModelRegistryManager

router = APIRouter()

ARTIFACTS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "artifacts")
)


def _load_json_artifact(filename: str) -> Any:
    path = os.path.join(ARTIFACTS_DIR, filename)
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return None


@router.get("", summary="Get Model Registry Info")
def get_model_registry():
    """Returns active production model, baseline, and all registered model versions."""
    mgr = ModelRegistryManager()
    return mgr.load_registry()


@router.get("/benchmark", summary="Model Benchmark Comparison")
def get_benchmark_results():
    """Returns real 5-Fold Cross Validation benchmark table comparing all 10 trained models."""
    data = _load_json_artifact("benchmark_results.json")
    if data is None:
        raise HTTPException(status_code=404, detail="Benchmark results not found. Run training pipeline first.")
    return data


@router.get("/residuals", summary="Residual Diagnostics")
def get_residual_diagnostics():
    """Returns detailed residual analysis metrics for the active production model."""
    data = _load_json_artifact("residual_diagnostics.json")
    if data is None:
        raise HTTPException(status_code=404, detail="Residual diagnostics not found.")
    return data


@router.get("/errors", summary="Prediction Error Explorer")
def get_error_explorer():
    """Returns the top prediction errors on the holdout test set with key feature details."""
    data = _load_json_artifact("error_explorer.json")
    if data is None:
        raise HTTPException(status_code=404, detail="Error explorer records not found.")
    return data


@router.get("/shap/global", summary="Global SHAP Feature Importance")
def get_global_shap():
    """Returns global SHAP feature importance computed from the representative background sample."""
    data = _load_json_artifact("global_shap.json")
    if data is None:
        raise HTTPException(status_code=404, detail="Global SHAP data not found.")
    return data


@router.get("/scatter", summary="Predicted vs Actual Scatter Data")
def get_scatter_data():
    """Returns actual vs predicted price pairs on the holdout test set for regression visualization."""
    data = _load_json_artifact("test_scatter.json")
    if data is None:
        raise HTTPException(status_code=404, detail="Scatter points not found.")
    return data


@router.get("/optuna", summary="Optuna Optimization History")
def get_optuna_history():
    """Returns Optuna Bayesian optimization trials, best hyperparameters, and score trajectory."""
    data = _load_json_artifact("optuna_results.json")
    if data is None:
        return {"best_params": {}, "trial_history": []}
    return data


# ==============================================================================
# Model Release Manager Endpoints
# ==============================================================================

@router.get("/releases/status", summary="Get Model Release Manager Status")
def get_model_release_status(db: Session = Depends(get_db)):
    """Returns active production model, candidates, validation criteria, rollback options, and release audit history."""
    from ....services.model_release_service import ModelReleaseService
    service = ModelReleaseService.get_instance()
    try:
        return service.get_release_status(db=db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch model release status: {e!s}")


@router.api_route("/releases/compare", methods=["GET", "POST"], summary="Compare Candidate Model against Production")
def compare_release_models(candidate_name: str = Query(None), current_name: str = Query(None), body: dict | None = Body(None)):
    """Generates a side-by-side technical metric comparison between candidate model and active production baseline."""
    from ....services.model_release_service import ModelReleaseService
    service = ModelReleaseService.get_instance()
    c_name = candidate_name or (body.get("candidate_name") if body else None)
    curr_name = current_name or (body.get("current_name") if body else None)
    if not c_name:
        raise HTTPException(status_code=400, detail="candidate_name query param or body field is required")
    try:
        return service.compare_models(candidate_name=c_name, baseline_or_prod=curr_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model comparison failed: {e!s}")


@router.api_route("/releases/validate", methods=["GET", "POST"], summary="Run Automated Candidate Release Validation")
def validate_release_candidate(candidate_name: str = Query(None), body: dict | None = Body(None)):
    """Evaluates candidate model against the 5 documented technical promotion criteria (RMSE, R², Coverage, Latency, Compatibility)."""
    from ....services.model_release_service import ModelReleaseService
    service = ModelReleaseService.get_instance()
    c_name = candidate_name or (body.get("candidate_name") if body else None)
    if not c_name:
        raise HTTPException(status_code=400, detail="candidate_name query param or body field is required")
    try:
        return service.run_validation(candidate_name=c_name)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Candidate validation failed: {e!s}")


@router.post("/releases/promote", summary="Approve and Execute Model Promotion")
def approve_model_promotion(
    request: dict,
    db: Session = Depends(get_db),
):
    """Authorizes and executes production promotion of a validated candidate model with zero-downtime hot swap."""
    from ....schemas.release import PromotionRequest
    from ....services.model_release_service import ModelReleaseService
    service = ModelReleaseService.get_instance()
    try:
        req = PromotionRequest(**request)
        return service.approve_promotion(req, db=db)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model promotion failed: {e!s}")


@router.post("/releases/cancel", summary="Reject Candidate Model")
def cancel_release_candidate(
    request: dict,
    db: Session = Depends(get_db),
):
    """Rejects candidate model and records reason in audit registry."""
    from ....schemas.release import CancelCandidateRequest
    from ....services.model_release_service import ModelReleaseService
    service = ModelReleaseService.get_instance()
    try:
        req = CancelCandidateRequest(**request)
        return service.cancel_candidate(req, db=db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel candidate: {e!s}")


@router.post("/releases/rollback", summary="Rollback to Previous Production Model")
def rollback_production_model(
    request: dict,
    db: Session = Depends(get_db),
):
    """Reverts active production deployment to the previously approved model version with zero downtime."""
    from ....schemas.release import RollbackRequest
    from ....services.model_release_service import ModelReleaseService
    service = ModelReleaseService.get_instance()
    try:
        req = RollbackRequest(**request)
        return service.rollback(req, db=db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rollback failed: {e!s}")

