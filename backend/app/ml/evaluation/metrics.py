from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def calculate_regression_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    """Calculate RMSE, MAE, R2, and MAPE on original price scale."""
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_pred, dtype=float)

    rmse = float(np.sqrt(mean_squared_error(y_t, y_p)))
    mae = float(mean_absolute_error(y_t, y_p))
    r2 = float(r2_score(y_t, y_p))
    
    # Avoid zero division in MAPE
    non_zero_mask = y_t > 0
    if np.any(non_zero_mask):
        mape = float(np.mean(np.abs((y_t[non_zero_mask] - y_p[non_zero_mask]) / y_t[non_zero_mask])) * 100.0)
    else:
        mape = 0.0

    return {
        "rmse": round(rmse, 2),
        "mae": round(mae, 2),
        "r2": round(r2, 4),
        "mape": round(mape, 2),
    }


def analyze_residuals(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, Any]:
    """Detailed residual diagnostics for production model validation."""
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_pred, dtype=float)
    residuals = y_t - y_p
    abs_errors = np.abs(residuals)
    rel_errors = np.where(y_t > 0, abs_errors / y_t, 0.0)

    return {
        "mean_residual": round(float(np.mean(residuals)), 2),
        "median_residual": round(float(np.median(residuals)), 2),
        "std_residual": round(float(np.std(residuals)), 2),
        "min_residual": round(float(np.min(residuals)), 2),
        "max_residual": round(float(np.max(residuals)), 2),
        "rmse": round(float(np.sqrt(np.mean(residuals**2))), 2),
        "mae": round(float(np.mean(abs_errors)), 2),
        "median_absolute_error": round(float(np.median(abs_errors)), 2),
        "pct_within_5_percent": round(float(np.mean(rel_errors <= 0.05) * 100.0), 2),
        "pct_within_10_percent": round(float(np.mean(rel_errors <= 0.10) * 100.0), 2),
        "pct_within_20_percent": round(float(np.mean(rel_errors <= 0.20) * 100.0), 2),
    }


def build_error_explorer(
    df_features: pd.DataFrame,
    y_true: np.ndarray,
    y_pred: np.ndarray,
    top_n: int = 50,
) -> list[dict[str, Any]]:
    """Generates structured records for the Prediction Error Explorer."""
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_pred, dtype=float)
    residuals = y_t - y_p
    abs_errors = np.abs(residuals)
    rel_errors = np.where(y_t > 0, (abs_errors / y_t) * 100.0, 0.0)

    records = []
    for i in range(len(y_t)):
        feat_dict = {}
        for col in ["GrLivArea", "OverallQual", "YearBuilt", "Neighborhood", "TotalBsmtSF"]:
            if col in df_features.columns:
                val = df_features.iloc[i][col]
                feat_dict[col] = int(val) if isinstance(val, (int, np.integer)) else (round(float(val), 1) if isinstance(val, (float, np.floating)) else str(val))

        records.append({
            "id": int(i + 1),
            "actual_price": round(float(y_t[i]), 2),
            "predicted_price": round(float(y_p[i]), 2),
            "residual": round(float(residuals[i]), 2),
            "absolute_error": round(float(abs_errors[i]), 2),
            "relative_error_pct": round(float(rel_errors[i]), 2),
            "key_features": feat_dict,
        })

    # Sort descending by absolute error
    records.sort(key=lambda x: x["absolute_error"], reverse=True)
    return records[:top_n]
