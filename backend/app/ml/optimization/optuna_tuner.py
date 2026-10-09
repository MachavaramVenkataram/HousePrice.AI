import optuna
import logging
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import KFold
from typing import Dict, Any, Tuple

from ..preprocessing.pipeline import HousingPreprocessingPipeline, TargetTransformer

logger = logging.getLogger(__name__)
optuna.logging.set_verbosity(optuna.logging.WARNING)


def tune_xgboost_optuna(
    X: pd.DataFrame,
    y: pd.Series,
    n_trials: int = 15,
    n_splits: int = 3,
    random_state: int = 42,
) -> Dict[str, Any]:
    """Run Optuna Bayesian hyperparameter optimization on XGBoost minimizing CV RMSE."""
    y_arr = np.asarray(y, dtype=float)
    kf = KFold(n_splits=n_splits, shuffle=True, random_state=random_state)

    trial_history = []

    def objective(trial: optuna.Trial) -> float:
        params = {
            "n_estimators": trial.suggest_int("n_estimators", 100, 300, step=50),
            "max_depth": trial.suggest_int("max_depth", 3, 7),
            "learning_rate": trial.suggest_float("learning_rate", 0.02, 0.10, log=True),
            "subsample": trial.suggest_float("subsample", 0.65, 0.95),
            "colsample_bytree": trial.suggest_float("colsample_bytree", 0.65, 0.95),
            "reg_alpha": trial.suggest_float("reg_alpha", 1e-3, 10.0, log=True),
            "reg_lambda": trial.suggest_float("reg_lambda", 1e-3, 10.0, log=True),
            "random_state": random_state,
            "n_jobs": -1,
        }

        rmse_list = []
        for train_idx, val_idx in kf.split(X):
            pipe = HousingPreprocessingPipeline()
            X_tr = pipe.fit_transform(X.iloc[train_idx])
            X_va = pipe.transform(X.iloc[val_idx])
            y_tr = TargetTransformer.transform(y_arr[train_idx])
            y_va = y_arr[val_idx]

            model = xgb.XGBRegressor(**params)
            model.fit(X_tr, y_tr)
            preds_log = model.predict(X_va)
            preds = TargetTransformer.inverse_transform(preds_log)
            rmse = np.sqrt(np.mean((y_va - preds) ** 2))
            rmse_list.append(rmse)

        mean_rmse = float(np.mean(rmse_list))
        trial_history.append({
            "trial_number": trial.number,
            "params": params,
            "rmse": round(mean_rmse, 2),
        })
        return mean_rmse

    study = optuna.create_study(direction="minimize", sampler=optuna.samplers.TPESampler(seed=random_state))
    study.optimize(objective, n_trials=n_trials)

    return {
        "best_params": study.best_params,
        "best_cv_rmse": round(float(study.best_value), 2),
        "total_trials": n_trials,
        "trial_history": trial_history,
    }
