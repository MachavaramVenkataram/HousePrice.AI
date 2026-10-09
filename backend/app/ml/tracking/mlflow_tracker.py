import logging
import os
from typing import Any

try:
    import mlflow
    HAS_MLFLOW = True
except ImportError:
    mlflow = None
    HAS_MLFLOW = False

logger = logging.getLogger(__name__)

MLFLOW_DB_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "mlops", "mlflow.db")
)


def init_mlflow(experiment_name: str = "houseprice_ai_benchmark"):
    """Initialize SQLite-backed MLflow tracking store."""
    if not HAS_MLFLOW or mlflow is None:
        return
    os.makedirs(os.path.dirname(MLFLOW_DB_PATH), exist_ok=True)
    mlflow.set_tracking_uri(f"sqlite:///{MLFLOW_DB_PATH.replace(os.sep, '/')}")
    mlflow.set_experiment(experiment_name)


def log_experiment_run(
    model_name: str,
    params: dict[str, Any],
    metrics: dict[str, Any],
    tags: dict[str, str] | None = None,
) -> str | None:
    """Logs parameters, cross-validation metrics, and metadata to MLflow."""
    if not HAS_MLFLOW or mlflow is None:
        return None
    try:
        init_mlflow()
        with mlflow.start_run(run_name=model_name) as run:
            for k, v in params.items():
                if isinstance(v, (int, float, str, bool)):
                    mlflow.log_param(k, v)
                else:
                    mlflow.log_param(k, str(v))

            for k, v in metrics.items():
                if isinstance(v, (int, float)):
                    mlflow.log_metric(k, v)

            if tags:
                mlflow.set_tags(tags)

            run_id = run.info.run_id
            return run_id
    except Exception as e:
        logger.warning(f"Could not log to MLflow: {e}")
        return None
