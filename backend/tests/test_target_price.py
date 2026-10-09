import os
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

SAMPLE_PROFILE = {
    "GrLivArea": 1750.0,
    "TotalBsmtSF": 900.0,
    "1stFlrSF": 950.0,
    "2ndFlrSF": 800.0,
    "YearBuilt": 2005,
    "YearRemodAdd": 2006,
    "OverallQual": 7,
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
}


def test_target_price_capabilities():
    """Verify capabilities endpoint returns supported tunable features and constraints."""
    resp = client.get("/api/v1/target-price/capabilities")
    assert resp.status_code == 200
    data = resp.json()
    assert "supported_features" in data
    assert "objectives" in data
    assert "GrLivArea" in data["supported_features"]
    assert "OverallQual" in data["supported_features"]
    objective_ids = [o["id"] for o in data["objectives"]]
    assert "closest_target" in objective_ids
    assert "smallest_feature_changes" in objective_ids
    assert "balanced" in objective_ids


def test_target_price_valid_target_closest():
    """Verify scenario search with valid $250k target and closest_target objective."""
    payload = {
        "target_price": 250000.0,
        "starting_features": SAMPLE_PROFILE,
        "objective": "closest_target",
        "max_scenarios": 5,
        "changeable_features": ["GrLivArea", "OverallQual", "GarageCars", "FullBath"],
    }
    resp = client.post("/api/v1/target-price/search", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["target_amount"] == 250000.0
    assert data["objective"] == "closest_target"
    assert data["feasible_count"] > 0
    assert len(data["scenarios"]) > 0
    assert "disclaimer" in data
    assert "These scenarios show how the trained model responds" in data["disclaimer"]

    # Verify each scenario has required structure
    for sc in data["scenarios"]:
        assert "predicted_price" in sc
        assert "difference_from_target" in sc
        assert "absolute_difference" in sc
        assert "changed_features" in sc
        assert sc["model_name"] is not None
        assert abs(sc["difference_from_target"]) <= 60000.0  # reasonable closeness for $250k


def test_target_price_smallest_feature_changes():
    """Verify smallest_feature_changes objective penalizes large edits."""
    payload = {
        "target_price": 240000.0,
        "starting_features": SAMPLE_PROFILE,
        "objective": "smallest_feature_changes",
        "max_scenarios": 3,
        "changeable_features": ["OverallQual", "GrLivArea"],
    }
    resp = client.post("/api/v1/target-price/search", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["feasible_count"] > 0
    assert len(data["scenarios"]) > 0
    first = data["scenarios"][0]
    assert "objective_score" in first


def test_target_price_balanced_objective():
    """Verify balanced objective functions correctly."""
    payload = {
        "target_price": 220000.0,
        "starting_features": SAMPLE_PROFILE,
        "objective": "balanced",
        "max_scenarios": 3,
    }
    resp = client.post("/api/v1/target-price/search", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["feasible_count"] > 0


def test_target_price_unfeasible_too_low():
    """Target far below Ames minimum ($12,000) should return infeasible with clear explanation."""
    payload = {
        "target_price": 12000.0,
        "starting_features": SAMPLE_PROFILE,
        "objective": "closest_target",
    }
    resp = client.post("/api/v1/target-price/search", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["feasible_count"] == 0
    assert len(data["scenarios"]) == 0
    assert data["explanation"] is not None
    assert "below" in data["explanation"].lower() or "outside" in data["explanation"].lower()


def test_target_price_unfeasible_too_high():
    """Target far above Ames maximum ($1,900,000) should return infeasible with clear explanation."""
    payload = {
        "target_price": 1900000.0,
        "starting_features": SAMPLE_PROFILE,
        "objective": "closest_target",
    }
    resp = client.post("/api/v1/target-price/search", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["feasible_count"] == 0
    assert len(data["scenarios"]) == 0
    assert data["explanation"] is not None
    assert "above" in data["explanation"].lower() or "outside" in data["explanation"].lower()


def test_target_price_discrete_integer_adherence():
    """Discrete fields such as BedroomAbvGr and FullBath must remain integers in candidate scenarios."""
    payload = {
        "target_price": 260000.0,
        "starting_features": SAMPLE_PROFILE,
        "objective": "closest_target",
        "changeable_features": ["BedroomAbvGr", "FullBath", "OverallQual", "GarageCars"],
        "max_scenarios": 5,
    }
    resp = client.post("/api/v1/target-price/search", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    for sc in data["scenarios"]:
        feat = sc["features"]
        assert isinstance(feat["OverallQual"], int)
        assert isinstance(feat["FullBath"], int)
        assert isinstance(feat["BedroomAbvGr"], int)
        assert isinstance(feat["GarageCars"], int)


def test_target_price_deterministic_results():
    """Two identical calls should produce deterministic scenario order and results."""
    payload = {
        "target_price": 230000.0,
        "starting_features": SAMPLE_PROFILE,
        "objective": "closest_target",
        "changeable_features": ["GrLivArea", "OverallQual"],
        "max_scenarios": 3,
    }
    resp1 = client.post("/api/v1/target-price/search", json=payload).json()
    resp2 = client.post("/api/v1/target-price/search", json=payload).json()

    assert len(resp1["scenarios"]) == len(resp2["scenarios"])
    for s1, s2 in zip(resp1["scenarios"], resp2["scenarios"]):
        assert s1["predicted_price"] == s2["predicted_price"]
        assert s1["features"] == s2["features"]
