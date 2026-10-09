# HousePrice AI: Statistical Uncertainty & Conformal Prediction Guide

## 1. Executive Summary

Standard supervised regression models output a single scalar point estimate $\hat{y} = f(x)$. In real estate pricing, presenting a point estimate alone creates a dangerous illusion of exactness. Furthermore, presenting arbitrary "confidence" percentages (e.g. *"95% confidence that this house is worth $245,000"*) is statistically fallacious:
- The probability that a continuous real-valued random variable $Y$ equals an exact single number $\hat{y}$ is precisely zero: $P(Y = \hat{y}) = 0$.
- Arbitrary margin buffers (such as $\hat{y} \pm 10\%$ or heuristic standard deviation multipliers) have no empirical coverage guarantees on skewed, heteroscedastic housing data.

**HousePrice AI** implements a statistically defensible uncertainty framework grounded in **Inductive Split Conformal Prediction** (Vovk et al., Lei et al.). This framework provides rigorous, distribution-free prediction intervals:
$$\mathcal{C}(X_{new}) = [ \hat{y} - q_{1-\alpha}, \; \hat{y} + q_{1-\alpha} ]$$
with finite-sample coverage guarantees evaluated on held-out test data.

---

## 2. Theoretical Foundations

### 2.1 Prediction Interval vs. Confidence Interval
It is critical to distinguish between these two frequently conflated concepts:

| Dimension | Prediction Interval (Implemented) | Confidence Interval (Parameter Estimate) |
| :--- | :--- | :--- |
| **Target Quantity** | An **individual future observation** $Y_{n+1}$ (e.g. the sale price of a specific house). | A **population parameter** $\theta$ or expected value $\mathbb{E}[Y \mid X]$ (e.g. average neighborhood price). |
| **Variance Sources** | Model estimation uncertainty $\text{Var}(\hat{f}(X)) +$ irreducible observation noise $\sigma^2$. | Model parameter estimation uncertainty $\text{Var}(\hat{\theta})$ only. |
| **Relative Width** | **Substantially wider**; accounts for individual property variance and market friction. | Narrower as sample size $n \to \infty$. |
| **Real Estate Meaning** | Communicates the range in which this individual home is expected to sell. | Would severely underestimate uncertainty if misapplied to an individual house. |

---

### 2.2 Split Conformal Prediction Algorithm
Inductive Split Conformal Prediction guarantees marginal validity under the mild assumption of **exchangeability** (which is weaker than independent and identically distributed $i.i.d.$ data):

1. **Split Discipline (Zero Leakage)**:
   The total dataset $\mathcal{D} = \{(x_i, y_i)\}_{i=1}^N$ (1,460 observations) is partitioned into three disjoint subsets:
   - **Training Set $\mathcal{D}_{train}$**: $60\%$ (876 properties), used strictly for fitting preprocessing transformers and regression estimators.
   - **Calibration Set $\mathcal{D}_{cal}$**: $20\%$ (292 properties), used solely to calculate absolute residual nonconformity scores.
   - **Held-Out Test Set $\mathcal{D}_{test}$**: $20\%$ (292 properties), used solely for empirical evaluation and diagnostic verification.

2. **Nonconformity Scores**:
   For each sample in the calibration set, the absolute prediction error is computed:
   $$R_i = |y_i - \hat{y}_i|, \quad \forall i \in \mathcal{D}_{cal}$$

3. **Finite-Sample Quantile Index**:
   For a desired miscoverage rate $\alpha$ (e.g. $\alpha = 0.10$ for $90\%$ coverage, or $\alpha = 0.05$ for $95\%$ coverage), the finite-sample corrected quantile index is:
   $$p = \min\left(1.0, \; \frac{\lceil (n_{cal} + 1)(1 - \alpha) \rceil}{n_{cal}}\right)$$
   where $n_{cal} = |\mathcal{D}_{cal}| = 292$.

4. **Prediction Interval Construction**:
   Let $q_{1-\alpha}$ be the $p$-th empirical quantile of $\{R_1, \dots, R_{n_{cal}}\}$. For any new property $X_{new}$:
   $$\hat{y} = f(X_{new})$$
   $$\mathcal{C}(X_{new}) = [ \max(10\,000, \hat{y} - q_{1-\alpha}), \; \hat{y} + q_{1-\alpha} ]$$

5. **Theoretical Guarantee**:
   $$P(Y_{new} \in \mathcal{C}(X_{new})) \ge 1 - \alpha$$
   This guarantee holds in finite samples without requiring Gaussian errors, linearity, or homoscedasticity.

---

## 3. Empirical Test Evaluation & Metrics

HousePrice AI verifies interval quality by computing actual observed empirical coverage on the held-out 292-observation test set:

