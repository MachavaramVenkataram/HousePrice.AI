import logging
import time
from typing import Any

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, clone
from sklearn.model_selection import KFold

from ..preprocessing.pipeline import HousingPreprocessingPipeline, TargetTransformer
from .metrics import calculate_regression_metrics

logger = logging.getLogger(__name__)


def evaluate_model_cv(
    model: BaseEstimator,
    X: pd.DataFrame,
    y: pd.Series,
    n_splits: int = 5,
    random_state: int = 42,
    use_target_transform: bool = True,
) -> dict[str, Any]:
    """Runs k-fold cross validation with strict zero-leakage preprocessing per fold."""
    kf = KFold(n_splits=n_splits, shuffle=True, random_state=random_state)

    rmse_scores = []
    mae_scores = []
    r2_scores = []
    fit_times = []
    infer_times = []

    y_arr = np.asarray(y, dtype=float)

    for fold_idx, (train_idx, val_idx) in enumerate(kf.split(X)):
        X_train_fold, X_val_fold = X.iloc[train_idx], X.iloc[val_idx]
        y_train_fold, y_val_fold = y_arr[train_idx], y_arr[val_idx]

        # Fit preprocessor strictly on training fold
        pipe = HousingPreprocessingPipeline()
        X_train_trans = pipe.fit_transform(X_train_fold)
        X_val_trans = pipe.transform(X_val_fold)

        # Target transform if specified
        if use_target_transform:
            y_train_fit = TargetTransformer.transform(y_train_fold)
        else:
            y_train_fit = y_train_fold

        m = clone(model)
        
        # Measure training duration
        t0 = time.perf_counter()
        m.fit(X_train_trans, y_train_fit)
        fit_time = time.perf_counter() - t0
        fit_times.append(fit_time)

        # Measure inference duration
        t1 = time.perf_counter()
        val_preds_raw = m.predict(X_val_trans)
        infer_time = time.perf_counter() - t1
        infer_times.append(infer_time)

        if use_target_transform:
            val_preds = TargetTransformer.inverse_transform(val_preds_raw)
        else:
            val_preds = val_preds_raw

        # Guard against negative price estimates
        val_preds = np.clip(val_preds, a_min=10000.0, a_max=None)

        metrics = calculate_regression_metrics(y_val_fold, val_preds)
        rmse_scores.append(metrics["rmse"])
        mae_scores.append(metrics["mae"])
        r2_scores.append(metrics["r2"])

    return {
        "rmse_mean": round(float(np.mean(rmse_scores)), 2),
        "rmse_std": round(float(np.std(rmse_scores)), 2),
        "mae_mean": round(float(np.mean(mae_scores)), 2),
        "mae_std": round(float(np.std(mae_scores)), 2),
        "r2_mean": round(float(np.mean(r2_scores)), 4),
        "r2_std": round(float(np.std(r2_scores)), 4),
        "avg_fit_time_sec": round(float(np.mean(fit_times)), 4),
        "avg_infer_time_ms": round(float(np.mean(infer_times) * 1000.0 / len(val_idx)), 3),
        "fold_rmse": [round(s, 2) for s in rmse_scores],
    }
