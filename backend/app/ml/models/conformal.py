import numpy as np
from typing import Dict, Any, List, Optional, Tuple, Union


class ConformalPredictor:
    """Inductive Split Conformal Predictor for distribution-free regression prediction intervals.
    
    Theoretical Foundation:
    -----------------------
    Split Conformal Prediction (Papadopoulos et al., 2002; Vovk et al., 2005; Lei et al., 2018)
    provides distribution-free, finite-sample marginal coverage guarantees under the assumption
    that the calibration data and future test points are exchangeable:
    
        P(Y_{n+1} in C_{1-alpha}(X_{n+1})) >= 1 - alpha
        
    Split Discipline:
    -----------------
    1. Training set (D_train): Used exclusively for feature preprocessing and model training.
    2. Calibration set (D_cal): Held out from training. Model predictions y_hat_cal are compared
       against ground truth y_cal to obtain absolute nonconformity scores:
           R_i = | y_cal,i - y_hat_cal,i |
    3. Evaluation set (D_test): Held out from both training and calibration. Used to evaluate
       true empirical test coverage and mean interval width without data leakage.

    Quantile Calculation:
    ---------------------
    For target coverage level 1 - alpha (e.g. 0.90 or 0.95), with n_cal calibration samples:
        level = min(1.0, ceil((n_cal + 1) * (1 - alpha)) / n_cal)
        q_hat = Quantile(residuals, level)
        
    Prediction Interval:
        C(X_new) = [ max(0, y_hat - q_hat), y_hat + q_hat ]
    """

    def __init__(
        self,
        default_coverage: float = 0.90,
        model_name: str = "Trained Regressor",
        calibration_dataset_name: str = "Ames Housing Calibration Split (Holdout)",
    ):
        self.default_coverage = default_coverage
        self.model_name = model_name
        self.calibration_dataset_name = calibration_dataset_name
        self.residuals: np.ndarray = np.array([], dtype=float)
        self.n_cal: int = 0
        self.is_calibrated: bool = False
        
        # Stored empirical evaluation metrics on held-out test set
        self.evaluation_metrics: Dict[str, Dict[str, float]] = {}
        
        # Backwards compatibility attributes
        self.confidence_level: float = default_coverage
        self.alpha: float = 1.0 - default_coverage
        self.q_hat: float = 0.0

    def calibrate(
        self,
        y_true: Union[np.ndarray, List[float]],
        y_pred: Union[np.ndarray, List[float]],
    ) -> "ConformalPredictor":
        """Compute absolute nonconformity residuals on holdout calibration set."""
        y_t = np.asarray(y_true, dtype=float).ravel()
        y_p = np.asarray(y_pred, dtype=float).ravel()
        
        if len(y_t) != len(y_p):
            raise ValueError(f"Shape mismatch: y_true length {len(y_t)} != y_pred length {len(y_p)}")
        if len(y_t) < 10:
            raise ValueError(f"Insufficient calibration data: {len(y_t)} samples provided (need >= 10).")

        self.residuals = np.sort(np.abs(y_t - y_p))
        self.n_cal = len(self.residuals)
        self.is_calibrated = True
        
        # Compute default q_hat for backwards compatibility
        self.q_hat = self.get_quantile(self.default_coverage)
        self.confidence_level = self.default_coverage
        self.alpha = 1.0 - self.default_coverage
        return self

    def get_quantile(self, coverage_level: float = 0.90) -> float:
        """Calculates exact conformal quantile for configured coverage level 1 - alpha."""
        if not self.is_calibrated or self.n_cal == 0:
            raise RuntimeError("ConformalPredictor must be calibrated before querying quantiles.")
        if not (0.0 < coverage_level < 1.0):
            raise ValueError(f"Coverage level must be strictly between 0 and 1, got {coverage_level}")

        alpha = 1.0 - coverage_level
        # Standard finite-sample correction index: ceil((n + 1) * (1 - alpha)) / n
        level = min(1.0, np.ceil((self.n_cal + 1) * (1.0 - alpha)) / self.n_cal)
        q = float(np.quantile(self.residuals, level, method="higher"))
        return round(q, 2)

    def evaluate_test_set(
        self,
        y_test: Union[np.ndarray, List[float]],
        y_test_pred: Union[np.ndarray, List[float]],
        coverage_levels: Optional[List[float]] = None,
    ) -> Dict[str, Dict[str, float]]:
        """Evaluates empirical coverage and mean interval width on held-out test data."""
        if not self.is_calibrated:
            raise RuntimeError("ConformalPredictor must be calibrated before evaluating test set.")
            
        if coverage_levels is None:
            coverage_levels = [0.90, 0.95]

        y_t = np.asarray(y_test, dtype=float).ravel()
        y_p = np.asarray(y_test_pred, dtype=float).ravel()
        n_eval = len(y_t)

        metrics = {}
        for cov in coverage_levels:
            q = self.get_quantile(cov)
            lower = np.maximum(0.0, y_p - q)
            upper = y_p + q
            inside = (y_t >= lower) & (y_t <= upper)
            observed_coverage = float(np.mean(inside))
            mean_width = float(np.mean(upper - lower))
            median_width = float(np.median(upper - lower))

            key = f"{int(cov * 100)}%"
            metrics[key] = {
                "target_coverage": round(cov, 4),
                "observed_coverage": round(observed_coverage, 4),
                "mean_interval_width": round(mean_width, 2),
                "median_interval_width": round(median_width, 2),
                "margin": round(q, 2),
                "n_evaluated": n_eval,
            }

        self.evaluation_metrics = metrics
        return metrics

    def classify_uncertainty_level(self, interval_width: float, point_prediction: float) -> str:
        """Derives documented qualitative uncertainty tier from relative interval width.
        
        Statistical Rule:
        -----------------
        Let relative_width = interval_width / point_prediction.
        - Lower uncertainty: relative_width < 0.16 (well-constrained prediction within typical low-residual regions)
        - Moderate uncertainty: 0.16 <= relative_width <= 0.26 (typical residual dispersion for historical Ames data)
        - Higher uncertainty: relative_width > 0.26 (wider interval indicating greater predictive variance)
        """
        if point_prediction <= 0.0:
            return "Moderate"
        rel = interval_width / point_prediction
        if rel < 0.16:
            return "Lower"
        elif rel > 0.26:
            return "Higher"
        return "Moderate"

    def predict_interval(
        self,
        y_pred: Union[float, np.ndarray],
        coverage_level: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Calculates prediction interval [lower, upper] for given point prediction(s)."""
        if not self.is_calibrated:
            raise RuntimeError("ConformalPredictor must be calibrated before generating intervals.")

        cov = coverage_level if coverage_level is not None else self.default_coverage
        q = self.get_quantile(cov)

        y_p = np.asarray(y_pred, dtype=float)
        lower = np.maximum(0.0, y_p - q)
        upper = y_p + q
        width = upper - lower

        eval_key = f"{int(cov * 100)}%"
        eval_data = self.evaluation_metrics.get(eval_key, {})

        if y_p.ndim == 0:
            p_val = float(y_p)
            w_val = float(width)
            unc_level = self.classify_uncertainty_level(w_val, p_val)

            return {
                "lower": round(float(lower), 2),
                "upper": round(float(upper), 2),
                "lower_bound": round(float(lower), 2),  # backwards compat
                "upper_bound": round(float(upper), 2),  # backwards compat
                "margin": round(q, 2),
                "interval_width": round(w_val, 2),
                "coverage": round(cov, 4),
                "confidence_level": round(cov, 4),  # backwards compat
                "coverage_guarantee": f"{int(cov * 100)}% Empirical Conformal Coverage",
                "method": "Split Conformal Prediction",
                "uncertainty_level": unc_level,
                "calibration_dataset": self.calibration_dataset_name,
                "calibration_samples": self.n_cal,
                "target_coverage": round(cov, 4),
                "observed_coverage": eval_data.get("observed_coverage"),
                "mean_interval_width": eval_data.get("mean_interval_width"),
                "explanation": (
                    f"The model estimates the property at ${round(p_val):,}, with an uncertainty range of "
                    f"${round(float(lower)):,}–${round(float(upper)):,}. This is not a guaranteed market price."
                ),
            }
        else:
            return {
                "lower": np.round(lower, 2).tolist(),
                "upper": np.round(upper, 2).tolist(),
                "lower_bounds": np.round(lower, 2).tolist(),  # backwards compat
                "upper_bounds": np.round(upper, 2).tolist(),  # backwards compat
                "margin": round(q, 2),
                "interval_width": np.round(width, 2).tolist(),
                "coverage": round(cov, 4),
                "confidence_level": round(cov, 4),
                "calibration_samples": self.n_cal,
                "target_coverage": round(cov, 4),
                "observed_coverage": eval_data.get("observed_coverage"),
                "mean_interval_width": eval_data.get("mean_interval_width"),
            }


class MultiModelConformalManager:
    """Manages individual conformal predictors for all supported regression models.
    
    Prevents assuming identical interval behavior across models and ensures
    unsupported models return an explicit unavailable status without fabrication.
    """

    def __init__(self, primary_model_name: Optional[str] = None):
        self.predictors: Dict[str, ConformalPredictor] = {}
        self.primary_model_name: Optional[str] = primary_model_name

    def register(self, model_name: str, predictor: ConformalPredictor, is_primary: bool = False):
        self.predictors[model_name] = predictor
        if is_primary or self.primary_model_name is None:
            self.primary_model_name = model_name

    def get_predictor(self, model_name: Optional[str] = None) -> Optional[ConformalPredictor]:
        if model_name is None:
            model_name = self.primary_model_name
        if model_name is None:
            return None
        # Exact match
        if model_name in self.predictors:
            return self.predictors[model_name]
        # Case-insensitive / substring match
        m_lower = model_name.lower()
        for k, pred in self.predictors.items():
            if k.lower() == m_lower or k.lower() in m_lower or m_lower in k.lower():
                return pred
        return None

    def has_predictor(self, model_name: str) -> bool:
        return self.get_predictor(model_name) is not None

    @property
    def is_calibrated(self) -> bool:
        pred = self.get_predictor()
        return pred.is_calibrated if pred else False

    @property
    def q_hat(self) -> float:
        pred = self.get_predictor()
        return pred.q_hat if pred else 0.0

    @property
    def confidence_level(self) -> float:
        pred = self.get_predictor()
        return pred.confidence_level if pred else 0.90

    @property
    def n_cal(self) -> int:
        pred = self.get_predictor()
        return pred.n_cal if pred else 0

    def predict_interval(
        self,
        y_pred: Union[float, np.ndarray],
        coverage_level: Optional[float] = None,
        model_name: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Calculates interval for specified model or primary model."""
        predictor = self.get_predictor(model_name)
        if predictor is None or not predictor.is_calibrated:
            return None
        return predictor.predict_interval(y_pred, coverage_level=coverage_level)

