from typing import Any

from sklearn.linear_model import ElasticNet, Lasso, LinearRegression, Ridge


def get_baseline_models(random_state: int = 42) -> dict[str, Any]:
    """Returns baseline linear regression and regularized models."""
    return {
        "Linear Regression": LinearRegression(),
        "Ridge Regression": Ridge(alpha=10.0, random_state=random_state),
        "Lasso": Lasso(alpha=0.001, random_state=random_state, max_iter=2000),
        "ElasticNet": ElasticNet(alpha=0.001, l1_ratio=0.5, random_state=random_state, max_iter=2000),
    }
