import os
import json
import logging
from typing import Dict, Any, Tuple
import pandas as pd
import numpy as np
import sklearn.datasets

logger = logging.getLogger(__name__)

RAW_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", "ames_housing.csv")
DATA_PROFILE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", "data_profile.json")

# Selected high-signal features across numeric and categorical categories
NUMERIC_FEATURES = [
    "GrLivArea",
    "TotalBsmtSF",
    "1stFlrSF",
    "2ndFlrSF",
    "YearBuilt",
    "YearRemodAdd",
    "OverallQual",
    "OverallCond",
    "FullBath",
    "HalfBath",
    "BsmtFullBath",
    "BedroomAbvGr",
    "TotRmsAbvGrd",
    "Fireplaces",
    "GarageCars",
    "GarageArea",
    "LotArea",
    "LotFrontage",
    "WoodDeckSF",
    "OpenPorchSF",
    "MoSold",
    "YrSold",
]

CATEGORICAL_FEATURES = [
    "Neighborhood",
    "BldgType",
    "HouseStyle",
    "MSZoning",
    "KitchenQual",
    "BsmtQual",
    "HeatingQC",
    "CentralAir",
    "GarageType",
    "SaleCondition",
]

TARGET = "SalePrice"


def fetch_and_save_dataset() -> pd.DataFrame:
    """Fetch Ames Housing dataset from OpenML, save to disk, and profile it."""
    os.makedirs(os.path.dirname(RAW_DATA_PATH), exist_ok=True)
    if os.path.exists(RAW_DATA_PATH):
        logger.info(f"Loading existing dataset from {RAW_DATA_PATH}")
        df = pd.read_csv(RAW_DATA_PATH)
        return df

    logger.info("Fetching Ames Housing dataset from OpenML (house_prices)...")
    dataset = sklearn.datasets.fetch_openml(name="house_prices", as_frame=True, parser="auto")
    df = dataset.frame.copy()

    # Ensure numeric columns are properly typed
    for col in NUMERIC_FEATURES + [TARGET]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Save raw CSV
    df.to_csv(RAW_DATA_PATH, index=False)
    logger.info(f"Saved dataset with {len(df)} rows and {df.shape[1]} columns to {RAW_DATA_PATH}")

    # Generate profile
    generate_data_profile(df)
    return df


def load_dataset() -> pd.DataFrame:
    """Load dataset, fetching if missing."""
    if not os.path.exists(RAW_DATA_PATH):
        return fetch_and_save_dataset()
    return pd.read_csv(RAW_DATA_PATH)


def generate_data_profile(df: pd.DataFrame) -> Dict[str, Any]:
    """Inspect dataset and document actual properties without fabrication."""
    numeric_cols = [c for c in NUMERIC_FEATURES if c in df.columns]
    categorical_cols = [c for c in CATEGORICAL_FEATURES if c in df.columns]
    
    missing_summary = {}
    for col in numeric_cols + categorical_cols + [TARGET]:
        if col in df.columns:
            n_missing = int(df[col].isna().sum())
            missing_summary[col] = {
                "count": n_missing,
                "percentage": round((n_missing / len(df)) * 100, 2),
            }

    target_series = pd.to_numeric(df[TARGET], errors="coerce").dropna()
    target_stats = {
        "count": int(len(target_series)),
        "mean": float(round(target_series.mean(), 2)),
        "std": float(round(target_series.std(), 2)),
        "min": float(round(target_series.min(), 2)),
        "p25": float(round(target_series.quantile(0.25), 2)),
        "median": float(round(target_series.median(), 2)),
        "p75": float(round(target_series.quantile(0.75), 2)),
        "max": float(round(target_series.max(), 2)),
        "skewness": float(round(target_series.skew(), 4)),
        "kurtosis": float(round(target_series.kurtosis(), 4)),
        "log_skewness": float(round(np.log1p(target_series).skew(), 4)),
    }

    # Data Quality Score calculation methodology:
    # 100 - (missing_penalty + duplicate_penalty + outlier_penalty)
    # Explicitly documented methodology
    total_cells = len(df) * (len(numeric_cols) + len(categorical_cols))
    total_missing = sum(missing_summary[c]["count"] for c in numeric_cols + categorical_cols)
    missing_ratio = total_missing / max(total_cells, 1)
    duplicates = int(df.duplicated(subset=numeric_cols).sum())
    duplicate_ratio = duplicates / max(len(df), 1)
    
    quality_score = max(0.0, min(100.0, 100.0 - (missing_ratio * 40.0) - (duplicate_ratio * 30.0)))

    profile = {
        "source": "OpenML Ames Housing Dataset (Dean De Cock, Truman State University)",
        "rows": int(len(df)),
        "total_columns": int(df.shape[1]),
        "target": TARGET,
        "numeric_features_count": len(numeric_cols),
        "categorical_features_count": len(categorical_cols),
        "numeric_features": numeric_cols,
        "categorical_features": categorical_cols,
        "target_distribution": target_stats,
        "missing_values": missing_summary,
        "duplicates_count": duplicates,
        "data_quality_score": round(quality_score, 1),
        "data_quality_methodology": "Score = 100 - (Missing_Rate * 40 + Duplicate_Rate * 30), bounded [0, 100].",
        "unique_neighborhoods": sorted([str(x) for x in df["Neighborhood"].dropna().unique().tolist()]) if "Neighborhood" in df.columns else [],
    }

    with open(DATA_PROFILE_PATH, "w") as f:
        json.dump(profile, f, indent=2)

    return profile


def get_data_profile() -> Dict[str, Any]:
    """Retrieve data profile from disk, generating if missing."""
    if os.path.exists(DATA_PROFILE_PATH):
        with open(DATA_PROFILE_PATH, "r") as f:
            return json.load(f)
    df = load_dataset()
    return generate_data_profile(df)
