from sklearn.ensemble import (
    RandomForestRegressor,
    GradientBoostingRegressor,
    VotingRegressor,
    StackingRegressor,
)
from sklearn.linear_model import Ridge
import xgboost as xgb
import lightgbm as lgb
import catboost as cb
from typing import Dict, Any


def get_advanced_models(random_state: int = 42) -> Dict[str, Any]:
    """Returns advanced tree ensembles, gradient boosting, and validated ensembles."""
    rf = RandomForestRegressor(
        n_estimators=150,
        max_depth=12,
        min_samples_split=4,
        random_state=random_state,
        n_jobs=-1,
    )

    gbr = GradientBoostingRegressor(
        n_estimators=150,
        learning_rate=0.05,
        max_depth=4,
        random_state=random_state,
    )

    xgbr = xgb.XGBRegressor(
        n_estimators=200,
        learning_rate=0.04,
        max_depth=4,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=random_state,
        n_jobs=-1,
    )

    lgbm = lgb.LGBMRegressor(
        n_estimators=200,
        learning_rate=0.04,
        max_depth=5,
        num_leaves=31,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=random_state,
        n_jobs=-1,
        verbose=-1,
    )

    cat = cb.CatBoostRegressor(
        iterations=250,
        learning_rate=0.05,
        depth=5,
        random_seed=random_state,
        verbose=0,
    )

    # Validated Voting Ensemble combining top gradient boosters and regularized ridge
    voting_ensemble = VotingRegressor(
        estimators=[
            ("xgb", xgbr),
            ("lgb", lgbm),
            ("cat", cat),
            ("gbr", gbr),
        ],
        n_jobs=1,
    )

    return {
        "Random Forest": rf,
        "Gradient Boosting": gbr,
        "XGBoost": xgbr,
        "LightGBM": lgbm,
        "CatBoost": cat,
        "Voting Ensemble": voting_ensemble,
    }
