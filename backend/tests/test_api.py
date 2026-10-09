import os
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_root_endpoint():
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["service"] == "HOUSEPRICE AI"
    assert "documentation" in data


def test_health_check():
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ["healthy", "degraded"]
    assert data["components"]["database"] == "online"


def test_predict_endpoint_valid():
    payload = {
        "features": {
            "GrLivArea": 1750.0,
            "TotalBsmtSF": 900.0,
            "1stFlrSF": 950.0,
            "2ndFlrSF": 800.0,
            "YearBuilt": 2005,
            "YearRemodAdd": 2006,
            "OverallQual": 8,
            "OverallCond": 5,
            "FullBath": 2,
            "HalfBath": 1,
            "BsmtFullBath": 1,
            "BedroomAbvGr": 3,
            "TotRmsAbvGrd": 7,
            "Fireplaces": 1,
            "GarageCars": 2,
            "GarageArea": 550.0,
            "LotArea": 9500.0,
            "LotFrontage": 70.0,
            "WoodDeckSF": 100.0,
            "OpenPorchSF": 50.0,
            "MoSold": 6,
            "YrSold": 2009,
            "Neighborhood": "CollgCr",
            "BldgType": "1Fam",
            "HouseStyle": "2Story",
            "MSZoning": "RL",
            "KitchenQual": "Gd",
            "BsmtQual": "Gd",
            "HeatingQC": "Ex",
            "CentralAir": "Y",
            "GarageType": "Attchd",
            "SaleCondition": "Normal",
        }
    }
    resp = client.post("/api/v1/predict", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "predicted_price" in data
    assert data["predicted_price"] > 50000.0
    assert "prediction_interval" in data
    assert data["prediction_interval"]["lower_bound"] <= data["predicted_price"]
    assert data["prediction_interval"]["upper_bound"] >= data["predicted_price"]
    assert len(data["explanations"]) > 0


def test_predict_validation_error():
    # Negative living area should fail validation
    payload = {
        "features": {
            "GrLivArea": -100.0,
        }
    }
    resp = client.post("/api/v1/predict", json=payload)
    assert resp.status_code == 422


def test_what_if_simulation():
    payload = {
        "base_features": {
            "GrLivArea": 1500.0,
            "OverallQual": 6,
        },
        "modified_features": {
            "GrLivArea": 2000.0,
            "OverallQual": 8,
        }
    }
    resp = client.post("/api/v1/predict/what-if", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "difference" in data
    assert "percentage_change" in data
    assert data["new_price"] > data["original_price"]


def test_sensitivity_analysis():
    payload = {
        "base_features": {
            "GrLivArea": 1600.0,
        },
        "target_feature": "GrLivArea",
        "steps": 8,
    }
    resp = client.post("/api/v1/predict/sensitivity", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["target_feature"] == "GrLivArea"
    assert len(data["points"]) == 8


def test_benchmark_and_residuals_endpoints():
    b_resp = client.get("/api/v1/models/benchmark")
    assert b_resp.status_code == 200
    b_data = b_resp.json()
    assert len(b_data) >= 5

    r_resp = client.get("/api/v1/models/residuals")
    assert r_resp.status_code == 200
    r_data = r_resp.json()
    assert "rmse" in r_data


def test_dataset_profile_and_rows():
    p_resp = client.get("/api/v1/dataset/profile")
    assert p_resp.status_code == 200
    p_data = p_resp.json()
    assert p_data["rows"] == 1460

    r_resp = client.get("/api/v1/dataset/rows?page=1&page_size=5")
    assert r_resp.status_code == 200
    r_data = r_resp.json()
    assert len(r_data["data"]) == 5


def test_conformal_interval_and_uncertainty_contract():
    payload = {
        "features": {
            "GrLivArea": 1800.0,
            "OverallQual": 7,
            "YearBuilt": 2000,
        }
    }
    resp = client.post("/api/v1/predict", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    
    # Mathematical validity
    assert "prediction_interval" in data
    interval = data["prediction_interval"]
    assert interval["lower"] < data["prediction"] < interval["upper"]
    assert interval["coverage"] == 0.90
    assert interval["method"] == "Split Conformal Prediction"
    assert interval["uncertainty_level"] in ["Lower", "Moderate", "Higher"]
    assert "not a guarantee" in interval["explanation"].lower()


def test_linear_baseline_override():
    payload = {
        "features": {
            "GrLivArea": 1600.0,
            "OverallQual": 6,
            "YearBuilt": 1990,
        },
        "model_override": "Linear"
    }
    resp = client.post("/api/v1/predict", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    model_name = data["model"]["name"] if isinstance(data["model"], dict) else data["model"]
    assert "Linear Regression" in model_name
    assert data["explanation"]["method"] == "Linear Regression Coefficients"
    assert len(data["explanation"]["features"]) > 0


def test_out_of_distribution_warning():
    payload = {
        "features": {
            "GrLivArea": 7500.0,  # Extreme living area
            "LotArea": 180000.0,
        }
    }
    resp = client.post("/api/v1/predict", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["metadata"]["is_out_of_distribution"] is True
    assert data["metadata"]["has_drift_warning"] is True
    assert data["metadata"]["reliability_notice"] is not None
    assert len(data["metadata"]["drift_warnings"]) > 0


def test_non_causal_attribution_disclaimer():
    payload = {
        "features": {
            "GrLivArea": 1500.0,
            "OverallQual": 6,
        }
    }
    resp = client.post("/api/v1/predict", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    notice = data["explanation"]["interpretation_notice"]
    assert "do not establish causal relationships" in notice


def test_pdf_report_endpoint():
    payload = {
        "features": {
            "GrLivArea": 1600.0,
            "OverallQual": 7,
            "YearBuilt": 2005,
        }
    }
    resp = client.post("/api/v1/reports/pdf", json=payload)
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert len(resp.content) > 1000


def test_conformal_interval_ordering_and_structure():
    payload = {
        "features": {
            "GrLivArea": 1800.0,
            "OverallQual": 7,
            "YearBuilt": 2004,
        },
        "coverage_level": 0.90,
    }
    resp = client.post("/api/v1/predict", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "prediction" in data
    assert "prediction_interval" in data
    assert "uncertainty" in data
    assert "model" in data

    pred = data["prediction"]
    interval = data["prediction_interval"]
    assert interval is not None
    assert interval["lower"] < pred < interval["upper"]
    assert interval["coverage"] == 0.90
    assert interval["interval_width"] > 0
    assert abs((interval["upper"] - interval["lower"]) - interval["interval_width"]) < 0.05

    uncertainty = data["uncertainty"]
    assert uncertainty["method"] == "conformal_prediction"
    assert uncertainty["interval_width"] == interval["interval_width"]
    assert uncertainty["uncertainty_level"] in ["Lower", "Moderate", "Higher"]


def test_conformal_coverage_configuration_95_wider_than_90():
    feat = {
        "GrLivArea": 1800.0,
        "OverallQual": 7,
        "YearBuilt": 2004,
    }
    resp_90 = client.post("/api/v1/predict", json={"features": feat, "coverage_level": 0.90})
    resp_95 = client.post("/api/v1/predict", json={"features": feat, "coverage_level": 0.95})
    assert resp_90.status_code == 200
    assert resp_95.status_code == 200

    int_90 = resp_90.json()["prediction_interval"]
    int_95 = resp_95.json()["prediction_interval"]
    assert int_90 is not None and int_95 is not None
    assert int_95["coverage"] == 0.95
    assert int_90["coverage"] == 0.90
    # 95% interval must be wider than 90% interval
    assert int_95["interval_width"] > int_90["interval_width"]
    assert int_95["lower"] <= int_90["lower"]
    assert int_95["upper"] >= int_90["upper"]


def test_empirical_evaluation_telemetry():
    payload = {
        "features": {
            "GrLivArea": 1700.0,
            "OverallQual": 7,
        },
        "coverage_level": 0.90,
    }
    resp = client.post("/api/v1/predict", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    uncertainty = data["uncertainty"]
    assert uncertainty is not None
    assert uncertainty["observed_coverage"] is not None
    assert 0.80 <= uncertainty["observed_coverage"] <= 1.0
    assert uncertainty["mean_interval_width"] > 0
    assert "Ames Housing" in uncertainty["calibration_dataset"]


def test_unsupported_model_graceful_interval_fallback():
    payload = {
        "features": {
            "GrLivArea": 1600.0,
            "OverallQual": 7,
        },
        "model_override": "UnsupportedNonexistentModel"
    }
    resp = client.post("/api/v1/predict", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    # Point prediction remains available
    assert data["prediction"] > 10000
    # Interval is null/unavailable and not fabricated
    assert data["prediction_interval"] is None
    assert data["metadata"]["interval_available"] is False
    assert "unavailable" in data["metadata"]["interval_unavailable_reason"].lower()


def test_no_misleading_confidence_language():
    payload = {
        "features": {
            "GrLivArea": 1600.0,
            "OverallQual": 7,
        }
    }
    resp = client.post("/api/v1/predict", json=payload)
    data = resp.json()
    text_content = str(data).lower()
    # Must never claim confidence that the exact price is correct
    assert "confidence that this house is worth" not in text_content
    assert "chance the exact" not in text_content
    assert "is a guaranteed market price" not in text_content
    assert "confidence: 90%" not in text_content
    assert "confidence: 95%" not in text_content


