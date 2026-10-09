import json
import os
from typing import Any

import numpy as np
import pandas as pd
from scipy import stats

DRIFT_BASELINE_PATH = os.path.join(
    os.path.dirname(__file__), "..", "artifacts", "drift_baseline.json"
)


class DataDriftDetector:
    """Statistical data drift detection using two-sample Kolmogorov-Smirnov (KS) test."""

    def __init__(self, p_value_threshold: float = 0.05):
        self.p_value_threshold = p_value_threshold
        self.baseline_stats: dict[str, dict[str, float]] = {}
        self.reference_samples: dict[str, list[float]] = {}
        self._load_baseline()

    def fit_reference(self, df_train: pd.DataFrame, numeric_features: list[str]):
        """Save training distribution reference statistics and quantiles."""
        self.reference_samples = {}
        self.baseline_stats = {}

        for col in numeric_features:
            if col in df_train.columns:
                series = pd.to_numeric(df_train[col], errors="coerce").dropna()
                if len(series) > 0:
                    self.baseline_stats[col] = {
                        "mean": float(series.mean()),
                        "std": float(series.std()),
                        "min": float(series.min()),
                        "p25": float(series.quantile(0.25)),
                        "median": float(series.median()),
                        "p75": float(series.quantile(0.75)),
                        "max": float(series.max()),
                    }
                    # Subsample reference for KS test
                    self.reference_samples[col] = series.sample(min(len(series), 300), random_state=42).tolist()

        os.makedirs(os.path.dirname(DRIFT_BASELINE_PATH), exist_ok=True)
        with open(DRIFT_BASELINE_PATH, "w") as f:
            json.dump({
                "baseline_stats": self.baseline_stats,
                "reference_samples": self.reference_samples,
            }, f)

    def _load_baseline(self):
        if os.path.exists(DRIFT_BASELINE_PATH):
            try:
                with open(DRIFT_BASELINE_PATH, "r") as f:
                    data = json.load(f)
                    self.baseline_stats = data.get("baseline_stats", {})
                    self.reference_samples = data.get("reference_samples", {})
            except Exception:
                pass

    def check_drift_single(self, raw_input: dict[str, Any]) -> dict[str, Any]:
        """Checks if a single prediction payload falls outside empirical training ranges or 3-sigma bounds.
        
        Performs formal out-of-distribution (OOD) detection based on empirical min/max envelopes
        and standardized residual distances from the Ames Housing training baseline.
        """
        drift_warnings = []
        messages = []

        feature_friendly_names = {
            "GrLivArea": "Above-grade living area",
            "TotalBsmtSF": "Basement area",
            "1stFlrSF": "First floor area",
            "2ndFlrSF": "Second floor area",
            "YearBuilt": "Construction year",
            "YearRemodAdd": "Remodel year",
            "OverallQual": "Overall material quality",
            "OverallCond": "Physical condition rating",
            "FullBath": "Full bathrooms",
            "HalfBath": "Half bathrooms",
            "BedroomAbvGr": "Bedrooms above grade",
            "TotRmsAbvGrd": "Total rooms above grade",
            "Fireplaces": "Fireplaces",
            "GarageCars": "Garage capacity",
            "GarageArea": "Garage area",
            "LotArea": "Lot area",
            "LotFrontage": "Lot frontage",
        }

        for feature, val in raw_input.items():
            if feature in self.baseline_stats and isinstance(val, (int, float)):
                stat = self.baseline_stats[feature]
                mean = stat["mean"]
                std = max(stat["std"], 1e-4)
                min_val = stat["min"]
                max_val = stat["max"]
                z_score = abs(val - mean) / std

                is_outside_envelope = val < min_val or val > max_val
                is_extreme_z = z_score > 3.0

                if is_outside_envelope or is_extreme_z:
                    friendly = feature_friendly_names.get(feature, feature)
                    severity = "High" if (z_score > 4.5 or is_outside_envelope) else "Moderate"
                    msg = (
                        f"{friendly} ({val:,.0f} vs training range {min_val:,.0f} to {max_val:,.0f}) is "
                        f"substantially outside the distribution observed in the Ames training data. "
                        f"The model estimate may be less reliable."
                    )
                    messages.append(msg)
                    drift_warnings.append({
                        "feature": feature,
                        "feature_label": friendly,
                        "value": val,
                        "expected_mean": round(mean, 2),
                        "expected_range": [round(min_val, 2), round(max_val, 2)],
                        "z_score": round(float(z_score), 2),
                        "severity": severity,
                        "warning_message": msg,
                    })

        is_ood = len(drift_warnings) > 0
        reliability_notice = (
            "The input differs substantially from the data used to train this model. "
            "Treat the estimate with additional caution."
        ) if is_ood else None

        return {
            "has_drift_warning": is_ood,
            "is_out_of_distribution": is_ood,
            "reliability_notice": reliability_notice,
            "warnings_count": len(drift_warnings),
            "anomalous_features": drift_warnings,
            "messages": messages,
        }

    def check_batch_drift(self, df_production: pd.DataFrame) -> dict[str, Any]:
        """Runs Kolmogorov-Smirnov test between batch inference features and training baseline."""
        drifted_features = []
        feature_reports = []

        for feature, ref_list in self.reference_samples.items():
            if feature in df_production.columns:
                prod_series = pd.to_numeric(df_production[feature], errors="coerce").dropna()
                if len(prod_series) >= 5:
                    ks_stat, p_val = stats.ks_2samp(ref_list, prod_series)
                    is_drifted = bool(p_val < self.p_value_threshold)
                    
                    rep = {
                        "feature": feature,
                        "ks_statistic": round(float(ks_stat), 4),
                        "p_value": round(float(p_val), 4),
                        "drift_detected": is_drifted,
                        "baseline_mean": round(float(np.mean(ref_list)), 2),
                        "production_mean": round(float(prod_series.mean()), 2),
                    }
                    feature_reports.append(rep)
                    if is_drifted:
                        drifted_features.append(rep)

        drift_share = len(drifted_features) / max(len(feature_reports), 1)
        return {
            "drift_detected": len(drifted_features) > 0,
            "drift_share_pct": round(drift_share * 100.0, 2),
            "total_tested_features": len(feature_reports),
            "drifted_features_count": len(drifted_features),
            "drifted_features": drifted_features,
            "all_features": feature_reports,
        }
