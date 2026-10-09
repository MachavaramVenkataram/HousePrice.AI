import io
import csv
import pandas as pd
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Response
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....schemas.prediction import (
    PropertyFeatures,
    PredictionRequest,
    PredictionResponse,
    WhatIfRequest,
    WhatIfResponse,
    SensitivityRequest,
    SensitivityResponse,
    FeedbackRequest,
)
from ....db.models import PredictionRecord
from ....services.prediction_service import PredictionService

router = APIRouter()


@router.post("", response_model=PredictionResponse, summary="Estimate Property Price")
def predict_property_price(
    request: PredictionRequest,
    db: Session = Depends(get_db),
):
    """Generates a machine-learning property price estimate using historical housing data with a calibrated conformal prediction interval and local SHAP feature attributions."""
    service = PredictionService.get_instance()
    try:
        response = service.predict(
            features=request.features,
            model_override=request.model_override,
            coverage_level=request.coverage_level if request.coverage_level is not None else 0.90,
            db=db,
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unable to generate a prediction: {str(e)}")



@router.post("/what-if", response_model=WhatIfResponse, summary="Simulate What-If Estimation")
def what_if_simulation(
    request: WhatIfRequest,
):
    """Simulates property alterations through the trained machine-learning model to observe model estimate changes."""
    service = PredictionService.get_instance()
    try:
        return service.what_if_analysis(
            base_features=request.base_features,
            modified_features=request.modified_features,
            model_override=request.model_override,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")



@router.post("/sensitivity", response_model=SensitivityResponse, summary="Model Sensitivity Analysis")
def sensitivity_analysis(
    request: SensitivityRequest,
):
    """Generates a 1D sensitivity curve over a feature's valid physical range."""
    service = PredictionService.get_instance()
    try:
        return service.sensitivity_analysis(
            base_features=request.base_features,
            target_feature=request.target_feature,
            min_val=request.min_value,
            max_val=request.max_value,
            steps=request.steps,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sensitivity analysis error: {str(e)}")


@router.post("/feedback", summary="Record User Prediction Feedback")
def record_feedback(
    request: FeedbackRequest,
    db: Session = Depends(get_db),
):
    """Allows users to submit feedback (accurate / inaccurate) on a specific prediction."""
    rec = db.query(PredictionRecord).filter(PredictionRecord.id == request.prediction_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Prediction record not found")
    
    rec.feedback = request.feedback
    if request.comment:
        rec.feedback_comment = request.comment
    db.commit()
    return {"status": "success", "message": "Feedback recorded successfully"}


@router.get("/history", summary="List Prediction History")
def get_prediction_history(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Retrieves recent prediction log records from the database."""
    records = db.query(PredictionRecord).order_by(PredictionRecord.timestamp.desc()).limit(limit).all()
    return [r.to_dict() for r in records]


@router.post("/batch", summary="Batch CSV Prediction")
async def batch_csv_prediction(
    file: UploadFile = File(...),
):
    """Uploads a CSV file, runs schema validation, runs batch model inference, and returns downloadable enriched CSV."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    contents = await file.read()
    try:
        df_upload = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV structure: {str(e)}")

    service = PredictionService.get_instance()
    results = []
    
    for idx, row in df_upload.iterrows():
        try:
            # Map available columns or use default
            row_dict = row.to_dict()
            feat = PropertyFeatures(**{k: v for k, v in row_dict.items() if k in PropertyFeatures.model_fields})
            resp = service.predict(feat)
            row_dict["Predicted_SalePrice"] = resp.predicted_price
            row_dict["Lower_Bound_90Pct"] = resp.prediction_interval.lower_bound
            row_dict["Upper_Bound_90Pct"] = resp.prediction_interval.upper_bound
            results.append(row_dict)
        except Exception:
            row_dict["Predicted_SalePrice"] = None
            results.append(row_dict)

    df_out = pd.DataFrame(results)
    out_csv = df_out.to_csv(index=False)
    
    return Response(
        content=out_csv,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=predictions_{file.filename}"},
    )