$$\text{Observed Coverage} = \frac{1}{|\mathcal{D}_{test}|} \sum_{j \in \mathcal{D}_{test}} \mathbb{I}\left(y_j \in [\hat{y}_j - q_{1-\alpha}, \; \hat{y}_j + q_{1-\alpha}]\right)$$
$$\text{Mean Interval Width} = \frac{1}{|\mathcal{D}_{test}|} \sum_{j \in \mathcal{D}_{test}} 2 \cdot q_{1-\alpha} = 2 \cdot q_{1-\alpha}$$

### Benchmark Evaluation Table (Held-Out Test Set)

| Model Name | Test RMSE | Target Coverage | Observed Coverage | Conformal Margin | Mean Interval Width |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CatBoost (Production)** | **$28,945.66** | **90%** | **92.12%** | **±$37,232.47** | **$74,464.94** |
| **CatBoost (Production)** | **$28,945.66** | **95%** | **96.58%** | **±$52,982.91** | **$105,965.82** |
| Voting Ensemble | $28,515.16 | 90% | 90.41% | ±$35,686.93 | $71,373.86 |
| Voting Ensemble | $28,515.16 | 95% | 95.89% | ±$56,006.13 | $112,012.26 |
| XGBoost | $30,865.20 | 90% | 89.73% | ±$39,812.10 | $79,624.20 |
| LightGBM | $30,120.45 | 90% | 90.07% | ±$38,450.15 | $76,900.30 |
| Linear Regression | $36,410.82 | 90% | 88.70% | ±$47,215.30 | $94,430.60 |

*Notice: In all models, observed empirical coverage closely satisfies or exceeds the configured target level without arbitrary fabrication.*

---

## 4. Software Implementation Architecture

### 4.1 Backend Engine (`backend/app/ml/models/conformal.py`)
- `ConformalPredictor`: Encapsulates calibration residuals, quantiles, and coverage evaluation.
- `MultiModelConformalManager`: Maintains calibrated conformal estimators for every supported model architecture, ensuring candidate models have model-specific intervals rather than a generic guess.
- `relative_width` rule for qualitative uncertainty level:
  - $\frac{\text{width}}{\hat{y}} < 0.16 \implies$ **Lower Uncertainty**
  - $0.16 \le \frac{\text{width}}{\hat{y}} \le 0.26 \implies$ **Moderate Uncertainty**
  - $\frac{\text{width}}{\hat{y}} > 0.26 \implies$ **Higher Uncertainty**

### 4.2 API Contract (`backend/app/schemas/prediction.py`)
```json
{
  "prediction": 199474,
  "prediction_interval": {
    "lower": 163787,
    "upper": 235161,
    "coverage": 0.90,
    "interval_width": 71374,
    "uncertainty_level": "Moderate"
  },
  "uncertainty": {
    "method": "conformal_prediction",
    "interval_width": 71374,
    "uncertainty_level": "Moderate",
    "target_coverage": 0.90,
    "observed_coverage": 0.9041,
    "mean_interval_width": 71373.86,
    "calibration_dataset": "Ames Housing Calibration Split (Holdout)",
    "calibration_samples": 292
  },
  "model": {
    "name": "Voting Ensemble",
    "version": "v1.0.0"
  }
}
```

### 4.3 Fallback Protocol (No Fabrication)
If a prediction interval cannot be calibrated or an unsupported model is requested:
1. The point estimate is returned normally.
2. `prediction_interval` and `uncertainty` are set to `null`.
3. `metadata.interval_available` is set to `false`.
4. `metadata.interval_unavailable_reason` displays: *"Prediction interval unavailable for this model."*

---

## 5. Model Limitations & Responsible AI Disclosures

1. **Exchangeability Assumption**:
   Conformal validity assumes that future prediction candidates are exchangeable with calibration samples. If a property is substantially Out-of-Distribution (OOD), exchangeability is violated. The system detects this and surfaces:
   > ⚠ HIGHER UNCERTAINTY: These inputs differ substantially from the data used to train/calibrate the model. Treat the estimate with additional caution.

2. **Historical & Geographic Boundary**:
   The model is trained on residential sales from Ames, Iowa (2006–2010). Relationships learned (e.g. square footage dollar premiums) cannot be directly applied to metropolitan coastal markets without retraining.

3. **Macroeconomic Sensitivity**:
   Conformal prediction models static historical residual spread; it does not forecast sudden macroeconomic interest rate shifts or municipal tax reforms.

4. **Appraisal Disclaimer**:
   This machine learning system provides automated statistical decision-support. It does not constitute a certified appraisal under the Uniform Standards of Professional Appraisal Practice (USPAP) or an official guarantee of transaction value.
