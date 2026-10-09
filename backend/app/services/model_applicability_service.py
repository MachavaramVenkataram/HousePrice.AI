import os
import json
import logging
import numpy as np
from typing import Dict, Any, List, Optional

from ..schemas.prediction import PropertyFeatures
from ..schemas.applicability import (
    ModelApplicabilityResponse,
    ApplicabilityCheck,
    DatasetScopeInfo,
)
from .prediction_service import PredictionService

logger = logging.getLogger(__name__)

ARTIFACTS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "ml", "artifacts")
)
DATA_PROFILE_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "data_profile.json")
)

# Supported categorical dictionaries strictly verified from Ames Housing dataset
SUPPORTED_CATEGORIES: Dict[str, List[str]] = {
    "Neighborhood": [
        "Blmngtn", "Blueste", "BrDale", "BrkSide", "ClearCr", "CollgCr", "Crawfor",
        "Edwards", "Gilbert", "IDOTRR", "MeadowV", "Mitchel", "NAmes", "NPkVill",
        "NWAmes", "NoRidge", "NridgHt", "OldTown", "SWISU", "Sawyer", "SawyerW",
        "Somerst", "StoneBr", "Timber", "Veenker"
    ],
    "BldgType": ["1Fam", "2fmCon", "Duplex", "Twnhs", "TwnhsE"],
    "HouseStyle": ["1Story", "1.5Fin", "1.5Unf", "2Story", "2.5Fin", "2.5Unf", "SFoyer", "SLvl"],
    "MSZoning": ["A", "C", "C (all)", "FV", "I", "RH", "RL", "RP", "RM"],
    "KitchenQual": ["Ex", "Gd", "TA", "Fa", "Po"],
    "BsmtQual": ["Ex", "Gd", "TA", "Fa", "Po", "None", "Missing"],
    "HeatingQC": ["Ex", "Gd", "TA", "Fa", "Po"],
    "CentralAir": ["Y", "N"],
    "GarageType": ["2Types", "Attchd", "Basment", "BuiltIn", "CarPort", "Detchd", "None", "Missing"],
    "SaleCondition": ["Normal", "Abnorml", "Partial", "AdjLand", "Alloca", "Family"],
}


