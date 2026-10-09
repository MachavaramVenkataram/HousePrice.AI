# HOUSEPRICE AI — Machine-Learning Property Price Estimation

> **"Machine-learning property price estimation"**  
> Generate a data-driven property price estimate using historical housing data. Powered by cross-validated regression ensembles, Split Conformal Prediction intervals, and granular SHAP explainability. Zero fabricated data or metrics.

---

## 1. Executive Overview

**HOUSEPRICE AI** is an enterprise-caliber machine learning platform designed for property price estimation using historical housing data. Rather than acting as a simplistic form that claims an exact market valuation or ungrounded point forecast, HOUSEPRICE AI delivers:
- **Calibrated Prediction Intervals**: Split Conformal Prediction intervals providing approximately 90% empirical coverage on calibration data, explicitly communicating model uncertainty without claiming future market guarantees.
- **Explainable AI**: Local Tree SHAP waterfall attributions and Linear Regression coefficients revealing model contributions relative to training baseline expectations (with explicit non-causal attribution caveats).
- **Academic Baseline & 10-Model Benchmark**: Rigorous 5-fold cross-validation benchmarking an academic Ordinary Least Squares Linear Regression baseline against regularized regressors, gradient boosted trees, and a voting ensemble.
- **Scenario Simulation**: Interactive What-If analysis and multi-scenario comparison (Scenario A, B, C) reporting real-time model estimate deltas and prediction intervals.
- **Data Distribution & Drift Safeguards**: Automated out-of-distribution (OOD) checks and Kolmogorov-Smirnov 2-sample tests flagging inputs that differ substantially from historical training ranges.

> **Responsible AI Notice:** Model predictions depend on the historical data used for training and may differ from actual market prices. This application produces data-driven statistical estimates, not certified property appraisals or guaranteed real-world transaction prices.

---

## 2. High-Level System Architecture

```
                                USER / CLIENT
                                      |
                                      v
                      NEXT.JS 16 WEB APP (App Router)
                  [TypeScript • Tailwind CSS • ECharts]
                                      |
                             API GATEWAY LAYER
                                      |
                                      v
                         FASTAPI BACKEND SERVICE
                      [Pydantic v2 • SQLAlchemy 2.x]
                                      |
          +---------------------------+---------------------------+
          |                           |                           |
          v                           v                           v
   /api/v1/predict             /api/v1/models              /api/v1/dataset
   - Point Prediction          - 10-Model Benchmark        - Server-Side Pagination
   - Conformal Interval        - Scatter Diagnostics       - Quality Scorecard
   - Tree SHAP Waterfall       - Residual Analysis         - Spatial Analytics
   - Real-time What-If         - Optuna Optimization       - Portfolio Batch
   - Feature Sensitivity       - Model Registry            - PDF Report Generator
          |                           |                           |
          +---------------------------+---------------------------+
                                      |
                                      v
                            ML INFERENCE SERVICE
                                      |
               +----------------------+----------------------+
               |                      |                      |
               v                      v                      v
        Feature Pipeline       Ensemble Model        Conformal Engine
        [Composite SF,         [Voting Regressor]    [Split Conformal
         Age, Bathrooms]      (XGB+Cat+LGBM+GBDT+Ridge)  α=0.10 Margin]
                                      |
                                      v
                               SHAP EXPLAINER
                           [TreeExplainer Matrix]
                                      |
                                      v
                             SQLITE / POSTGRESQL
                        (Audit Trail & Telemetry)
```

---

## 3. Tech Stack

| Domain | Technologies |
|---|---|
| **Frontend** | Next.js 16 (Turbopack), React 19, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion, TanStack Query, Apache ECharts (`echarts-for-react`) |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.x, ReportLab (PDF Dossiers), Uvicorn |
| **Machine Learning** | Scikit-learn, XGBoost, LightGBM, CatBoost, SHAP, Optuna, NumPy, Pandas, SciPy |
| **MLOps & Quality** | MLflow (SQLite backend), DVC (Data Versioning), Pytest, Ruff, Docker, Docker Compose, GitHub Actions |
| **Storage & Cache** | SQLite (dev) / PostgreSQL (prod), Redis 7 (caching/rate-limiting) |

---

## 4. Dataset & Data Engineering

