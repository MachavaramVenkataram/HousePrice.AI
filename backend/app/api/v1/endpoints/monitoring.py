import json
import os

import pandas as pd
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....db.models import PredictionRecord
from ....ml.monitoring.drift_detector import DataDriftDetector

router = APIRouter()


@router.get("/metrics", summary="Model Monitoring & Health Metrics")
def get_monitoring_metrics(db: Session = Depends(get_db)):
    """Retrieves operational metrics from production inference logs."""
    total_preds = db.query(PredictionRecord).count()
    avg_price = db.query(func.avg(PredictionRecord.predicted_price)).scalar() or 0.0
    avg_latency = db.query(func.avg(PredictionRecord.latency_ms)).scalar() or 0.0
    
    accurate_cnt = db.query(PredictionRecord).filter(PredictionRecord.feedback == "accurate").count()
    inaccurate_cnt = db.query(PredictionRecord).filter(PredictionRecord.feedback == "inaccurate").count()

    return {
        "total_predictions": total_preds,
        "average_predicted_price": round(float(avg_price), 2),
        "average_latency_ms": round(float(avg_latency), 2),
        "feedback_positive": accurate_cnt,
        "feedback_negative": inaccurate_cnt,
        "performance_notice": "Production rolling RMSE/MAE requires verified settlement prices.",
    }


@router.post("/drift", summary="Run Kolmogorov-Smirnov Data Drift Test")
def run_data_drift_test(db: Session = Depends(get_db)):
    """Compares recent production inference payloads with the training reference distribution using two-sample KS tests."""
    detector = DataDriftDetector()
    records = db.query(PredictionRecord).order_by(PredictionRecord.timestamp.desc()).limit(100).all()
    
    rows = []
    for r in records:
        try:
            rows.append(json.loads(r.inputs_json))
        except Exception:
            pass

    # If fewer than 10 production predictions have been logged yet, supplement with test holdout samples
    if len(rows) < 10:
        csv_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..", "data", "ames_housing.csv")
        if os.path.exists(csv_path):
            df_full = pd.read_csv(csv_path)
            # Take a test slice
            df_holdout = df_full.tail(50)
            rows.extend(df_holdout.to_dict(orient="records"))

    df_eval = pd.DataFrame(rows)
    raw_drift = detector.check_batch_drift(df_eval)

    # Format into structured feature_tests dictionary
    feature_tests_dict = {}
    for item in raw_drift.get("all_features", []):
        feature_tests_dict[item["feature"]] = {
            "ks_statistic": item["ks_statistic"],
            "p_value": item["p_value"],
            "drift": item["drift_detected"],
            "baseline_mean": item["baseline_mean"],
            "production_mean": item["production_mean"],
        }

    return {
        "drift_detected": raw_drift.get("drift_detected", False),
        "drift_share_pct": raw_drift.get("drift_share_pct", 0.0),
        "sample_size": len(rows),
        "feature_tests": feature_tests_dict,
    }
