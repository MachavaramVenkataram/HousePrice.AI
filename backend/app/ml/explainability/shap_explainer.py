import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
import shap


class ModelExplainer:
    """SHAP-based Global and Local Model Explainer."""

    def __init__(self, model, feature_names: List[str]):
        self.model = model
        self.feature_names = feature_names
        self.explainer = None
        self.global_importance: List[Dict[str, Any]] = []
        self.expected_value: float = 0.0

    def fit(self, X_sample: np.ndarray):
        """Fit SHAP explainer on representative background sample."""
        try:
            # Check if model has underlying tree estimator (e.g. in VotingRegressor)
            if hasattr(self.model, "estimators_") and len(self.model.estimators_) > 0:
                # Use primary tree estimator (XGBoost) for fast TreeExplainer
                tree_submodel = self.model.estimators_[0]
                self.explainer = shap.TreeExplainer(tree_submodel)
            else:
                self.explainer = shap.TreeExplainer(self.model)

            if hasattr(self.explainer, "expected_value"):
                ev = self.explainer.expected_value
                self.expected_value = float(np.mean(ev)) if isinstance(ev, (list, np.ndarray)) else float(ev)
            else:
                self.expected_value = float(np.mean(self.model.predict(X_sample)))
        except Exception:
            # Fallback to model.predict callable with Sampling/Kernel Explainer
            predict_fn = self.model.predict
            self.explainer = shap.Explainer(predict_fn, X_sample)
            self.expected_value = float(np.mean(predict_fn(X_sample)))

        # Compute global feature importance from background sample
        shap_values = self.explainer(X_sample)
        vals = shap_values.values if hasattr(shap_values, "values") else shap_values
        mean_abs_shap = np.mean(np.abs(vals), axis=0)

        importance_list = []
        for name, score in zip(self.feature_names, mean_abs_shap):
            importance_list.append({
                "feature": name,
                "importance": round(float(score), 4),
            })
        importance_list.sort(key=lambda x: x["importance"], reverse=True)
        self.global_importance = importance_list[:25]
        return self

    def explain_instance(
        self,
        X_single_trans: np.ndarray,
        raw_features: Dict[str, Any],
        top_k: int = 8,
    ) -> List[Dict[str, Any]]:
        """Computes local SHAP explanation for a single prediction instance."""
        if self.explainer is None:
            return []

        shap_values = self.explainer(X_single_trans)
        vals = shap_values.values[0] if hasattr(shap_values, "values") else shap_values[0]

        explanations = []
        for name, impact in zip(self.feature_names, vals):
            direction = "positive" if impact > 0 else "negative"
            label = "pushes estimate higher" if impact > 0 else "pushes estimate lower"
            explanations.append({
                "feature": name,
                "impact": round(float(impact), 4),
                "absolute_impact": round(float(abs(impact)), 4),
                "direction": direction,
                "label": label,
                "raw_value": raw_features.get(name, None),
            })

        # Sort by magnitude of contribution
        explanations.sort(key=lambda x: x["absolute_impact"], reverse=True)
        return explanations[:top_k]

    def get_global_explanations(self) -> List[Dict[str, Any]]:
        return self.global_importance