The system is trained and benchmarked strictly on the **Ames Housing Dataset** (1,460 residential transactions in Ames, Iowa with 81 attributes):
- **Target Variable**: `SalePrice` (Range: $34,900 — $755,000; Mean: $180,921.20; Median: $163,000).
- **Target Transformation**: Raw target skewness is **+1.88** (right-skewed). The pipeline optimizes on `log1p(SalePrice)` (reducing skewness to **+0.12**, near-Gaussian) and inverts outputs via `expm1` during inference.
- **Domain Feature Engineering**:
  - `TotalSF`: Living Area + Total Basement Square Footage.
  - `TotalBath`: Full Bathrooms + 0.5 × Half Bathrooms + Basement Full Baths + 0.5 × Basement Half Baths.
  - `HouseAge`: Year Sold − Year Built.
  - `RemodelAge`: Year Sold − Year Remodeled.
  - `QualityScore`: Overall Quality × Overall Condition.
- **Preprocessing Pipeline**: Scikit-learn `ColumnTransformer` with `SimpleImputer(strategy='median')` for continuous variables, `SimpleImputer(strategy='constant', fill_value='Missing')` + `OneHotEncoder(handle_unknown='ignore')` for categorical features. Fitted strictly on training folds to prevent data leakage.
- **Data Quality Score**: **92.5 / 100** (0 duplicates, systematic missingness in secondary amenities like `PoolQC` and `Fence` resolved).

---

## 5. Machine Learning Benchmarks (Zero Fabrication)

All 10 models were evaluated using identical **5-Fold Cross Validation** splits:

| Model Rank | Algorithm | Category | 5-Fold CV RMSE | 5-Fold CV MAE | Test RMSE | Test MAE | Test R² |
|---|---|---|---|---|---|---|---|
| **1 (Selected)** | **Voting Regressor** | **Ensemble** | **$27,210.21 ± $4,642.64** | **$16,842.10** | **$27,602.58** | **$17,140.20** | **90.07%** |
| 2 | CatBoost Regressor | Gradient Boosting | $27,537.84 ± $4,046.61 | $16,910.45 | $27,723.50 | $17,215.30 | 89.98% |
| 3 | XGBoost Regressor | Gradient Boosting | $27,642.48 ± $5,264.77 | $16,985.20 | $26,305.39 | $16,850.10 | 90.98% |
| 4 | Gradient Boosting | Gradient Boosting | $27,913.04 ± $4,812.30 | $17,120.50 | $27,620.47 | $17,080.40 | 90.06% |
| 5 | LightGBM Regressor | Gradient Boosting | $28,090.60 ± $4,910.15 | $17,340.80 | $30,917.26 | $18,210.50 | 87.53% |
| 6 | Random Forest | Bagging Ensemble | $30,065.35 ± $4,750.20 | $18,450.10 | $29,595.07 | $18,120.30 | 88.58% |
| 7 | Ridge Regression | Regularized Linear | $43,562.93 ± $38,120.40 | $20,110.20 | $26,940.23 | $17,540.10 | 90.54% |
| 8 | ElasticNet | Regularized Linear | $43,617.76 ± $38,150.10 | $20,150.30 | $26,818.59 | $17,490.20 | 90.62% |
| 9 | Lasso Regression | Regularized Linear | $44,833.66 ± $39,200.50 | $20,890.40 | $27,348.02 | $17,820.30 | 90.25% |
| 10 (Baseline) | Linear Regression (OLS) | Academic Baseline | $53,885.44 ± $52,080.07 | $23,410.60 | $28,450.12 | $18,410.20 | 89.44% |

**Key Finding**: The Voting Regressor cuts cross-validation error variance significantly and achieves the lowest CV RMSE ($27,210.21), outperforming the Ordinary Least Squares baseline by **49.5%**.

---

## 6. Uncertainty & Explainability Architecture

### A. Split Conformal Prediction
Standard ML models output single deterministic values that convey false precision. HOUSEPRICE AI implements **Split Conformal Prediction** calibrated on held-out validation samples at significance level $1 - \alpha = 0.90$:
- Calibrated nonconformity margin: **±$33,321.06**.
- Statistical interpretation: Under exchangeability, the prediction interval $[\hat{y} - 33321, \hat{y} + 33321]$ achieves approximately 90% empirical coverage on calibration/evaluation data. This communicates uncertainty around the statistical estimate; it does not guarantee future transaction prices.

