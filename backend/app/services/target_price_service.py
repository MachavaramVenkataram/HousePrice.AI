import os
import copy
import logging
from typing import Dict, Any, List, Optional

from ..schemas.prediction import PropertyFeatures, PredictionInterval
from ..schemas.target_price import (
    TargetPriceRequest,
    TargetPriceResponse,
    TargetPriceScenario,
    ChangedFeatureItem,
    FeatureConstraint,
)
from .prediction_service import PredictionService
from .model_applicability_service import ModelApplicabilityService, SUPPORTED_CATEGORIES

logger = logging.getLogger(__name__)

# Feature human-readable labels and units
FEATURE_METADATA = {
    "GrLivArea": {"label": "Above-Grade Living Area", "unit": "sq ft", "scale": 500.0, "min": 600, "max": 4500, "step": 100},
    "OverallQual": {"label": "Overall Quality", "unit": "/10", "scale": 1.4, "min": 3, "max": 10, "step": 1},
    "OverallCond": {"label": "Overall Condition", "unit": "/10", "scale": 1.1, "min": 3, "max": 9, "step": 1},
    "BedroomAbvGr": {"label": "Bedrooms Above Grade", "unit": "beds", "scale": 0.8, "min": 1, "max": 6, "step": 1},
    "FullBath": {"label": "Full Bathrooms", "unit": "baths", "scale": 0.6, "min": 1, "max": 4, "step": 1},
    "HalfBath": {"label": "Half Bathrooms", "unit": "baths", "scale": 0.5, "min": 0, "max": 2, "step": 1},
    "GarageCars": {"label": "Garage Capacity", "unit": "cars", "scale": 0.8, "min": 0, "max": 4, "step": 1},
    "TotalBsmtSF": {"label": "Total Basement Area", "unit": "sq ft", "scale": 450.0, "min": 0, "max": 3000, "step": 100},
    "YearBuilt": {"label": "Construction Year", "unit": "yr", "scale": 30.0, "min": 1920, "max": 2010, "step": 5},
    "Neighborhood": {"label": "Neighborhood", "unit": "", "scale": 1.0},
    "KitchenQual": {"label": "Kitchen Quality", "unit": "", "scale": 1.0},
    "Fireplaces": {"label": "Fireplaces", "unit": "fireplaces", "scale": 0.7, "min": 0, "max": 3, "step": 1},
}

NEIGHBORHOOD_TIERS = {
    "Affordable": ["OldTown", "Edwards", "NAmes", "BrkSide", "IDOTRR", "MeadowV"],
    "Mid-Range": ["CollgCr", "Gilbert", "SawyerW", "NWAmes", "Mitchel", "Crawfor"],
    "Premium": ["NridgHt", "NoRidge", "StoneBr", "Somerst", "Timber", "Veenker"],
}


