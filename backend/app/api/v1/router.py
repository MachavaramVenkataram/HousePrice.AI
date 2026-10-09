from fastapi import APIRouter

from .endpoints import (
    applicability,
    dataset,
    decision,
    health,
    models,
    monitoring,
    predict,
    reports,
    target_price,
)

api_router = APIRouter()

api_router.include_router(predict.router, prefix="/predict", tags=["Prediction"])
api_router.include_router(decision.router, prefix="/decision", tags=["Decision Intelligence"])
api_router.include_router(target_price.router, prefix="/target-price", tags=["Target Price Explorer"])
api_router.include_router(applicability.router, prefix="/applicability", tags=["Model Applicability"])
api_router.include_router(models.router, prefix="/models", tags=["Models & Benchmarks"])
api_router.include_router(dataset.router, prefix="/dataset", tags=["Dataset & EDA"])
api_router.include_router(monitoring.router, prefix="/monitoring", tags=["Monitoring & Drift"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(health.router, prefix="/health", tags=["System Health"])