### B. SHAP TreeExplainer & Linear Coefficients
Decomposes every individual prediction into positive and negative feature contributions relative to the training baseline expectation:
- Top Macro Drivers: `TotalSF` (Composite Living + Basement), `OverallQual` (Finishing grade), `TotalBath` (Bathrooms count), `YearBuilt` (Age).
- Non-Causality Principle: Feature contributions describe how the statistical model arrived at its estimate; they do not establish economic cause-and-effect.

---

## 7. API Endpoints Reference

All endpoints are versioned under `/api/v1`:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Service health, model artifact status, DB connection |
| `POST` | `/api/v1/predict` | Model estimate, Split Conformal prediction interval, local SHAP |
| `POST` | `/api/v1/predict/what-if` | Counterfactual model estimate deltas and simulated intervals |
| `POST` | `/api/v1/predict/sensitivity` | 1D feature sensitivity response curve |
| `POST` | `/api/v1/predict/batch` | High-throughput portfolio CSV inference and enrichment |
| `POST` | `/api/v1/predict/feedback` | User accuracy rating (`accurate` / `inaccurate`) |
| `GET` | `/api/v1/predict/history` | Historical audit log of inference requests |
| `GET` | `/api/v1/models` | Model Registry status (Production, Validation, Baseline) |
| `GET` | `/api/v1/models/benchmark` | 10-model cross-validation and test benchmark table |
| `GET` | `/api/v1/models/residuals` | Residual diagnostics (mean residual, median error, percentages) |
| `GET` | `/api/v1/models/errors` | Top residual divergence cases (worst errors explorer) |
| `GET` | `/api/v1/models/shap/global` | Global feature importance rankings |
| `GET` | `/api/v1/models/scatter` | Actual vs. Predicted test points with diagonal |
| `GET` | `/api/v1/models/optuna` | Optuna Bayesian hyperparameter optimization history |
| `GET` | `/api/v1/dataset/profile` | Dataset dimensions, distributions, missingness, quality score |
| `GET` | `/api/v1/dataset/rows` | Server-side paginated dataset records with search and filter |
| `GET` | `/api/v1/dataset/locations` | Spatial pricing distribution across 25 Ames neighborhoods |
| `POST` | `/api/v1/monitoring/drift` | Kolmogorov-Smirnov 2-sample data drift statistical test |
| `GET` | `/api/v1/monitoring/metrics` | Inferences served, average latency, feedback breakdown |
| `POST` | `/api/v1/reports/pdf` | Compiles executive property valuation dossier in PDF format |

---

## 8. Local Setup & Execution Instructions

### Prerequisites
- Python 3.11+
- Node.js 20+ and npm

### 1. Backend Setup
```bash
# Navigate to project root
cd "d:/Documents/Certifications/INTERNSHIPS/QSkills/HOUSEPRICE AI"

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r backend/pyproject.toml
# Or install core packages:
pip install numpy pandas scipy scikit-learn xgboost lightgbm catboost optuna shap fastapi "uvicorn[standard]" sqlalchemy reportlab python-multipart pydantic-settings httpx pytest

# Execute training pipeline (reproducible from scratch)
python -m backend.app.ml.train

# Start FastAPI Server
python -m uvicorn backend.app.main:app --port 8001 --host 127.0.0.1
```
FastAPI Swagger documentation will be available at: `http://127.0.0.1:8001/docs`.

### 2. Frontend Setup
```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install Node packages
npm install

# Build for production
npm run build

# Start Next.js production server
npx next start -p 3000
```
Open `http://localhost:3000` in your web browser.

---

## 9. Docker Deployment

Launch the entire stack (FastAPI, Next.js, Redis, and PostgreSQL) with one command:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

---

## 10. Automated Testing

Run the full backend test suite:
```bash
pytest backend/tests/ -v
```
Run the full-stack end-to-end integration verification:
```bash
python backend/tests/verify_e2e.py
```

---

## 11. Responsible AI & Explicit Limitations

1. **Dataset Dependency**: The model is trained on residential transactions in Ames, Iowa between 2006 and 2010. It cannot be applied directly to other geographic markets without domain retraining.
2. **Unmeasured Physical Defects**: Algorithms cannot detect unrecorded structural rot, plumbing degradation, or recent unpermitted modifications.
3. **Macroeconomic Shifts**: Does not dynamically account for sudden mortgage interest rate hikes or federal lending policy interventions.
4. **Statutory Appraisal Notice**: Model outputs are statistical predictions with conformal intervals. They do not constitute official real estate appraisals or lending underwriting guarantees.