class TargetPriceService:
    """Explores candidate property feature combinations that produce model estimates close to a user target price.
    
    Uses the real, pre-trained regression pipeline without modifying or retraining models.
    Supports objectives:
      - 'closest_target': Minimizes |model_estimate - user_target|
      - 'smallest_feature_changes': Minimizes normalized feature change penalty
      - 'balanced': Joint objective balancing closeness to target and minimal disruption
    """
    _instance = None

    def __init__(self):
        self.prediction_service = PredictionService.get_instance()
        self.applicability_service = ModelApplicabilityService.get_instance()

    @classmethod
    def get_instance(cls) -> "TargetPriceService":
        if cls._instance is None:
            cls._instance = TargetPriceService()
        return cls._instance

    def search_target_scenarios(self, request: TargetPriceRequest) -> TargetPriceResponse:
        target = float(request.target_price)
        base_features = request.starting_features
        base_dict = base_features.to_dict()

        # 1. Feasibility Bounds Verification
        # Ames dataset observed prices range from $34,900 to $755,000 (mean $180,921).
        if target < 35000 or target > 850000:
            return TargetPriceResponse(
                target_amount=target,
                objective=request.objective,
                objective_explanation="Feasibility Check: Target price is outside the empirical training distribution.",
                scenarios=[],
                feasible_count=0,
                explanation=(
                    f"Target price ${target:,.2f} is outside the empirical range of the Ames Housing dataset ($34,900 – $755,000). "
                    f"The trained models cannot extrapolate reliably to this price point without violating physical domain constraints."
                ),
            )

        # 2. Determine Allowed Features to Vary
        changeable = request.changeable_features
        if not changeable:
            changeable = ["GrLivArea", "OverallQual", "BedroomAbvGr", "FullBath", "GarageCars", "TotalBsmtSF", "YearBuilt", "Neighborhood"]

        constraints = request.feature_constraints or {}

        # 3. Base Initial Prediction
        try:
            base_pred_resp = self.prediction_service.predict(base_features)
            base_price = float(base_pred_resp.predicted_price)
        except Exception as e:
            logger.error(f"Base prediction failed: {e}")
            base_price = 180000.0

        # Ratio of target to current base price gives guidance on scaling
        price_ratio = target / max(base_price, 10000.0)

        # 4. Generate Structured Candidate Configurations
        candidates: List[Dict[str, Any]] = []

        # Candidate Strategy A: Proportional Scaling on Space & Quality
        # Vary living area and overall quality along an empirical path
        area_step_grid = [0.70, 0.85, 1.0, 1.15, 1.30, 1.50, 1.70]
        qual_delta_grid = [-2, -1, 0, 1, 2, 3]

        for a_mult in area_step_grid:
            for q_delta in qual_delta_grid:
                cand = copy.deepcopy(base_dict)
                # Adjust Area
                if "GrLivArea" in changeable:
                    new_area = round(base_dict.get("GrLivArea", 1600) * a_mult, -1)
                    new_area = max(600, min(4200, new_area))
                    if "GrLivArea" in constraints:
                        c = constraints["GrLivArea"]
                        if c.min_value: new_area = max(new_area, c.min_value)
                        if c.max_value: new_area = min(new_area, c.max_value)
                    cand["GrLivArea"] = float(new_area)
                    # Keep 1stFlrSF and 2ndFlrSF consistent
                    cand["1stFlrSF"] = round(new_area * 0.6)
                    cand["2ndFlrSF"] = round(new_area * 0.4)

                # Adjust Quality
                if "OverallQual" in changeable:
                    new_qual = int(base_dict.get("OverallQual", 7) + q_delta)
                    new_qual = max(3, min(10, new_qual))
                    if "OverallQual" in constraints:
                        c = constraints["OverallQual"]
                        if c.min_value: new_qual = max(new_qual, int(c.min_value))
                        if c.max_value: new_qual = min(new_qual, int(c.max_value))
                    cand["OverallQual"] = new_qual

                # Adjust Basement proportionally if allowed
                if "TotalBsmtSF" in changeable:
                    new_bsmt = round(cand.get("GrLivArea", 1600) * 0.55, -1)
                    cand["TotalBsmtSF"] = float(max(0, min(2500, new_bsmt)))

                # Keep room counts consistent with living area
                cand["TotRmsAbvGrd"] = max(4, min(14, round(cand["GrLivArea"] / 240)))
                cand["BedroomAbvGr"] = max(1, min(cand["TotRmsAbvGrd"] - 2, cand.get("BedroomAbvGr", 3)))
                candidates.append(cand)

        # Candidate Strategy B: Amenity & Quality Driven (Garage + Bathrooms + Quality)
        for g_cars in [0, 1, 2, 3]:
            for f_bath in [1, 2, 3]:
                cand = copy.deepcopy(base_dict)
                if "GarageCars" in changeable:
                    cand["GarageCars"] = g_cars
                    cand["GarageArea"] = float(g_cars * 240)
                if "FullBath" in changeable:
                    cand["FullBath"] = f_bath
                if "OverallQual" in changeable:
                    target_q = 8 if target > 240000 else (5 if target < 140000 else 6)
                    cand["OverallQual"] = target_q
                if "GrLivArea" in changeable:
                    cand["GrLivArea"] = float(round(base_dict.get("GrLivArea", 1600) * (price_ratio ** 0.5), -1))
                    cand["GrLivArea"] = max(700, min(3800, cand["GrLivArea"]))
                    cand["1stFlrSF"] = round(cand["GrLivArea"] * 0.6)
                    cand["2ndFlrSF"] = round(cand["GrLivArea"] * 0.4)
                cand["TotRmsAbvGrd"] = max(4, min(12, round(cand["GrLivArea"] / 240)))
                candidates.append(cand)

        # Candidate Strategy C: Neighborhood Sub-market Switching
        if "Neighborhood" in changeable:
            neigh_target_list = NEIGHBORHOOD_TIERS["Premium"] if target >= 250000 else (
                NEIGHBORHOOD_TIERS["Affordable"] if target <= 150000 else NEIGHBORHOOD_TIERS["Mid-Range"]
            )
            for neigh in neigh_target_list:
                cand = copy.deepcopy(base_dict)
                cand["Neighborhood"] = neigh
                if "OverallQual" in changeable:
                    cand["OverallQual"] = min(10, max(4, int(base_dict.get("OverallQual", 7) + (1 if target > base_price else -1))))
                if "GrLivArea" in changeable:
                    cand["GrLivArea"] = float(round(base_dict.get("GrLivArea", 1600) * (price_ratio ** 0.4), -1))
                    cand["GrLivArea"] = max(750, min(3600, cand["GrLivArea"]))
                    cand["1stFlrSF"] = round(cand["GrLivArea"] * 0.6)
                    cand["2ndFlrSF"] = round(cand["GrLivArea"] * 0.4)
                cand["TotRmsAbvGrd"] = max(4, min(12, round(cand["GrLivArea"] / 240)))
                candidates.append(cand)

        # Candidate Strategy D: Targeted Fine-Tuning Grid on Living Area
        # Interpolate a targeted area using historical median price per sq ft ($120/sq ft)
        approx_target_area = max(650, min(4000, round((target / 120.0), -1)))
        for area_offset in [-300, -150, 0, 150, 300]:
            cand = copy.deepcopy(base_dict)
            if "GrLivArea" in changeable:
                tuned_area = float(max(600, min(4200, approx_target_area + area_offset)))
                cand["GrLivArea"] = tuned_area
                cand["1stFlrSF"] = round(tuned_area * 0.6)
                cand["2ndFlrSF"] = round(tuned_area * 0.4)
                cand["TotalBsmtSF"] = round(tuned_area * 0.5)
                cand["TotRmsAbvGrd"] = max(4, min(12, round(tuned_area / 240)))
                cand["BedroomAbvGr"] = max(1, min(cand["TotRmsAbvGrd"] - 2, cand.get("BedroomAbvGr", 3)))
            candidates.append(cand)

        # 5. Evaluate All Candidates with the Real Inference Pipeline
        evaluated_scenarios: List[TargetPriceScenario] = []
        seen_keys = set()

        for cand_dict in candidates:
            # Build unique key to avoid duplicates
            key = f"{cand_dict.get('GrLivArea')}_{cand_dict.get('OverallQual')}_{cand_dict.get('Neighborhood')}_{cand_dict.get('GarageCars')}_{cand_dict.get('FullBath')}_{cand_dict.get('TotalBsmtSF')}"
            if key in seen_keys:
                continue
            seen_keys.add(key)

            try:
                cand_features = PropertyFeatures(**cand_dict)
            except Exception:
                continue

            # Run inference through real PredictionService
            try:
                pred_resp = self.prediction_service.predict(cand_features)
                pred_price = float(pred_resp.predicted_price)
            except Exception:
                continue

            diff = pred_price - target
            abs_diff = abs(diff)
            pct_diff = (abs_diff / target) * 100.0

            # Compute Changed Features List
            changed_items: List[ChangedFeatureItem] = []
            feature_change_penalty = 0.0

            for feat, new_val in cand_dict.items():
                orig_val = base_dict.get(feat)
                if orig_val != new_val:
                    meta = FEATURE_METADATA.get(feat, {"label": feat, "unit": "", "scale": 1.0})
                    delta_val = None
                    if isinstance(new_val, (int, float)) and isinstance(orig_val, (int, float)):
                        delta_val = float(new_val - orig_val)
                        scale = meta.get("scale", 1.0)
                        feature_change_penalty += (abs(delta_val) / scale) ** 2
                    else:
                        feature_change_penalty += 3.0  # categorical change penalty

                    changed_items.append(ChangedFeatureItem(
                        feature=feat,
                        feature_label=meta.get("label", feat),
                        original_value=orig_val,
                        new_value=new_val,
                        delta=delta_val,
                        unit=meta.get("unit", ""),
                    ))

            # Calculate Objective Score
            rel_price_error = abs_diff / target
            if request.objective == "closest_target":
                obj_score = abs_diff
            elif request.objective == "smallest_feature_changes":
                # Heavy penalty on changing features, require estimate to be reasonably close (<= 8%)
                closeness_penalty = max(0.0, (rel_price_error - 0.08) * 50.0)
                obj_score = feature_change_penalty + closeness_penalty
            else:  # "balanced"
                obj_score = (rel_price_error * 100.0) * 0.6 + (feature_change_penalty ** 0.5) * 0.4

            # Run Applicability Check
            app_resp = self.applicability_service.evaluate_applicability(cand_features)
            app_warnings = [c.message for c in app_resp.checks if c.status in ["warning", "unsupported"]]

            scenario_id = f"scenario-{len(evaluated_scenarios) + 1}"
            headline = self._generate_headline(changed_items, pred_price, target)

            evaluated_scenarios.append(TargetPriceScenario(
                id=scenario_id,
                name=headline,
                features=cand_features,
                predicted_price=round(pred_price, 2),
                prediction_interval=pred_resp.prediction_interval,
                difference_from_target=round(diff, 2),
                absolute_difference=round(abs_diff, 2),
                percentage_difference=round(pct_diff, 2),
                changed_features=changed_items,
                changed_count=len(changed_items),
                model_name=pred_resp.model.name if hasattr(pred_resp.model, "name") else str(pred_resp.model),
                model_version=pred_resp.model_version,
                objective_score=round(obj_score, 4),
                applicability_status=app_resp.status,
                applicability_warnings=app_warnings,
            ))

        # 6. Filter & Rank Scenarios
        # Keep scenarios within reasonable boundary of target (e.g. within 15% delta if available)
        reasonable = [s for s in evaluated_scenarios if s.percentage_difference <= 15.0]
        if not reasonable:
            reasonable = evaluated_scenarios

        # Sort by selected objective score
        reasonable.sort(key=lambda s: s.objective_score)

        # Select top diverse scenarios
        final_scenarios = reasonable[:request.max_scenarios]

        # Re-number IDs
        for idx, sc in enumerate(final_scenarios):
            sc.id = f"scenario-{idx + 1}"

        obj_explanations = {
            "closest_target": "Minimizes the absolute dollar difference between the model price estimate and the target budget (|predicted_price - target|).",
            "smallest_feature_changes": "Minimizes normalized deviations from starting property specifications while constraining estimates within close proximity of target.",
            "balanced": "Balances closeness to target budget (60% weight) with minimal disruption to original property architecture (40% weight).",
        }

        explanation = None
        if not final_scenarios:
            explanation = f"No feasible property combinations could be found that produce an estimate within acceptable proximity of ${target:,.2f} under the active constraints."

        return TargetPriceResponse(
            target_amount=target,
            objective=request.objective,
            objective_explanation=obj_explanations.get(request.objective, "Evaluated with documented optimization objective."),
            scenarios=final_scenarios,
            feasible_count=len(final_scenarios),
            explanation=explanation,
        )

    def _generate_headline(self, changed_items: List[ChangedFeatureItem], pred_price: float, target: float) -> str:
        names = [item.feature for item in changed_items]
        if "GrLivArea" in names and "OverallQual" in names:
            return "Living Area & Material Quality Optimization"
        elif "Neighborhood" in names:
            return "Neighborhood Location & Dimension Realignment"
        elif "OverallQual" in names:
            return "Quality Grade & Finish Recalibration"
        elif "GarageCars" in names or "FullBath" in names:
            return "Amenity & Capacity Rebalance"
        elif "GrLivArea" in names:
            return "Floor Area & Room Footprint Adjustment"
        return "Feasible Property Configuration"
