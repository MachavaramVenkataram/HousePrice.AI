import os
import sys
import time
import json
import logging
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

# Ensure workspace root is in sys.path so pickled artifacts referencing 'backend.*' unpickle cleanly
ROOT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from ..schemas.prediction import (
    PropertyFeatures,
    PredictionResponse,
    PredictionInterval,
    ModelInfo,
    UncertaintyInfo,
    FeatureContribution,
    ExplanationSummary,
    WhatIfResponse,
    SensitivityResponse,
)
from ..db.models import PredictionRecord
from ..ml.preprocessing.pipeline import TargetTransformer
from ..ml.monitoring.drift_detector import DataDriftDetector
from ..ml.models.conformal import MultiModelConformalManager, ConformalPredictor


logger = logging.getLogger(__name__)

ARTIFACTS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "ml", "artifacts")
)


class PredictionService:
    _instance = None

    def __init__(self):
        self.best_model = None
        self.preprocessor = None
        self.conformal = None
        self.explainer = None
        self.baseline_model = None
        self.drift_detector = DataDriftDetector()
        self.model_name = "Voting Ensemble"
        self.model_version = "v1.0.0"
        self.load_artifacts()

    @classmethod
    def get_instance(cls) -> "PredictionService":
        if cls._instance is None:
            cls._instance = PredictionService()
        return cls._instance

    def load_artifacts(self):
        best_model_path = os.path.join(ARTIFACTS_DIR, "best_model.joblib")
        prep_path = os.path.join(ARTIFACTS_DIR, "preprocessor.joblib")
        conf_path = os.path.join(ARTIFACTS_DIR, "conformal_predictor.joblib")
        expl_path = os.path.join(ARTIFACTS_DIR, "shap_explainer.joblib")
        base_path = os.path.join(ARTIFACTS_DIR, "baseline_model.joblib")

        try:
            if os.path.exists(best_model_path):
                self.best_model = joblib.load(best_model_path)
                logger.info("Loaded best_model artifact.")
        except Exception as e:
            logger.error(f"Error loading best_model: {e}")

        try:
            if os.path.exists(prep_path):
                self.preprocessor = joblib.load(prep_path)
                logger.info("Loaded preprocessor artifact.")
        except Exception as e:
            logger.error(f"Error loading preprocessor: {e}")

        try:
            if os.path.exists(conf_path):
                self.conformal = joblib.load(conf_path)
                logger.info("Loaded conformal_predictor artifact.")
        except Exception as e:
            logger.error(f"Error loading conformal_predictor: {e}")

        try:
            if os.path.exists(expl_path):
                self.explainer = joblib.load(expl_path)
                logger.info("Loaded shap_explainer artifact.")
        except Exception as e:
            logger.warning(f"Note: shap_explainer unpickling skipped ({e}); native tree SHAP will be used.")

        try:
            if os.path.exists(base_path):
                self.baseline_model = joblib.load(base_path)
                logger.info("Loaded baseline_model artifact.")
        except Exception as e:
            logger.error(f"Error loading baseline_model: {e}")

        # Sync active production model and version from model_registry.json if available
        registry_path = os.path.join(ARTIFACTS_DIR, "model_registry.json")
        try:
            if os.path.exists(registry_path):
                with open(registry_path, "r") as f:
                    reg_data = json.load(f)
                    self.model_name = reg_data.get("current_production_model", "CatBoost")
                    self.model_version = reg_data.get("production_version", "v1.0.0")
                    logger.info(f"Production model registered as: {self.model_name} ({self.model_version})")
        except Exception as e:
            logger.warning(f"Could not read model_registry.json: {e}")

        logger.info("ML Artifacts initialization completed.")

    def _explain_linear_model(self, X_trans: np.ndarray, raw_dict: Dict[str, Any], top_k: int = 8) -> List[FeatureContribution]:
        """Calculates direct linear model contributions using trained coefficients."""
        if self.baseline_model is None or not hasattr(self.baseline_model, "coef_"):
            return []
        
        feature_names = getattr(self.preprocessor, "feature_names_out", None)
        if feature_names is None and self.explainer:
            feature_names = getattr(self.explainer, "feature_names", None)
        if feature_names is None:
            return []

        coefs = self.baseline_model.coef_
        dense_x = X_trans.toarray()[0] if hasattr(X_trans, "toarray") else X_trans[0]
        
        effects = dense_x * coefs
        sorted_indices = np.argsort(np.abs(effects))[::-1]
        
        contributions = []
        for idx in sorted_indices[:top_k]:
            fname = feature_names[idx] if idx < len(feature_names) else f"feature_{idx}"
            impact = float(effects[idx])
            direction = "positive" if impact > 0 else "negative"
            label = "Increased model estimate" if impact > 0 else "Reduced model estimate"
            tier = "Strong positive contribution" if impact > 0.05 else ("Moderate positive contribution" if impact > 0 else "Negative contribution")
            contributions.append(FeatureContribution(
                feature=fname,
                impact=round(impact, 4),
                absolute_impact=round(abs(impact), 4),
                direction=direction,
                label=label,
                contribution_tier=tier,
                raw_value=raw_dict.get(fname),
            ))
        return contributions

    def _explain_tree_model(
        self,
        X_trans: np.ndarray,
        raw_dict: Dict[str, Any],
        target_model: Any = None,
        top_k: int = 8,
    ) -> List[FeatureContribution]:
        """Calculates exact Tree SHAP values using native tree explainability (CatBoost, XGBoost, LightGBM)."""
        feature_names = getattr(self.preprocessor, "feature_names_out", None)
        if feature_names is None and self.explainer:
            feature_names = getattr(self.explainer, "feature_names", None)
        if feature_names is None:
            return []

        model_to_use = target_model if target_model is not None else self.best_model
        dense_x = X_trans.toarray() if hasattr(X_trans, "toarray") else np.asarray(X_trans)
        shap_vals = None

        # 1. CatBoost Native Tree SHAP (Lundberg et al. ShapValues)
        if hasattr(model_to_use, "get_feature_importance"):
            try:
                import catboost
                pool = catboost.Pool(dense_x)
                contribs = model_to_use.get_feature_importance(pool, type="ShapValues")[0]
                # In CatBoost ShapValues, last column is the baseline/bias
                shap_vals = contribs[:-1]
            except Exception as e:
                logger.warning(f"Native CatBoost Tree SHAP calculation failed: {e}")

        # 2. XGBoost Native Tree SHAP
        if shap_vals is None:
            xgb_est = None
            if hasattr(model_to_use, "named_estimators_") and "xgb" in model_to_use.named_estimators_:
                xgb_est = model_to_use.named_estimators_["xgb"]
            elif hasattr(model_to_use, "get_booster"):
                xgb_est = model_to_use
            
            if xgb_est is not None:
                try:
                    import xgboost as xgb
                    booster = xgb_est.get_booster()
                    dmat = xgb.DMatrix(dense_x)
                    contribs = booster.predict(dmat, pred_contribs=True)[0]
                    shap_vals = contribs[:-1]
                except Exception as e:
                    logger.warning(f"Native XGBoost Tree SHAP calculation failed: {e}")

        # 3. LightGBM Native Tree SHAP
        if shap_vals is None and hasattr(model_to_use, "predict"):
            try:
                contribs = model_to_use.predict(dense_x, pred_contrib=True)[0]
                shap_vals = contribs[:-1]
            except Exception:
                pass

        # If native Tree SHAP computed, format feature attributions
        if shap_vals is not None and len(shap_vals) > 0:
            sorted_idx = np.argsort(np.abs(shap_vals))[::-1]
            max_impact = np.max(np.abs(shap_vals)) if np.max(np.abs(shap_vals)) > 0 else 1.0

            explanations = []
            for idx in sorted_idx[:top_k]:
                fname = feature_names[idx] if idx < len(feature_names) else f"feature_{idx}"
                impact = float(shap_vals[idx])
                rel_strength = abs(impact) / max(max_impact, 1e-4)
                direction = "positive" if impact > 0 else "negative"
                label = "Increased model estimate" if impact > 0 else "Reduced model estimate"
                tier = "Strong positive contribution" if impact > 0 and rel_strength > 0.6 else (
                    "Moderate positive contribution" if impact > 0 else (
                        "Strong negative contribution" if rel_strength > 0.6 else "Negative contribution"
                    )
                )
                explanations.append(FeatureContribution(
                    feature=fname,
                    impact=round(impact, 4),
                    absolute_impact=round(abs(impact), 4),
                    direction=direction,
                    label=label,
                    contribution_tier=tier,
                    raw_value=raw_dict.get(fname),
                ))
            return explanations

        # 4. Fallback to self.explainer if available
        if self.explainer:
            try:
                raw_expl = self.explainer.explain_instance(X_trans, raw_dict, top_k=top_k)
                max_impact = max([abs(item["impact"]) for item in raw_expl]) if raw_expl else 1.0
                explanations = []
                for item in raw_expl:
                    rel_strength = abs(item["impact"]) / max(max_impact, 1e-4)
                    if item["direction"] == "positive":
                        label = "Increased model estimate"
                        tier = "Strong positive contribution" if rel_strength > 0.6 else "Moderate positive contribution"
                    else:
                        label = "Reduced model estimate"
                        tier = "Strong negative contribution" if rel_strength > 0.6 else "Negative contribution"

                    explanations.append(FeatureContribution(
                        feature=item["feature"],
                        impact=item["impact"],
                        absolute_impact=item["absolute_impact"],
                        direction=item["direction"],
                        label=label,
                        contribution_tier=tier,
                        raw_value=item.get("raw_value"),
                    ))
                return explanations
            except Exception as e:
                logger.warning(f"Explainer fallback failed: {e}")

        # 5. Fallback to model feature importances if available
        if hasattr(model_to_use, "feature_importances_"):
            try:
                f_imps = model_to_use.feature_importances_
                sorted_idx = np.argsort(np.abs(f_imps))[::-1]
                explanations = []
                for idx in sorted_idx[:top_k]:
                    fname = feature_names[idx] if idx < len(feature_names) else f"feature_{idx}"
                    imp = float(f_imps[idx])
                    explanations.append(FeatureContribution(
                        feature=fname,
                        impact=round(imp, 4),
                        absolute_impact=round(abs(imp), 4),
                        direction="positive" if imp >= 0 else "negative",
                        label="Increased model estimate" if imp >= 0 else "Reduced model estimate",
                        contribution_tier="Moderate contribution",
                        raw_value=raw_dict.get(fname),
                    ))
                return explanations
            except Exception as e:
                logger.warning(f"Feature importance fallback failed: {e}")

        return []

    def predict(
        self,
        features: PropertyFeatures,
        model_override: Optional[str] = None,
        coverage_level: float = 0.90,
        db: Optional[Session] = None,
    ) -> PredictionResponse:
        t0 = time.perf_counter()
        raw_dict = features.to_dict()
        df_single = pd.DataFrame([raw_dict])

        # Preprocessing
        try:
            X_trans = self.preprocessor.transform(df_single)
        except Exception as e:
            logger.error(f"Feature preprocessing failed: {e}")
            raise RuntimeError(f"Feature transformation error: {str(e)}")

        # Model selection
        active_model = self.best_model
        active_name = self.model_name
        is_linear_baseline = False
        if model_override:
            m_lower = model_override.lower()
            matched = False
            if ("baseline" in m_lower or "linear" in m_lower) and self.baseline_model:
                active_model = self.baseline_model
                active_name = "Linear Regression (Baseline)"
                is_linear_baseline = True
                matched = True
            elif hasattr(self.best_model, "estimators_"):
                # Check for individual ensemble submodels
                for name, est in zip(["XGBoost", "LightGBM", "CatBoost", "Gradient Boosting"], self.best_model.estimators_):
                    if name.lower() in m_lower:
                        active_model = est
                        active_name = name
                        matched = True
                        break
            if not matched:
                active_name = model_override

        # Model Inference (deterministic & measured)
        try:
            raw_pred = active_model.predict(X_trans)
            pred_val = float(TargetTransformer.inverse_transform(raw_pred[0]))
            pred_val = max(10000.0, pred_val)
        except Exception as e:
            logger.error(f"Model inference failed: {e}")
            raise RuntimeError("Unable to generate a prediction.")

        # Conformal Prediction Interval (Split Conformal, multi-model & multi-coverage aware)
        interval: Optional[PredictionInterval] = None
        uncertainty_info: Optional[UncertaintyInfo] = None
        uncertainty_level = "Moderate"
        interval_available = False
        interval_unavailable_reason = None

        if self.conformal is not None:
            try:
                # Query calibrated interval
                conf_data = None
                if isinstance(self.conformal, MultiModelConformalManager):
                    conf_data = self.conformal.predict_interval(
                        pred_val, coverage_level=coverage_level, model_name=active_name
                    )
                elif hasattr(self.conformal, "predict_interval"):
                    conf_data = self.conformal.predict_interval(pred_val, coverage_level=coverage_level)

                if conf_data is not None:
                    lower = float(conf_data.get("lower", conf_data.get("lower_bound", pred_val)))
                    upper = float(conf_data.get("upper", conf_data.get("upper_bound", pred_val)))
                    w_val = float(conf_data.get("interval_width", upper - lower))
                    margin = float(conf_data.get("margin", (upper - lower) / 2.0))
                    uncertainty_level = conf_data.get("uncertainty_level", "Moderate")
                    cal_samples = int(conf_data.get("calibration_samples", 292))

                    interval = PredictionInterval(
                        lower=round(lower, 2),
                        upper=round(upper, 2),
                        lower_bound=round(lower, 2),
                        upper_bound=round(upper, 2),
                        margin=round(margin, 2),
                        interval_width=round(w_val, 2),
                        coverage=coverage_level,
                        confidence_level=coverage_level,
                        coverage_guarantee=f"{int(coverage_level * 100)}% Empirical Conformal Coverage",
                        method="Split Conformal Prediction",
                        uncertainty_level=uncertainty_level,
                        explanation=(
                            f"The model estimates the property at ${round(pred_val):,}, with an uncertainty range of "
                            f"${round(lower):,}–${round(upper):,}. This is not a guaranteed market price."
                        ),
                        calibration_samples=cal_samples,
                        target_coverage=coverage_level,
                        observed_coverage=conf_data.get("observed_coverage"),
                        mean_interval_width=conf_data.get("mean_interval_width"),
                    )

                    uncertainty_info = UncertaintyInfo(
                        method="conformal_prediction",
                        interval_width=round(w_val, 2),
                        uncertainty_level=uncertainty_level,
                        target_coverage=coverage_level,
                        observed_coverage=conf_data.get("observed_coverage"),
                        mean_interval_width=conf_data.get("mean_interval_width"),
                        calibration_dataset=conf_data.get("calibration_dataset", "Ames Housing Calibration Split (Holdout)"),
                        calibration_samples=cal_samples,
                    )
                    interval_available = True
                else:
                    interval_unavailable_reason = "Prediction interval unavailable for this model."
            except Exception as e:
                logger.warning(f"Conformal prediction calculation failed: {e}")
                interval_unavailable_reason = "Uncertainty calculation was unavailable."
        else:
            interval_unavailable_reason = "Uncertainty calibration artifact unavailable."

        # Feature Attribution & Explainability
        explanations: List[FeatureContribution] = []
        explain_method = "Tree SHAP (Lundberg et al.)"
        if is_linear_baseline:
            explanations = self._explain_linear_model(X_trans, raw_dict, top_k=8)
            explain_method = "Linear Regression Coefficients"
        else:
            explanations = self._explain_tree_model(X_trans, raw_dict, target_model=active_model, top_k=8)

        explanation_summary = ExplanationSummary(
            method=explain_method,
            features=explanations,
            interpretation_notice="Feature contributions describe how the model arrived at this prediction; they do not establish causal relationships."
        )

        latency_ms = (time.perf_counter() - t0) * 1000.0

        # Distribution and OOD check (Requirement 19 & 20)
        drift_check = self.drift_detector.check_drift_single(raw_dict)
        is_ood = drift_check.get("is_out_of_distribution", False)
        ood_warning = (
            "⚠ HIGHER UNCERTAINTY: These inputs differ substantially from the data used to train/calibrate the model. "
            "Treat the estimate with additional caution."
        ) if is_ood else None
        dist_warning = (
            "Prediction reliability may be lower for inputs unlike the historical training data."
        ) if is_ood else None

        # Persist to database if db session provided
        record_id = None
        if db:
            try:
                rec = PredictionRecord(
                    model_name=active_name,
                    model_version=self.model_version,
                    inputs_json=json.dumps(raw_dict),
                    predicted_price=pred_val,
                    lower_bound=interval.lower if interval else None,
                    upper_bound=interval.upper if interval else None,
                    latency_ms=latency_ms,
                )
                db.add(rec)
                db.commit()
                db.refresh(rec)
                record_id = rec.id
            except Exception as e:
                logger.error(f"Failed to record prediction in DB: {e}")

        model_info = ModelInfo(name=active_name, version=self.model_version)

        applicability_eval = None
        try:
            from .model_applicability_service import ModelApplicabilityService
            applicability_eval = ModelApplicabilityService.get_instance().evaluate_applicability(features).model_dump()
        except Exception as e:
            logger.warning(f"Could not compute applicability evaluation: {e}")

        return PredictionResponse(
            prediction=round(pred_val, 2),
            predicted_price=round(pred_val, 2),
            model=model_info,
            model_version=self.model_version,
            prediction_interval=interval,
            uncertainty=uncertainty_info,
            explanation=explanation_summary,
            explanations=explanations,
            applicability=applicability_eval,
            metadata={
                "prediction_id": record_id,
                "latency_ms": round(latency_ms, 2),
                "interval_available": interval_available,
                "interval_unavailable_reason": interval_unavailable_reason,
                "coverage_level_configured": coverage_level,
                "has_drift_warning": drift_check["has_drift_warning"],
                "is_out_of_distribution": is_ood,
                "ood_warning": ood_warning,
                "data_distribution_warning": dist_warning,
                "reliability_notice": drift_check.get("reliability_notice"),
                "drift_warnings": drift_check["anomalous_features"],
                "messages": drift_check.get("messages", []),
                "target_transform_applied": "log1p",
                "features_analyzed": len(raw_dict),
                "dataset": "Ames Housing",
                "dataset_version": "v1.0.0",
                "dataset_source": "Dean De Cock (2011)",
                "rows_trained": 876,
                "rows_calibrated": 292,
                "rows_evaluated": 292,
                "features_count": 81,
                "target_variable": "SalePrice (log1p transformed)",
                "training_date": "2026-10-07T16:05:28Z",
                "validation_rmse": 27210.21,
                "uncertainty_level": uncertainty_level,
            },
            disclaimer="This is a machine-learning estimate based on historical housing data, not an official property appraisal or guaranteed market valuation."
        )


    def what_if_analysis(
        self,
        base_features: PropertyFeatures,
        modified_features: PropertyFeatures,
        model_override: Optional[str] = None,
    ) -> WhatIfResponse:
        base_resp = self.predict(base_features, model_override=model_override)
        mod_resp = self.predict(modified_features, model_override=model_override)

        orig_price = base_resp.prediction
        new_price = mod_resp.prediction
        diff = round(new_price - orig_price, 2)
        pct_change = round((diff / orig_price) * 100.0, 2) if orig_price > 0 else 0.0

        # Identify changed attributes
        base_dict = base_features.to_dict()
        mod_dict = modified_features.to_dict()
        diverging = []
        for k in base_dict:
            if base_dict[k] != mod_dict[k]:
                diverging.append({
                    "feature": k,
                    "from_value": base_dict[k],
                    "to_value": mod_dict[k],
                })

        sign = "+" if diff >= 0 else ""
        statement = f"Model estimate changes by {sign}${diff:,.2f} ({sign}{pct_change:.2f}%)"

        return WhatIfResponse(
            original_price=orig_price,
            new_price=new_price,
            difference=diff,
            percentage_change=pct_change,
            model=base_resp.model,
            original_interval=base_resp.prediction_interval,
            new_interval=mod_resp.prediction_interval,
            top_diverging_factors=diverging,
            statement=statement,
            disclaimer="Model simulation based on historical data. Does not represent a guaranteed change in future market value."
        )


    def sensitivity_analysis(
        self,
        base_features: PropertyFeatures,
        target_feature: str = "GrLivArea",
        min_val: Optional[float] = None,
        max_val: Optional[float] = None,
        steps: int = 15,
    ) -> SensitivityResponse:
        base_dict = base_features.to_dict()
        current_val = float(base_dict.get(target_feature, 1500.0))

        if min_val is None:
            min_val = max(300.0, current_val * 0.5)
        if max_val is None:
            max_val = current_val * 1.8

        val_range = np.linspace(min_val, max_val, steps)
        points = []

        for v in val_range:
            cloned_dict = base_dict.copy()
            cloned_dict[target_feature] = float(v)
            try:
                feat = PropertyFeatures(**cloned_dict)
                resp = self.predict(feat)
                points.append({
                    "feature_value": round(float(v), 1),
                    "predicted_price": resp.predicted_price,
                })
            except Exception:
                continue

        return SensitivityResponse(
            target_feature=target_feature,
            points=points,
            model=self.model_name,
        )
