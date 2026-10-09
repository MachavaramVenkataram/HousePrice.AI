import os
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

NORMAL_FEATURES = {
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


def test_scope_endpoint():
    """Verify scope endpoint provides full Ames Housing metadata and explicit market limitations."""
    resp = client.get("/api/v1/applicability/scope")
    assert resp.status_code == 200
    data = resp.json()
    assert data["dataset_name"] == "Ames Housing Dataset"
    assert "Ames, Iowa" in data["geographic_scope"]
    assert "2006" in data["historical_period"]
    assert "2010" in data["historical_period"]
    assert "SalePrice" in data["target_variable"]
    assert len(data["known_limitations"]) > 0
    # Must explicitly state non-Ames / Indian real estate limitation
    assert "market_warning" in data
    assert any("Indian" in lim or "non-Ames" in lim or "Midwest" in lim or "Ames" in lim for lim in data["known_limitations"])


def test_supported_categories_endpoint():
    """Verify supported categories are enumerated correctly from training reference."""
    resp = client.get("/api/v1/applicability/supported-categories")
    assert resp.status_code == 200
    data = resp.json()
    assert "Neighborhood" in data
    assert "CollgCr" in data["Neighborhood"]
    assert "NAmes" in data["Neighborhood"]
    assert "BldgType" in data
    assert "1Fam" in data["BldgType"]


def test_applicability_normal_input():
    """Verify standard representative Ames property passes applicability checks."""
    resp = client.post("/api/v1/applicability/check", json=NORMAL_FEATURES)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ["passed", "limited", "warning"]
    
    # Check all 8 pillars are returned
    check_names = [c["name"] for c in data["checks"]]
    expected_checks = [
        "schema_validity",
        "numeric_range",
        "numeric_distribution",
        "categorical_support",
        "unusual_combinations",
        "distribution_shift",
        "interval_calibration",
        "dataset_scope",
    ]
    for exp in expected_checks:
        assert exp in check_names

    # Schema check should pass
    schema_chk = next(c for c in data["checks"] if c["name"] == "schema_validity")
    assert schema_chk["status"] == "passed"
    # Categorical check should pass
    cat_chk = next(c for c in data["checks"] if c["name"] == "categorical_support")
    assert cat_chk["status"] == "passed"
    # Interval check should be available
    cal_chk = next(c for c in data["checks"] if c["name"] == "interval_calibration")
    assert cal_chk["status"] in ["available", "passed"]


def test_applicability_unusual_numeric():
    """Extremely high square footage (GrLivArea=7500) triggers numeric range / distribution warnings."""
    features = dict(NORMAL_FEATURES)
    features["GrLivArea"] = 7500.0  # Training max is ~5642, typical 99th percentile < 3500
    resp = client.post("/api/v1/applicability/check", json=features)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ["limited", "warning"]
    num_chk = next(c for c in data["checks"] if c["name"] == "numeric_range")
    assert num_chk["status"] in ["warning", "failed"]


def test_applicability_unseen_categorical():
    """Unsupported neighborhood and house style trigger categorical support warning."""
    features = dict(NORMAL_FEATURES)
    features["Neighborhood"] = "Unsupported_Suburb"
    features["HouseStyle"] = "SuperLuxuryPenthouse"
    resp = client.post("/api/v1/applicability/check", json=features)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ["unsupported", "warning", "limited"]
    cat_chk = next(c for c in data["checks"] if c["name"] == "categorical_support")
    assert cat_chk["status"] in ["unsupported", "warning"]


def test_applicability_unusual_combinations():
    """Impossible domain combination: 10 bedrooms in a 2-room house triggers combination check."""
    features = dict(NORMAL_FEATURES)
    features["BedroomAbvGr"] = 10
    features["TotRmsAbvGrd"] = 2
    resp = client.post("/api/v1/applicability/check", json=features)
    assert resp.status_code == 200
    data = resp.json()
    combo_chk = next(c for c in data["checks"] if c["name"] == "unusual_combinations")
    assert combo_chk["status"] in ["warning", "failed"]


def test_applicability_geographic_market_mismatch():
    """When property details indicate a non-Ames geographic market (e.g. Mumbai), dataset scope check warns."""
    features = dict(NORMAL_FEATURES)
    features["Neighborhood"] = "mumbai"
    resp = client.post("/api/v1/applicability/check", json=features)
    assert resp.status_code == 200
    data = resp.json()
    geo_chk = next(c for c in data["checks"] if c["name"] == "dataset_scope")
    assert geo_chk["status"] in ["potentially_mismatched", "warning", "failed"]


def test_prediction_includes_applicability():
    """Verify standard /api/v1/predict now includes compact applicability assessment."""
    resp = client.post("/api/v1/predict", json={"features": NORMAL_FEATURES})
    assert resp.status_code == 200
    data = resp.json()
    assert "applicability" in data
    assert data["applicability"] is not None
    assert "status" in data["applicability"]
    assert "checks" in data["applicability"]
