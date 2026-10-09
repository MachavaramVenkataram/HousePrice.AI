import os
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

REGISTRY_PATH = os.path.join(
    os.path.dirname(__file__), "..", "artifacts", "model_registry.json"
)


class ModelRegistryManager:
    """Manages versioned model artifacts and stages (Production, Baseline, Validation)."""

    def __init__(self, registry_file: str = REGISTRY_PATH):
        self.registry_file = registry_file
        os.makedirs(os.path.dirname(self.registry_file), exist_ok=True)

    def load_registry(self) -> Dict[str, Any]:
        if os.path.exists(self.registry_file):
            try:
                with open(self.registry_file, "r") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Error loading registry: {e}")
        return {
            "current_production_model": "XGBoost",
            "production_version": "v1.0.0",
            "baseline_model": "Linear Regression",
            "registered_models": [],
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }

    def save_registry(self, data: Dict[str, Any]):
        data["last_updated"] = datetime.now(timezone.utc).isoformat()
        with open(self.registry_file, "w") as f:
            json.dump(data, f, indent=2)

    def register_model(
        self,
        name: str,
        version: str,
        stage: str,
        cv_metrics: Dict[str, Any],
        test_metrics: Dict[str, Any],
        artifact_path: str,
        params: Dict[str, Any],
        description: str = "",
    ):
        registry = self.load_registry()
        models = registry.get("registered_models", [])

        # Filter out existing entry with same name and version
        models = [m for m in models if not (m["name"] == name and m["version"] == version)]

        entry = {
            "name": name,
            "version": version,
            "stage": stage,
            "cv_metrics": cv_metrics,
            "test_metrics": test_metrics,
            "artifact_path": artifact_path,
            "parameters": params,
            "description": description,
            "registered_at": datetime.now(timezone.utc).isoformat(),
        }
        models.append(entry)
        registry["registered_models"] = models

        if stage == "Production":
            registry["current_production_model"] = name
            registry["production_version"] = version

        self.save_registry(registry)
        logger.info(f"Registered model {name} ({version}) as {stage}")

    def get_production_model_info(self) -> Optional[Dict[str, Any]]:
        registry = self.load_registry()
        prod_name = registry.get("current_production_model")
        for m in registry.get("registered_models", []):
            if m["name"] == prod_name and m["stage"] == "Production":
                return m
        return None

    def get_all_models(self) -> List[Dict[str, Any]]:
        return self.load_registry().get("registered_models", [])
