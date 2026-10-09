import httpx
import sys

def main():
    client = httpx.Client(timeout=15.0)

    print("=== 1. TESTING NEXT.JS FRONTEND ROUTES ===")
    routes = [
        "/",
        "/predict",
        "/target-price",
        "/what-if",
        "/model-lab",
        "/data-explorer",
        "/analytics",
        "/monitoring",
        "/history",
        "/batch",
        "/how-it-works",
    ]
    for r in routes:
        res = client.get(f"http://localhost:3000{r}")
        assert res.status_code == 200, f"Route {r} returned {res.status_code}"
        print(f"Frontend {r.ljust(15)}: HTTP 200 OK (size: {len(res.text):,} bytes)")

    print("\n=== 2. TESTING FASTAPI BACKEND SERVICES ===")
    # Health
    h = client.get("http://127.0.0.1:8001/api/v1/health")
    assert h.status_code == 200
    print("GET  /health           : HTTP 200 OK ->", h.json())

    # Benchmark
    b = client.get("http://127.0.0.1:8001/api/v1/models/benchmark")
    assert b.status_code == 200
    b_data = b.json()
    print(f"GET  /models/benchmark : HTTP 200 OK -> {len(b_data)} models benchmarked")
    print(f"     Top Model: {b_data[0]['model']} (CV RMSE: ${b_data[0]['cv_rmse_mean']:,.2f})")
    print(f"     Baseline : {b_data[-1]['model']} (CV RMSE: ${b_data[-1]['cv_rmse_mean']:,.2f})")

    # Flagship Predict
    features = {
        "GrLivArea": 2200, "TotalBsmtSF": 1200, "1stFlrSF": 1200, "2ndFlrSF": 1000,
        "YearBuilt": 2004, "YearRemodAdd": 2004, "OverallQual": 8, "OverallCond": 5,
        "FullBath": 2, "HalfBath": 1, "BsmtFullBath": 1, "BedroomAbvGr": 3,
        "TotRmsAbvGrd": 8, "Fireplaces": 1, "GarageCars": 2, "GarageArea": 540,
        "LotArea": 10500, "LotFrontage": 75, "WoodDeckSF": 140, "OpenPorchSF": 50,
        "MoSold": 5, "YrSold": 2008, "Neighborhood": "CollgCr", "BldgType": "1Fam",
        "HouseStyle": "2Story", "MSZoning": "RL", "KitchenQual": "Gd", "BsmtQual": "Gd",
        "HeatingQC": "Ex", "CentralAir": "Y", "GarageType": "Attchd", "SaleCondition": "Normal"
    }
    p = client.post("http://127.0.0.1:8001/api/v1/predict", json={"features": features})
    assert p.status_code == 200
    p_data = p.json()
    print(f"POST /predict          : HTTP 200 OK")
    print(f"     Model             : {p_data['model']} ({p_data['model_version']})")
    print(f"     Point Valuation   : ${p_data['predicted_price']:,.2f}")
    print(f"     90% Prediction Int: ${p_data['prediction_interval']['lower_bound']:,.2f} — ${p_data['prediction_interval']['upper_bound']:,.2f} (Margin: ±${p_data['prediction_interval']['margin']:,.2f})")
    print(f"     Local SHAP Drivers: {len(p_data['explanations'])} features analyzed")
    for exp in p_data["explanations"][:3]:
        print(f"       • {exp['label']}: ${exp['impact']:+,.2f}")

    # What-If Simulator
    mod_features = dict(features)
    mod_features["GrLivArea"] = 2600
    mod_features["OverallQual"] = 9
    wi = client.post("http://127.0.0.1:8001/api/v1/predict/what-if", json={
        "base_features": features,
        "modified_features": mod_features
    })
    assert wi.status_code == 200
    wi_data = wi.json()
    print(f"POST /predict/what-if  : HTTP 200 OK -> Baseline: ${wi_data['original_price']:,.2f} | Simulated: ${wi_data['new_price']:,.2f} | Delta: ${wi_data['difference']:+,.2f} ({wi_data['percentage_change']:+.2f}%)")

    # Sensitivity Curve
    sens = client.post("http://127.0.0.1:8001/api/v1/predict/sensitivity", json={
        "base_features": features,
        "target_feature": "GrLivArea",
        "steps": 7
    })
    assert sens.status_code == 200
    sens_data = sens.json()
    print(f"POST /predict/sensitiv : HTTP 200 OK -> {len(sens_data['points'])} points generated for {sens_data['target_feature']}")

    # Kolmogorov-Smirnov Drift Test
    drift = client.post("http://127.0.0.1:8001/api/v1/monitoring/drift")
    assert drift.status_code == 200
    d_data = drift.json()
    print(f"POST /monitoring/drift : HTTP 200 OK -> Drift Detected: {d_data['drift_detected']} (Tests run: {len(d_data['feature_tests'])})")

    # Dataset Explorer
    rows = client.get("http://127.0.0.1:8001/api/v1/dataset/rows?page=1&page_size=5")
    assert rows.status_code == 200
    r_data = rows.json()
    print(f"GET  /dataset/rows     : HTTP 200 OK -> {r_data['total']} total rows in Ames Housing dataset")

    # Locations
    locs = client.get("http://127.0.0.1:8001/api/v1/dataset/locations")
    assert locs.status_code == 200
    print(f"GET  /dataset/locations: HTTP 200 OK -> {len(locs.json())} neighborhoods analyzed")

    # Valuation PDF Report
    pdf = client.post("http://127.0.0.1:8001/api/v1/reports/pdf", json={"features": features})
    assert pdf.status_code == 200
    assert len(pdf.content) > 1000
    print(f"POST /reports/pdf      : HTTP 200 OK -> Generated {len(pdf.content):,} bytes PDF valuation certificate")

    # Feature 1: Target Price Explorer
    tp = client.post("http://127.0.0.1:8001/api/v1/target-price/search", json={
        "target_price": 250000.0,
        "starting_features": features,
        "objective": "closest_target",
        "max_scenarios": 3,
        "changeable_features": ["GrLivArea", "OverallQual", "BedroomAbvGr", "FullBath"]
    })
    assert tp.status_code == 200
    tp_data = tp.json()
    print(f"POST /target-price/search: HTTP 200 OK -> Found {tp_data['feasible_count']} scenarios for ${tp_data['target_amount']:,.2f}")
    if tp_data['scenarios']:
        best = tp_data['scenarios'][0]
        print(f"     Best Match Estimate : ${best['predicted_price']:,.2f} (Delta: ${best['difference_from_target']:+,.2f})")

    # Feature 2: Model Applicability Checker
    app_chk = client.post("http://127.0.0.1:8001/api/v1/applicability/check", json=features)
    assert app_chk.status_code == 200
    app_data = app_chk.json()
    print(f"POST /applicability/check: HTTP 200 OK -> Status: {app_data['status']} ({len(app_data['checks'])} validation checks satisfied)")

    # Feature 3: Model Release Manager
    rel_stat = client.get("http://127.0.0.1:8001/api/v1/models/releases/status")
    assert rel_stat.status_code == 200
    rel_data = rel_stat.json()
    print(f"GET  /models/releases/st : HTTP 200 OK -> Active Model: {rel_data['current_production_model']['name']} ({len(rel_data['candidates'])} candidates tracked)")

    print("\n>>> ALL FULL-STACK INTEGRATION TESTS PASSED WITH 100% SUCCESS! <<<")

if __name__ == "__main__":
    main()
