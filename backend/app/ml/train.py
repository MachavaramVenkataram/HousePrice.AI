import json
import logging
import os
import time
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

from .data.loader import (
    CATEGORICAL_FEATURES,
    NUMERIC_FEATURES,
    TARGET,
    generate_data_profile,
    load_dataset,
)
from .evaluation.cv import evaluate_model_cv
from .evaluation.metrics import (
    analyze_residuals,
    build_error_explorer,
    calculate_regression_metrics,
)
from .explainability.shap_explainer import ModelExplainer
from .models.advanced import get_advanced_models
from .models.baselines import get_baseline_models
from .models.conformal import ConformalPredictor, MultiModelConformalManager
from .models.registry import ModelRegistryManager
from .monitoring.drift_detector import DataDriftDetector
from .optimization.optuna_tuner import tune_xgboost_optuna
from .preprocessing.pipeline import HousingPreprocessingPipeline, TargetTransformer
from .tracking.mlflow_tracker import log_experiment_run

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("HOUSEPRICE_TRAINING")

ARTIFACTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "artifacts"))


def run_complete_ml_pipeline(run_optuna: bool = True, optuna_trials: int = 12) -> dict[str, Any]:
    """Orchestrates end-to-end reproducible ML training, validation, benchmarking, and artifact generation."""
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    start_time = time.time()
    logger.info("==================================================")
    logger.info("HOUSEPRICE AI: STARTING PRODUCTION ML PIPELINE")
    logger.info("==================================================")

    # 1. Ingestion & Profiling
    logger.info("Phase 1: Loading and profiling dataset...")
    df = load_dataset()
    _ = generate_data_profile(df)
    logger.info(f"Dataset loaded: {len(df)} rows, target: {TARGET}")

    # Drop rows without target value
    df = df.dropna(subset=[TARGET]).copy()
    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES].copy()
    y = pd.to_numeric(df[TARGET], errors="coerce").copy()

    # 2. Strict 3-Way Split Discipline (60% Train, 20% Calibration, 20% Held-Out Test)
    # Prevent data leakage: D_train for model fitting, D_cal for conformal calibration, D_test for final evaluation.
    logger.info("Phase 2: Creating strict 3-way split: Train (60%), Calibration (20%), Held-Out Test (20%)...")
    X_train_full, X_test, y_train_full, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )
    X_train, X_calib, y_train, y_calib = train_test_split(
        X_train_full, y_train_full, test_size=0.25, random_state=42
    )
    logger.info(
        f"Split sizes -> Train: {len(X_train)} (model fitting), "
        f"Calibration: {len(X_calib)} (conformal residuals), "
        f"Test: {len(X_test)} (held-out empirical evaluation)"
    )

    # 3. Model Benchmark via 5-Fold Cross Validation
    logger.info("Phase 3: Benchmarking Baseline and Advanced Models with 5-Fold CV...")
    models_to_evaluate = {}
    models_to_evaluate.update(get_baseline_models(random_state=42))
    models_to_evaluate.update(get_advanced_models(random_state=42))

    benchmark_records = []
    trained_estimators = {}
    multi_conformal = MultiModelConformalManager()

    # Fit preprocessing pipeline strictly on training data
    full_pipe = HousingPreprocessingPipeline()
    X_tr_trans = full_pipe.fit_transform(X_train)
    X_cal_trans = full_pipe.transform(X_calib)
    X_te_trans = full_pipe.transform(X_test)
    y_tr_fit = TargetTransformer.transform(y_train)

    for name, model_instance in models_to_evaluate.items():
        logger.info(f"Evaluating and calibrating {name}...")
        cv_res = evaluate_model_cv(
            model_instance,
            X_train,
            y_train,
            n_splits=5,
            random_state=42,
            use_target_transform=True,
        )

        # Fit model strictly on training set
        t_fit = time.perf_counter()
        model_instance.fit(X_tr_trans, y_tr_fit)
        fit_duration = time.perf_counter() - t_fit

        # Inference on calibration set to obtain calibration nonconformity scores
        raw_cal_preds = model_instance.predict(X_cal_trans)
        cal_preds = TargetTransformer.inverse_transform(raw_cal_preds)
        cal_preds = np.clip(cal_preds, a_min=10000.0, a_max=None)

        # Inference on held-out test set
        t_inf = time.perf_counter()
        raw_test_preds = model_instance.predict(X_te_trans)
        inf_duration = (time.perf_counter() - t_inf) * 1000.0 / len(X_test)
        test_preds = TargetTransformer.inverse_transform(raw_test_preds)
        test_preds = np.clip(test_preds, a_min=10000.0, a_max=None)
        test_metrics = calculate_regression_metrics(y_test, test_preds)

        # Conformal calibration on calibration set and empirical evaluation on test set
        conf_predictor = ConformalPredictor(default_coverage=0.90, model_name=name)
        conf_predictor.calibrate(y_calib.values, cal_preds)
        eval_metrics = conf_predictor.evaluate_test_set(
            y_test.values, test_preds, coverage_levels=[0.90, 0.95]
        )
        multi_conformal.register(name, conf_predictor)

        record = {
            "model": name,
            "category": "Baseline" if "Linear" in name or name in ["Ridge Regression", "Lasso", "ElasticNet"] else "Advanced",
            "cv_rmse_mean": cv_res["rmse_mean"],
            "cv_rmse_std": cv_res["rmse_std"],
            "cv_mae_mean": cv_res["mae_mean"],
            "cv_mae_std": cv_res["mae_std"],
            "cv_r2_mean": cv_res["r2_mean"],
            "cv_r2_std": cv_res["r2_std"],
            "test_rmse": test_metrics["rmse"],
            "test_mae": test_metrics["mae"],
            "test_r2": test_metrics["r2"],
            "test_mape": test_metrics["mape"],
            "training_time_sec": round(fit_duration, 4),
            "inference_time_ms": round(inf_duration, 3),
            "target_coverage_90": 0.90,
            "observed_coverage_90": eval_metrics["90%"]["observed_coverage"],
            "mean_interval_width_90": eval_metrics["90%"]["mean_interval_width"],
            "margin_90": eval_metrics["90%"]["margin"],
            "target_coverage_95": 0.95,
            "observed_coverage_95": eval_metrics["95%"]["observed_coverage"],
            "mean_interval_width_95": eval_metrics["95%"]["mean_interval_width"],
            "margin_95": eval_metrics["95%"]["margin"],
        }
        benchmark_records.append(record)
        trained_estimators[name] = (model_instance, full_pipe, test_preds)

        # Log to MLflow
        log_experiment_run(
            model_name=name,
            params={"model_type": type(model_instance).__name__},
            metrics={
                "cv_rmse": cv_res["rmse_mean"],
                "cv_mae": cv_res["mae_mean"],
                "cv_r2": cv_res["r2_mean"],
                "test_rmse": test_metrics["rmse"],
                "test_mae": test_metrics["mae"],
                "test_r2": test_metrics["r2"],
                "observed_coverage_90": eval_metrics["90%"]["observed_coverage"],
                "mean_interval_width_90": eval_metrics["90%"]["mean_interval_width"],
            },
            tags={"framework": "scikit-learn/gradient-boosting"},
        )

    # 4. Optuna Hyperparameter Optimization
    optuna_results = None
    if run_optuna:
        logger.info(f"Phase 4: Running Optuna Hyperparameter Tuning ({optuna_trials} trials)...")
        optuna_results = tune_xgboost_optuna(X_train, y_train, n_trials=optuna_trials)
        logger.info(f"Optuna Best CV RMSE: {optuna_results['best_cv_rmse']} with params: {optuna_results['best_params']}")

    # 5. Best Model Selection based strictly on CV RMSE (Requirement 17)
    benchmark_records.sort(key=lambda x: x["cv_rmse_mean"])
    best_record = benchmark_records[0]
    best_model_name = best_record["model"]
    logger.info(f"Phase 5: Best Model Selected: {best_model_name} (CV RMSE: ${best_record['cv_rmse_mean']:,})")

    best_estimator, best_pipeline, test_predictions = trained_estimators[best_model_name]
    multi_conformal.primary_model_name = best_model_name

    # 6. Conformal Calibration Verification
    logger.info("Phase 6: Verifying Conformal Prediction calibration metrics for production model...")
    best_conf = multi_conformal.get_predictor(best_model_name)
    logger.info(
        f"Production Model ({best_model_name}) 90% Conformal Margin: +/- ${best_conf.get_quantile(0.90):,.2f} | "
        f"Observed Test Coverage: {best_conf.evaluation_metrics['90%']['observed_coverage'] * 100:.2f}% | "
        f"Mean Width: ${best_conf.evaluation_metrics['90%']['mean_interval_width']:,.2f}"
    )
    logger.info(
        f"Production Model ({best_model_name}) 95% Conformal Margin: +/- ${best_conf.get_quantile(0.95):,.2f} | "
        f"Observed Test Coverage: {best_conf.evaluation_metrics['95%']['observed_coverage'] * 100:.2f}% | "
        f"Mean Width: ${best_conf.evaluation_metrics['95%']['mean_interval_width']:,.2f}"
    )


    # 7. SHAP Global & Local Interpretability
    logger.info("Phase 7: Fitting SHAP Explainer...")
    feature_names = best_pipeline.get_feature_names()
    X_sample_trans = best_pipeline.transform(X_train.sample(min(len(X_train), 250), random_state=42))
    explainer = ModelExplainer(best_estimator, feature_names)
    explainer.fit(X_sample_trans)
    global_explanations = explainer.get_global_explanations()
    logger.info(f"Top 3 Global Features: {[g['feature'] for g in global_explanations[:3]]}")

    # 8. Residual Diagnostics & Error Explorer
    logger.info("Phase 8: Generating Residual Analysis and Error Explorer...")
    residual_diagnostics = analyze_residuals(y_test.values, test_predictions)
    error_records = build_error_explorer(X_test, y_test.values, test_predictions, top_n=50)

    # 9. Reference Data Drift Baseline
    logger.info("Phase 9: Saving Data Drift reference distribution...")
    drift_detector = DataDriftDetector()
    drift_detector.fit_reference(X_train, NUMERIC_FEATURES)

    # 10. Persist All Artifacts
    logger.info("Phase 10: Persisting model artifacts to disk...")
    joblib.dump(best_estimator, os.path.join(ARTIFACTS_DIR, "best_model.joblib"))
    joblib.dump(best_pipeline, os.path.join(ARTIFACTS_DIR, "preprocessor.joblib"))
    joblib.dump(multi_conformal, os.path.join(ARTIFACTS_DIR, "conformal_predictor.joblib"))
    joblib.dump(explainer, os.path.join(ARTIFACTS_DIR, "shap_explainer.joblib"))

    # Also persist baseline model for comparison
    baseline_estimator, baseline_pipe, _ = trained_estimators["Linear Regression"]
    joblib.dump(baseline_estimator, os.path.join(ARTIFACTS_DIR, "baseline_model.joblib"))

    # Save benchmark table
    with open(os.path.join(ARTIFACTS_DIR, "benchmark_results.json"), "w") as f:
        json.dump(benchmark_records, f, indent=2)

    # Save residual diagnostics
    with open(os.path.join(ARTIFACTS_DIR, "residual_diagnostics.json"), "w") as f:
        json.dump(residual_diagnostics, f, indent=2)

    # Save error explorer
    with open(os.path.join(ARTIFACTS_DIR, "error_explorer.json"), "w") as f:
        json.dump(error_records, f, indent=2)

    # Save test actual vs predicted points for charts
    test_scatter = []
    for i in range(len(y_test)):
        act = float(y_test.iloc[i])
        prd = float(test_predictions[i])
        test_scatter.append({
            "actual": round(act, 2),
            "predicted": round(prd, 2),
            "error": round(act - prd, 2),
            "abs_error_pct": round(abs(act - prd) / act * 100.0, 2),
            "neighborhood": str(X_test.iloc[i].get("Neighborhood", "Unknown")),
            "gr_liv_area": float(X_test.iloc[i].get("GrLivArea", 0)),
        })
    with open(os.path.join(ARTIFACTS_DIR, "test_scatter.json"), "w") as f:
        json.dump(test_scatter, f, indent=2)

    # Save Optuna history if present
    if optuna_results:
        with open(os.path.join(ARTIFACTS_DIR, "optuna_results.json"), "w") as f:
            json.dump(optuna_results, f, indent=2)

    # Save Global SHAP importance
    with open(os.path.join(ARTIFACTS_DIR, "global_shap.json"), "w") as f:
        json.dump(global_explanations, f, indent=2)

    # Register in Model Registry
    registry_mgr = ModelRegistryManager()
    for rec in benchmark_records:
        stage = "Production" if rec["model"] == best_model_name else ("Baseline" if rec["model"] == "Linear Regression" else "Validation")
        registry_mgr.register_model(
            name=rec["model"],
            version="v1.0.0",
            stage=stage,
            cv_metrics={
                "rmse_mean": rec["cv_rmse_mean"],
                "mae_mean": rec["cv_mae_mean"],
                "r2_mean": rec["cv_r2_mean"],
            },
            test_metrics={
                "rmse": rec["test_rmse"],
                "mae": rec["test_mae"],
                "r2": rec["test_r2"],
                "mape": rec["test_mape"],
                "observed_coverage_90": rec["observed_coverage_90"],
                "mean_interval_width_90": rec["mean_interval_width_90"],
                "observed_coverage_95": rec["observed_coverage_95"],
                "mean_interval_width_95": rec["mean_interval_width_95"],
            },
            artifact_path=os.path.join(ARTIFACTS_DIR, "best_model.joblib" if stage == "Production" else "baseline_model.joblib"),
            params={},
            description=f"Model trained on Ames Housing dataset with zero-leakage 3-way split preprocessing and {rec['category']} architecture.",
        )

    duration = time.time() - start_time
    logger.info(f"Pipeline completed successfully in {duration:.2f} seconds!")
    return {
        "status": "success",
        "best_model": best_model_name,
        "best_cv_rmse": best_record["cv_rmse_mean"],
        "test_rmse": best_record["test_rmse"],
        "test_r2": best_record["test_r2"],
        "conformal_margin_90": best_conf.get_quantile(0.90),
        "observed_coverage_90": best_conf.evaluation_metrics["90%"]["observed_coverage"],
        "mean_interval_width_90": best_conf.evaluation_metrics["90%"]["mean_interval_width"],
        "conformal_margin_95": best_conf.get_quantile(0.95),
        "observed_coverage_95": best_conf.evaluation_metrics["95%"]["observed_coverage"],
        "mean_interval_width_95": best_conf.evaluation_metrics["95%"]["mean_interval_width"],
        "duration_sec": round(duration, 2),
    }



if __name__ == "__main__":
    run_complete_ml_pipeline()
