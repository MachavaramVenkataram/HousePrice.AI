
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from ..data.loader import CATEGORICAL_FEATURES, NUMERIC_FEATURES
from .features import FeatureEngineer


def create_preprocessor(numeric_cols: list[str], categorical_cols: list[str]) -> ColumnTransformer:
    """Constructs a scikit-learn ColumnTransformer.
    
    Numeric pipeline:
      - Median imputation for missing numeric observations
      - StandardScaler for zero mean and unit variance
      
    Categorical pipeline:
      - Constant 'Missing' imputation for unobserved categories
      - OneHotEncoder with handle_unknown='ignore' to gracefully handle novel production categories
    """
    numeric_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="constant", fill_value="Missing")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, numeric_cols),
            ("cat", categorical_transformer, categorical_cols),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )
    return preprocessor


class HousingPreprocessingPipeline:
    """Complete preprocessing and feature engineering pipeline ensuring strict zero-leakage."""

    def __init__(self):
        self.feature_engineer = FeatureEngineer()
        self.engineered_cols = self.feature_engineer.engineered_feature_names
        self.all_numeric_cols = NUMERIC_FEATURES + self.engineered_cols
        self.categorical_cols = CATEGORICAL_FEATURES
        self.preprocessor = create_preprocessor(self.all_numeric_cols, self.categorical_cols)
        self.is_fitted = False
        self.feature_names_out: list[str] = []

    def fit(self, X: pd.DataFrame, y=None) -> "HousingPreprocessingPipeline":
        X_engineered = self.feature_engineer.transform(X)
        self.preprocessor.fit(X_engineered)
        self.is_fitted = True
        
        # Extract feature names after encoding
        try:
            self.feature_names_out = list(self.preprocessor.get_feature_names_out())
        except Exception:
            self.feature_names_out = self.all_numeric_cols.copy()
            
        return self

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("Pipeline must be fitted before transform can be called.")
        X_engineered = self.feature_engineer.transform(X)
        return self.preprocessor.transform(X_engineered)

    def fit_transform(self, X: pd.DataFrame, y=None) -> np.ndarray:
        return self.fit(X, y).transform(X)

    def get_feature_names(self) -> list[str]:
        return self.feature_names_out


class TargetTransformer:
    """Safe target transform using natural logarithm log1p and inverse expm1."""

    @staticmethod
    def transform(y: np.ndarray | pd.Series) -> np.ndarray:
        return np.log1p(np.asarray(y, dtype=float))

    @staticmethod
    def inverse_transform(y_pred: np.ndarray | float) -> np.ndarray | float:
        return np.expm1(np.asarray(y_pred, dtype=float))
