import os
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_release_status_endpoint():
    """Verify release status endpoint returns current model, candidates, and criteria."""
    resp = client.get("/api/v1/models/releases/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "current_production_model" in data
    assert data["current_production_model"]["name"] is not None
    assert "promotion_criteria" in data
    assert len(data["promotion_criteria"]) >= 5
    assert "candidates" in data
    assert len(data["candidates"]) > 0


def test_release_compare_endpoint():
    """Verify comparing current model with a candidate model."""
    status_resp = client.get("/api/v1/models/releases/status").json()
    candidate_name = status_resp["candidates"][0]["name"]

    resp = client.get(f"/api/v1/models/releases/compare?candidate_name={candidate_name}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["current_model"] is not None
    assert data["candidate_model"] == candidate_name
    assert "comparison_rows" in data
    assert len(data["comparison_rows"]) >= 3
    assert "overall_recommendation" in data


def test_release_validate_candidate():
    """Verify technical criteria validation for a candidate."""
    status_resp = client.get("/api/v1/models/releases/status").json()
    candidate_name = status_resp["candidates"][0]["name"]

    resp = client.post("/api/v1/models/releases/validate", json={"candidate_name": candidate_name})
    assert resp.status_code == 200
    data = resp.json()
    assert data["candidate_name"] == candidate_name
    assert len(data["criteria"]) >= 5
    assert isinstance(data["is_promotable"], bool)


def test_release_promote_and_rollback():
    """Verify promoting a model with hot-swap and then rolling back safely."""
    # First get status
    status_resp = client.get("/api/v1/models/releases/status").json()
    original_model = status_resp["current_production_model"]["name"]
    candidate = status_resp["candidates"][0]["name"]

    # Validate first
    val_resp = client.post("/api/v1/models/releases/validate", json={"candidate_name": candidate}).json()

    # Promote
    promote_payload = {
        "candidate_name": candidate,
        "approver": "Lead ML Engineer",
        "notes": "Automated verification test promotion",
    }
    prom_resp = client.post("/api/v1/models/releases/promote", json=promote_payload)
    assert prom_resp.status_code == 200
    prom_data = prom_resp.json()
    assert prom_data["current_production_model"]["name"] == candidate

    # Test rollback
    roll_resp = client.post(
        "/api/v1/models/releases/rollback",
        json={"approver": "Lead ML Engineer", "notes": "Test rollback"}
    )
    assert roll_resp.status_code == 200
    roll_data = roll_resp.json()
    assert roll_data["current_production_model"]["name"] == original_model


def test_release_invalid_candidate():
    """Attempting to validate a nonexistent model should return 400 or 500 error."""
    resp = client.post("/api/v1/models/releases/validate", json={"candidate_name": "NonExistentModel_999"})
    assert resp.status_code in [400, 422, 500]
