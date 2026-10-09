import pandas as pd
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from typing import List, Dict, Any


class FeatureEngineer(BaseEstimator, TransformerMixin):
    """Domain-specific feature engineering transformer for residential real estate.
    
    Transforms raw property dimensions and timeline variables into domain-informed metrics:
    - TotalSF: Complete usable square footage (1st floor + 2nd floor + basement)
    - TotalBath: Weighted bathroom count (FullBath + 0.5*HalfBath + BsmtFullBath + 0.5*BsmtHalfBath)
    - HouseAge: Age of property at time of sale
    - RemodelAge: Years elapsed since most recent remodel
    - IsRemodeled: Indicator whether remodeling occurred after initial build
    - IsNew: Indicator whether home was sold in the year it was built
    - QualityScore: Interaction term between material quality and physical condition
    - HasGarage: Binary flag for garage presence
    - HasBasement: Binary flag for basement presence
    - HasFireplace: Binary flag for fireplace presence
    - PorchSF: Total outdoor porch/deck square footage
    """

    def __init__(self):
        self.engineered_feature_names: List[str] = [
            "TotalSF",
            "TotalBath",
            "HouseAge",
            "RemodelAge",
            "IsRemodeled",
            "IsNew",
            "QualityScore",
            "HasGarage",
            "HasBasement",
            "HasFireplace",
            "PorchSF",
        ]

    def fit(self, X: pd.DataFrame, y=None):
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        df = X.copy()

        # Fill NaNs temporarily for safe arithmetic
        first_flr = df["1stFlrSF"].fillna(0) if "1stFlrSF" in df.columns else pd.Series(0.0, index=df.index)
        sec_flr = df["2ndFlrSF"].fillna(0) if "2ndFlrSF" in df.columns else pd.Series(0.0, index=df.index)
        bsmt_sf = df["TotalBsmtSF"].fillna(0) if "TotalBsmtSF" in df.columns else pd.Series(0.0, index=df.index)
        df["TotalSF"] = first_flr + sec_flr + bsmt_sf

        full_bath = df["FullBath"].fillna(0) if "FullBath" in df.columns else pd.Series(0.0, index=df.index)
        half_bath = df["HalfBath"].fillna(0) if "HalfBath" in df.columns else pd.Series(0.0, index=df.index)
        bsmt_full = df["BsmtFullBath"].fillna(0) if "BsmtFullBath" in df.columns else pd.Series(0.0, index=df.index)
        bsmt_half = df["BsmtHalfBath"].fillna(0) if "BsmtHalfBath" in df.columns else pd.Series(0.0, index=df.index)
        df["TotalBath"] = full_bath + (0.5 * half_bath) + bsmt_full + (0.5 * bsmt_half)

        yr_sold = df["YrSold"].fillna(2010) if "YrSold" in df.columns else pd.Series(2010, index=df.index)
        yr_built = df["YearBuilt"].fillna(1970) if "YearBuilt" in df.columns else pd.Series(1970, index=df.index)
        yr_remod = df["YearRemodAdd"].fillna(yr_built) if "YearRemodAdd" in df.columns else yr_built

        df["HouseAge"] = (yr_sold - yr_built).clip(lower=0)
        df["RemodelAge"] = (yr_sold - yr_remod).clip(lower=0)
        df["IsRemodeled"] = (yr_remod > yr_built).astype(int)
        df["IsNew"] = (yr_sold == yr_built).astype(int)

        qual = df["OverallQual"].fillna(5) if "OverallQual" in df.columns else pd.Series(5, index=df.index)
        cond = df["OverallCond"].fillna(5) if "OverallCond" in df.columns else pd.Series(5, index=df.index)
        df["QualityScore"] = qual * cond

        garage_area = df["GarageArea"].fillna(0) if "GarageArea" in df.columns else pd.Series(0.0, index=df.index)
        df["HasGarage"] = (garage_area > 0).astype(int)
        df["HasBasement"] = (bsmt_sf > 0).astype(int)

        fireplaces = df["Fireplaces"].fillna(0) if "Fireplaces" in df.columns else pd.Series(0.0, index=df.index)
        df["HasFireplace"] = (fireplaces > 0).astype(int)

        wood_deck = df["WoodDeckSF"].fillna(0) if "WoodDeckSF" in df.columns else pd.Series(0.0, index=df.index)
        open_porch = df["OpenPorchSF"].fillna(0) if "OpenPorchSF" in df.columns else pd.Series(0.0, index=df.index)
        df["PorchSF"] = wood_deck + open_porch

        return df

    def get_feature_documentation(self) -> List[Dict[str, str]]:
        return [
            {"name": "TotalSF", "formula": "1stFlrSF + 2ndFlrSF + TotalBsmtSF", "rationale": "Captures overall enclosed interior and lower-level footprint."},
            {"name": "TotalBath", "formula": "FullBath + 0.5*HalfBath + BsmtFullBath + 0.5*BsmtHalfBath", "rationale": "Standard valuation metric for weighted sanitary fixture capacity."},
            {"name": "HouseAge", "formula": "YrSold - YearBuilt", "rationale": "Reflects building physical depreciation at transaction date."},
            {"name": "RemodelAge", "formula": "YrSold - YearRemodAdd", "rationale": "Measures elapsed obsolescence since structural modernization."},
            {"name": "IsRemodeled", "formula": "YearRemodAdd > YearBuilt", "rationale": "Distinguishes pristine originals from updated residences."},
            {"name": "IsNew", "formula": "YrSold == YearBuilt", "rationale": "Identifies brand-new construction commanding premium margins."},
            {"name": "QualityScore", "formula": "OverallQual * OverallCond", "rationale": "Multiplicative synergy of finish grades and ongoing maintenance."},
            {"name": "HasGarage", "formula": "GarageArea > 0", "rationale": "Binary amenity indicator for vehicle protection."},
            {"name": "HasBasement", "formula": "TotalBsmtSF > 0", "rationale": "Binary amenity indicator for below-grade foundation spaces."},
            {"name": "HasFireplace", "formula": "Fireplaces > 0", "rationale": "Luxury amenity flag often correlating with upper price tiers."},
            {"name": "PorchSF", "formula": "WoodDeckSF + OpenPorchSF", "rationale": "Aggregated outdoor living square footage."},
        ]
