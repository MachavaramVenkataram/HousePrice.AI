import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import engine, Base
from backend.app.db.models import PredictionRecord, SavedScenario

Base.metadata.create_all(bind=engine)
client = TestClient(app)


def test_property_profile_and_input_quality():
    payload = {
        "GrLivArea": 1750.0,
        "TotalBsmtSF": 900.0,
        "1stFlrSF": 950.0,
        "2ndFlrSF": 800.0,
        "YearBuilt": 2004,
        "YearRemodAdd": 2004,
        "OverallQual": 7,
        "OverallCond": 5,
        "FullBath": 2,
        "HalfBath": 1,
        "BsmtFullBath": 1,
        "BedroomAbvGr": 3,
        "TotRmsAbvGrd": 7,
        "Fireplaces": 1,
        "GarageCars": 2,
        "GarageArea": 500.0,
        "LotArea": 9000.0,
        "Neighborhood": "CollgCr",
    }
    res = client.post("/api/v1/decision/profile", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "profile" in data
    assert "input_quality" in data
    assert data["profile"]["bedrooms"] == 3
    assert data["profile"]["overall_quality"] == 7
    assert data["input_quality"]["status"] in ["Excellent", "Good", "Limited"]
    assert len(data["profile"]["feature_chips"]) > 0


def test_similar_historical_properties():
    payload = {
        "GrLivArea": 1750.0,
        "TotalBsmtSF": 900.0,
        "1stFlrSF": 950.0,
        "2ndFlrSF": 800.0,
        "YearBuilt": 2004,
        "YearRemodAdd": 2004,
        "OverallQual": 7,
        "OverallCond": 5,
        "FullBath": 2,
        "HalfBath": 1,
        "BsmtFullBath": 1,
        "BedroomAbvGr": 3,
        "TotRmsAbvGrd": 7,
        "Fireplaces": 1,
        "GarageCars": 2,
        "GarageArea": 500.0,
        "LotArea": 9000.0,
        "Neighborhood": "CollgCr",
    }
    res = client.post("/api/v1/decision/similar?estimated_price=220000.0&priority=balanced&top_k=5", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["comparable_count"] == 5
    assert len(data["comparables"]) == 5
    assert data["comparable_median_price"] > 0
    assert data["comparables"][0]["similarity_pct"] > 0
    assert "Ames Housing" in data["historical_disclaimer"]
    # Check deterministic ordering by distance
    for i in range(len(data["comparables"]) - 1):
        assert data["comparables"][i]["distance"] <= data["comparables"][i + 1]["distance"]


def test_estimate_reliability_and_model_consensus():
    payload = {
        "GrLivArea": 1750.0,
        "TotalBsmtSF": 900.0,
        "1stFlrSF": 950.0,
        "2ndFlrSF": 800.0,
        "YearBuilt": 2004,
        "YearRemodAdd": 2004,
        "OverallQual": 7,
        "OverallCond": 5,
        "FullBath": 2,
        "HalfBath": 1,
        "BsmtFullBath": 1,
        "BedroomAbvGr": 3,
        "TotRmsAbvGrd": 7,
        "Fireplaces": 1,
        "GarageCars": 2,
        "GarageArea": 500.0,
        "LotArea": 9000.0,
        "Neighborhood": "CollgCr",
    }
    res = client.post("/api/v1/decision/reliability?interval_width=50000.0&estimated_price=220000.0", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["overall_reliability"] in ["Strong", "Moderate", "Limited", "Unavailable", "High", "Medium"]
    assert len(data["dimensions"]) == 5
    assert data["consensus"] is not None
    assert len(data["consensus"]["models"]) >= 2
    assert data["consensus"]["spread_percentage"] >= 0


def test_affordability_planner():
    payload = {
        "budget": 260000.0,
        "estimated_price": 240000.0,
        "down_payment": 48000.0,
        "interest_rate_pct": 6.5,
        "loan_term_years": 30,
        "monthly_property_tax": 250.0,
        "monthly_home_insurance": 100.0,
    }
    res = client.post("/api/v1/decision/affordability", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["loan_amount"] == 192000.0
    assert data["down_payment_pct"] == 20.0
    assert data["monthly_principal_interest"] > 0
    assert data["total_monthly_payment"] > data["monthly_principal_interest"]
    assert data["is_within_budget"] is True
    assert data["budget_delta"] == 20000.0
    assert "Illustrative payment calculation" in data["disclaimer"]


def test_affordability_edge_cases():
    # 1. Zero interest rate
    p_zero_int = {
        "budget": 250000.0,
        "estimated_price": 240000.0,
        "down_payment": 40000.0,
        "interest_rate_pct": 0.0,
        "loan_term_years": 30,
        "monthly_property_tax": 0.0,
        "monthly_home_insurance": 0.0,
    }
    res = client.post("/api/v1/decision/affordability", json=p_zero_int)
    assert res.status_code == 200
    d = res.json()
    assert d["loan_amount"] == 200000.0
    assert round(d["monthly_principal_interest"], 2) == round(200000.0 / 360, 2)
    assert d["total_interest_paid"] == 0.0

    # 2. Zero down payment
    p_zero_down = {
        "budget": 250000.0,
        "estimated_price": 200000.0,
        "down_payment": 0.0,
        "interest_rate_pct": 5.0,
        "loan_term_years": 15,
        "monthly_property_tax": 100.0,
        "monthly_home_insurance": 50.0,
    }
    res2 = client.post("/api/v1/decision/affordability", json=p_zero_down)
    assert res2.status_code == 200
    d2 = res2.json()
    assert d2["loan_amount"] == 200000.0
    assert d2["down_payment_pct"] == 0.0

    # 3. Full price down payment (100% cash)
    p_full_down = {
        "budget": 250000.0,
        "estimated_price": 200000.0,
        "down_payment": 200000.0,
        "interest_rate_pct": 6.5,
        "loan_term_years": 30,
        "monthly_property_tax": 100.0,
        "monthly_home_insurance": 50.0,
    }
    res3 = client.post("/api/v1/decision/affordability", json=p_full_down)
    assert res3.status_code == 200
    d3 = res3.json()
    assert d3["loan_amount"] == 0.0
    assert d3["monthly_principal_interest"] == 0.0
    assert d3["total_interest_paid"] == 0.0


def test_improvement_simulation():
    payload = {
        "GrLivArea": 1750.0,
        "TotalBsmtSF": 900.0,
        "1stFlrSF": 950.0,
        "2ndFlrSF": 800.0,
        "YearBuilt": 2004,
        "YearRemodAdd": 2004,
        "OverallQual": 7,
        "OverallCond": 5,
        "FullBath": 2,
        "HalfBath": 1,
        "BsmtFullBath": 1,
        "BedroomAbvGr": 3,
        "TotRmsAbvGrd": 7,
        "Fireplaces": 1,
        "GarageCars": 2,
        "GarageArea": 500.0,
        "LotArea": 9000.0,
        "Neighborhood": "CollgCr",
    }
    res = client.post("/api/v1/decision/improve", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["scenarios"]) >= 3
    for s in data["scenarios"]:
        assert s["potential_estimate"] > 0
        assert s["top_driver"] != ""
        assert "Model-estimated change" in data["disclaimer"]


def test_saved_scenarios_crud():
    payload = {
        "name": "Dream CollgCr Option",
        "description": "3 Bed, 2 Bath with 2-car garage",
        "features": {
            "GrLivArea": 1750.0,
            "TotalBsmtSF": 900.0,
            "1stFlrSF": 950.0,
            "2ndFlrSF": 800.0,
            "YearBuilt": 2004,
            "YearRemodAdd": 2004,
            "OverallQual": 7,
            "OverallCond": 5,
            "FullBath": 2,
            "HalfBath": 1,
            "BsmtFullBath": 1,
            "BedroomAbvGr": 3,
            "TotRmsAbvGrd": 7,
            "Fireplaces": 1,
            "GarageCars": 2,
            "GarageArea": 500.0,
            "LotArea": 9000.0,
            "Neighborhood": "CollgCr",
        },
        "predicted_price": 225000.0,
        "lower_bound": 190000.0,
        "upper_bound": 260000.0,
        "model_name": "CatBoost",
        "model_version": "v1.0.0",
    }
    # 1. Create with model_version
    res = client.post("/api/v1/decision/scenarios", json=payload)
    assert res.status_code == 200
    created = res.json()
    scenario_id = created["id"]
    assert created["name"] == "Dream CollgCr Option"
    assert created["model_version"] == "v1.0.0"

    # 2. List
    list_res = client.get("/api/v1/decision/scenarios")
    assert list_res.status_code == 200
    scenarios = list_res.json()
    assert any(s["id"] == scenario_id for s in scenarios)

    # 3. Update (Rename & modify price)
    update_res = client.put(f"/api/v1/decision/scenarios/{scenario_id}", json={
        "name": "Renamed CollgCr Option",
        "predicted_price": 230000.0,
    })
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["name"] == "Renamed CollgCr Option"
    assert updated["predicted_price"] == 230000.0

    # 4. Duplicate
    dup_res = client.post(f"/api/v1/decision/scenarios/{scenario_id}/duplicate")
    assert dup_res.status_code == 200
    duplicated = dup_res.json()
    dup_id = duplicated["id"]
    assert "Copy of" in duplicated["name"]
    assert duplicated["model_version"] == "v1.0.0"

    # 5. Clean up / Delete both
    del_res1 = client.delete(f"/api/v1/decision/scenarios/{scenario_id}")
    assert del_res1.status_code == 200
    del_res2 = client.delete(f"/api/v1/decision/scenarios/{dup_id}")
    assert del_res2.status_code == 200


def test_property_profiles_lifecycle_and_comparison():
    payload = {
        "name": "My Current Home",
        "description": "Baseline primary property profile",
        "features": {
            "GrLivArea": 1600.0,
            "TotalBsmtSF": 950.0,
            "1stFlrSF": 950.0,
            "2ndFlrSF": 650.0,
            "YearBuilt": 1985,
            "YearRemodAdd": 1995,
            "OverallQual": 7,
            "OverallCond": 5,
            "FullBath": 2,
            "HalfBath": 1,
            "BsmtFullBath": 1,
            "BedroomAbvGr": 3,
            "TotRmsAbvGrd": 7,
            "Fireplaces": 1,
            "GarageCars": 2,
            "GarageArea": 480.0,
            "LotArea": 9500.0,
            "Neighborhood": "CollgCr",
        },
        "estimated_price": 215000.0,
        "lower_bound": 190000.0,
        "upper_bound": 240000.0,
        "model_name": "Voting Ensemble",
        "model_version": "v1.0.0",
    }
    # 1. Create profile
    res = client.post("/api/v1/decision/profiles", json=payload)
    assert res.status_code == 200
    p1 = res.json()
    p1_id = p1["id"]
    assert p1["name"] == "My Current Home"

    # 2. Create second profile
    payload2 = {**payload, "name": "Property B (Starter)", "estimated_price": 175000.0}
    res2 = client.post("/api/v1/decision/profiles", json=payload2)
    assert res2.status_code == 200
    p2 = res2.json()
    p2_id = p2["id"]

    # 3. List profiles
    list_res = client.get("/api/v1/decision/profiles")
    assert list_res.status_code == 200
    profiles = list_res.json()
    assert len(profiles) >= 2

    # 4. Compare profiles
    comp_res = client.post("/api/v1/decision/profiles/compare", json=[p1_id, p2_id])
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["count"] == 2
    assert comp_data["profiles"][0]["name"] in ["My Current Home", "Property B (Starter)"]

    # 5. Clean up
    client.delete(f"/api/v1/decision/profiles/{p1_id}")
    client.delete(f"/api/v1/decision/profiles/{p2_id}")


def test_multi_budget_scenarios():
    scenarios = [
        {
            "budget": 220000.0,
            "estimated_price": 240000.0,
            "down_payment": 44000.0,
            "interest_rate_pct": 6.5,
            "loan_term_years": 30,
            "monthly_property_tax": 220.0,
            "monthly_home_insurance": 90.0,
        },
        {
            "budget": 250000.0,
            "estimated_price": 240000.0,
            "down_payment": 50000.0,
            "interest_rate_pct": 6.0,
            "loan_term_years": 30,
            "monthly_property_tax": 240.0,
            "monthly_home_insurance": 95.0,
        },
    ]
    res = client.post("/api/v1/decision/affordability/compare", json=scenarios)
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2
    assert data[0]["is_within_budget"] is False
    assert data[1]["is_within_budget"] is True


def test_comparable_filters_and_scopes():
    payload = {
        "GrLivArea": 1600.0,
        "TotalBsmtSF": 950.0,
        "1stFlrSF": 950.0,
        "2ndFlrSF": 650.0,
        "YearBuilt": 1985,
        "YearRemodAdd": 1995,
        "OverallQual": 7,
        "OverallCond": 5,
        "FullBath": 2,
        "HalfBath": 1,
        "BsmtFullBath": 1,
        "BedroomAbvGr": 3,
        "TotRmsAbvGrd": 7,
        "Fireplaces": 1,
        "GarageCars": 2,
        "GarageArea": 480.0,
        "LotArea": 9500.0,
        "Neighborhood": "CollgCr",
    }
    # Test with closest match scope and age priority
    res = client.post("/api/v1/decision/similar?estimated_price=215000&priority=age&match_scope=closest&top_k=4", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["comparables"]) == 4
    for comp in data["comparables"]:
        assert comp["record_id"].startswith("AMES-")
        assert comp["similarity_rank"] >= 1
        assert len(comp["key_match_attributes"]) > 0
        assert len(comp["why_selected"]) > 0
        assert comp["distance"] >= 0