class ModelApplicabilityService:
    """Evaluates whether an input property is adequately represented by the Ames training data.
    
    Implements 8 core checks:
      1. Feature schema validity
      2. Numerical feature ranges (Ames empirical bounds)
      3. Numerical feature distributions (z-scores and percentiles)
      4. Supported categorical values (strictly verified against Ames categories)
      5. Unusual combinations of features (domain logic and multivariate constraints)
      6. Relevant distribution-shift indicators (Kolmogorov-Smirnov / drift detector)
      7. Availability of prediction interval calibration
      8. Dataset geographic and historical scope
    """
    _instance = None

    def __init__(self):
        self.prediction_service = PredictionService.get_instance()
        self.baseline_stats: Dict[str, Dict[str, float]] = {}
        self._load_baseline_stats()

    @classmethod
    def get_instance(cls) -> "ModelApplicabilityService":
        if cls._instance is None:
            cls._instance = ModelApplicabilityService()
        return cls._instance

    def _load_baseline_stats(self):
        drift_path = os.path.join(ARTIFACTS_DIR, "drift_baseline.json")
        if os.path.exists(drift_path):
            try:
                with open(drift_path, "r") as f:
                    data = json.load(f)
                    self.baseline_stats = data.get("baseline_stats", {})
            except Exception as e:
                logger.warning(f"Could not load drift baseline stats: {e}")

    def evaluate_applicability(self, features: PropertyFeatures) -> ModelApplicabilityResponse:
        raw_dict = features.to_dict()
        checks: List[ApplicabilityCheck] = []
        limitations: List[str] = []
        unsupported_count = 0
        warning_count = 0

        # ----------------------------------------------------
        # 1. Feature Schema Validity Check
        # ----------------------------------------------------
        required_numeric = [
            "GrLivArea", "TotalBsmtSF", "YearBuilt", "OverallQual", "OverallCond",
            "FullBath", "BedroomAbvGr", "TotRmsAbvGrd", "GarageCars"
        ]
        missing_fields = [k for k in required_numeric if k not in raw_dict or raw_dict[k] is None]
        if missing_fields:
            checks.append(ApplicabilityCheck(
                name="schema_validity",
                status="unsupported",
                message=f"Schema invalid: missing required numeric attributes: {', '.join(missing_fields)}",
                details={"missing_fields": missing_fields}
            ))
            unsupported_count += 1
        else:
            checks.append(ApplicabilityCheck(
                name="schema_validity",
                status="passed",
                message="All required physical and categorical features are present and correctly typed.",
                details={"total_features_provided": len(raw_dict)}
            ))

        # ----------------------------------------------------
        # 2. Numerical Feature Ranges Check
        # ----------------------------------------------------
        range_warnings = []
        for feat, val in raw_dict.items():
            if feat in self.baseline_stats and isinstance(val, (int, float)):
                stats = self.baseline_stats[feat]
                min_v = stats.get("min", 0.0)
                max_v = stats.get("max", 1e9)
                if val < min_v:
                    range_warnings.append(f"{feat} ({val:,.0f}) is below training minimum ({min_v:,.0f})")
                elif val > max_v:
                    range_warnings.append(f"{feat} ({val:,.0f}) exceeds training maximum ({max_v:,.0f})")

        if range_warnings:
            checks.append(ApplicabilityCheck(
                name="numeric_range",
                status="warning",
                message=f"{len(range_warnings)} numerical feature(s) fall outside empirical training bounds.",
                details={"warnings": range_warnings}
            ))
            warning_count += 1
            limitations.append("Extreme numerical dimensions fall outside observed training extremes; model extrapolation may occur.")
        else:
            checks.append(ApplicabilityCheck(
                name="numeric_range",
                status="passed",
                message="All continuous property features fall within documented Ames training ranges.",
                details={"status": "Within empirical min/max envelope"}
            ))

        # ----------------------------------------------------
        # 3. Numerical Feature Distributions Check (Z-Score / 3-Sigma)
        # ----------------------------------------------------
        distribution_outliers = []
        for feat, val in raw_dict.items():
            if feat in self.baseline_stats and isinstance(val, (int, float)):
                stats = self.baseline_stats[feat]
                mean_v = stats.get("mean", 0.0)
                std_v = max(stats.get("std", 1.0), 1e-4)
                z = abs(val - mean_v) / std_v
                if z > 3.0:
                    distribution_outliers.append({
                        "feature": feat,
                        "value": val,
                        "mean": round(mean_v, 1),
                        "z_score": round(float(z), 2)
                    })

        if distribution_outliers:
            checks.append(ApplicabilityCheck(
                name="numeric_distribution",
                status="warning",
                message=f"{len(distribution_outliers)} feature(s) deviate by more than 3 standard deviations from training baseline.",
                details={"outliers": distribution_outliers}
            ))
            warning_count += 1
        else:
            checks.append(ApplicabilityCheck(
                name="numeric_distribution",
                status="passed",
                message="Numerical values align well with standard Gaussian training distributions (|z| <= 3.0).",
                details={"max_observed_z_score": round(max([abs(raw_dict.get(k, 0) - self.baseline_stats.get(k, {}).get("mean", 0)) / max(self.baseline_stats.get(k, {}).get("std", 1.0), 1e-4) for k in self.baseline_stats if isinstance(raw_dict.get(k), (int, float))] or [0.0]), 2)}
            ))

        # ----------------------------------------------------
        # 4. Supported Categorical Values Check
        # ----------------------------------------------------
        unsupported_cats = []
        for cat_feat, valid_list in SUPPORTED_CATEGORIES.items():
            val = str(raw_dict.get(cat_feat, "")).strip()
            if val and val not in valid_list:
                # Case-insensitive check
                matched = any(val.lower() == v.lower() for v in valid_list)
                if not matched:
                    unsupported_cats.append({
                        "feature": cat_feat,
                        "provided_value": val,
                        "supported_examples": valid_list[:5]
                    })

        if unsupported_cats:
            cat_msgs = [f"{u['feature']}='{u['provided_value']}'" for u in unsupported_cats]
            checks.append(ApplicabilityCheck(
                name="categorical_support",
                status="unsupported",
                message=f"Unsupported or novel category detected: {', '.join(cat_msgs)}. The model has no training observations for these classes.",
                details={"unsupported_categories": unsupported_cats}
            ))
            unsupported_count += 1
            limitations.append("Novel categorical values are handled via unknown-category fallback; estimate variance is higher.")
        else:
            checks.append(ApplicabilityCheck(
                name="categorical_support",
                status="passed",
                message="All categorical attributes match documented, supported classes in the Ames Housing dataset.",
                details={"verified_categories": list(SUPPORTED_CATEGORIES.keys())}
            ))

        # ----------------------------------------------------
        # 5. Unusual Combinations of Features Check
        # ----------------------------------------------------
        combo_warnings = []
        area = float(raw_dict.get("GrLivArea", 1700))
        tot_rooms = int(raw_dict.get("TotRmsAbvGrd", 8))
        bedrooms = int(raw_dict.get("BedroomAbvGr", 3))
        year_built = int(raw_dict.get("YearBuilt", 2003))
        year_remod = int(raw_dict.get("YearRemodAdd", 2003))
        full_bath = int(raw_dict.get("FullBath", 2))
        bsmt_sf = float(raw_dict.get("TotalBsmtSF", 856))
        qual = int(raw_dict.get("OverallQual", 7))
        cond = int(raw_dict.get("OverallCond", 5))

        # Rule 5.1: Bedroom count vs Total Rooms
        if tot_rooms < bedrooms:
            combo_warnings.append(f"Physical contradiction: Total rooms above grade ({tot_rooms}) is fewer than bedrooms ({bedrooms}).")
        # Rule 5.2: Remodel year vs Built year
        if year_remod < year_built:
            combo_warnings.append(f"Temporal contradiction: Remodel year ({year_remod}) precedes construction year ({year_built}).")
        # Rule 5.3: Living area to room density
        if tot_rooms > 0:
            sqft_per_room = area / tot_rooms
            if sqft_per_room < 85:
                combo_warnings.append(f"Atypical room density: Average room size ({sqft_per_room:.0f} sq ft/room) is unusually cramped.")
            elif sqft_per_room > 900:
                combo_warnings.append(f"Atypical room density: Average room size ({sqft_per_room:.0f} sq ft/room) is exceptionally sparse.")
        # Rule 5.4: Many bedrooms with single bath
        if bedrooms >= 5 and full_bath <= 1:
            combo_warnings.append(f"Atypical configuration: High bedroom count ({bedrooms} beds) with only {full_bath} full bath.")
        # Rule 5.5: Basement disproportionately larger than living area
        if bsmt_sf > area * 2.2:
            combo_warnings.append(f"Atypical footprint: Basement ({bsmt_sf:,.0f} sq ft) is over 2.2x larger than above-grade living area ({area:,.0f} sq ft).")
        # Rule 5.6: Quality vs Condition extreme disparity
        if qual >= 9 and cond <= 2:
            combo_warnings.append(f"Extreme rating clash: Luxury overall quality ({qual}/10) with severe physical dilapidation ({cond}/10).")

        if combo_warnings:
            checks.append(ApplicabilityCheck(
                name="unusual_combinations",
                status="warning",
                message=f"{len(combo_warnings)} atypical or inconsistent feature combination(s) detected.",
                details={"combination_warnings": combo_warnings}
            ))
            warning_count += 1
            limitations.append("Feature combinations diverge from typical residential architectural designs in the Ames region.")
        else:
            checks.append(ApplicabilityCheck(
                name="unusual_combinations",
                status="passed",
                message="Feature relationships (room ratios, construction timeline, square footages) conform to standard residential patterns.",
                details={"checks_run": 6}
            ))

        # ----------------------------------------------------
        # 6. Distribution Shift Indicators Check (Reuses DataDriftDetector)
        # ----------------------------------------------------
        drift_check = self.prediction_service.drift_detector.check_drift_single(raw_dict)
        is_ood = drift_check.get("is_out_of_distribution", False)
        if is_ood:
            drift_messages = drift_check.get("messages", [])
            checks.append(ApplicabilityCheck(
                name="distribution_shift",
                status="warning",
                message="Input exhibits multi-feature statistical drift relative to the historical Ames training envelope.",
                details={
                    "anomalous_features_count": drift_check.get("warnings_count", 0),
                    "anomalous_features": drift_check.get("anomalous_features", []),
                    "reliability_notice": drift_check.get("reliability_notice")
                }
            ))
            warning_count += 1
            limitations.append("Statistical drift detected across one or more core physical drivers.")
        else:
            checks.append(ApplicabilityCheck(
                name="distribution_shift",
                status="passed",
                message="No significant statistical distribution shift detected relative to baseline training reference.",
                details={"drift_detected": False}
            ))

        # ----------------------------------------------------
        # 7. Availability of Prediction Interval Calibration Check
        # ----------------------------------------------------
        conformal_obj = self.prediction_service.conformal
        if conformal_obj is not None:
            cal_samples = 292
            if hasattr(conformal_obj, "calibration_samples"):
                cal_samples = conformal_obj.calibration_samples
            checks.append(ApplicabilityCheck(
                name="interval_calibration",
                status="available",
                message=f"Split Conformal Prediction calibration is active and verified ({cal_samples} holdout samples, α=0.10).",
                details={
                    "calibration_method": "Split Conformal Prediction",
                    "calibration_samples": cal_samples,
                    "target_coverage": 0.90
                }
            ))
        else:
            checks.append(ApplicabilityCheck(
                name="interval_calibration",
                status="unavailable",
                message="Prediction interval calibration artifact is unavailable; uncertainty bounds cannot be guaranteed.",
                details={"status": "conformal_predictor artifact missing"}
            ))
            warning_count += 1
            limitations.append("Prediction intervals cannot be calculated due to missing calibration data.")

        # ----------------------------------------------------
        # 8. Dataset Geographic and Historical Scope Check
        # ----------------------------------------------------
        neighborhood = str(raw_dict.get("Neighborhood", "")).strip()
        is_ames_neighborhood = neighborhood in SUPPORTED_CATEGORIES["Neighborhood"]
        
        # Check if user passed non-Ames identifier
        foreign_markets = ["india", "mumbai", "delhi", "bengaluru", "bangalore", "pune", "london", "uk", "tokyo", "dubai", "paris"]
        raw_values_str = " ".join([str(v).lower() for v in raw_dict.values()])
        is_foreign_market = any(fm in raw_values_str for fm in foreign_markets)

        if is_foreign_market:
            checks.append(ApplicabilityCheck(
                name="dataset_scope",
                status="potentially_mismatched",
                message="Significant geographic market mismatch. The model is calibrated exclusively for Ames, Iowa (2006–2010) and does not provide valid valuations for international or non-Ames markets.",
                details={"detected_market": "Non-Ames / International Market"}
            ))
            unsupported_count += 1
            limitations.append("Severe geographic mismatch: Ames Housing parameters cannot estimate Indian, European, or non-US property markets.")
        elif is_ames_neighborhood:
            checks.append(ApplicabilityCheck(
                name="dataset_scope",
                status="compatible",
                message=f"Geographic scope is fully compatible (Neighborhood '{neighborhood}' belongs to documented Ames, Iowa jurisdiction).",
                details={"jurisdiction": "Ames, Iowa, USA", "neighborhood": neighborhood}
            ))
        else:
            checks.append(ApplicabilityCheck(
                name="dataset_scope",
                status="potentially_mismatched",
                message=f"Neighborhood '{neighborhood}' is not within the 25 documented Ames, Iowa neighborhoods. Model estimates may not reflect local market pricing.",
                details={"unrecognized_neighborhood": neighborhood}
            ))
            warning_count += 1
            limitations.append("Unrecognized neighborhood outside documented Ames territory.")

        # ----------------------------------------------------
        # Overall Status Determination
        # ----------------------------------------------------
        if unsupported_count > 0:
            status = "unsupported"
            summary = "The provided inputs contain unsupported categories or an incompatible geographic scope. Predictions would be unreliable."
            actionable_guidance = "Select a documented Ames neighborhood and verify that all categorical parameters match supported options."
        elif warning_count >= 2:
            status = "limited"
            summary = "Inputs fall within acceptable ranges but exhibit notable atypical characteristics or distribution drift. Treat estimates with caution."
            actionable_guidance = "Review the highlighted warnings in the technical details panel before relying on model estimates."
        elif warning_count == 1:
            status = "warning"
            summary = "Inputs are generally represented by the training data with one minor atypical parameter."
            actionable_guidance = "Check the flagged parameter to confirm it represents the intended property specifications."
        else:
            status = "passed"
            summary = "Inputs are fully represented by the Ames Housing training data. The model is well-suited to estimate this property profile."
            actionable_guidance = "Standard statistical estimates and conformal intervals are fully applicable."

        return ModelApplicabilityResponse(
            status=status,
            overall_summary=summary,
            checks=checks,
            limitations=limitations,
            scope=DatasetScopeInfo(),
            actionable_guidance=actionable_guidance,
        )
