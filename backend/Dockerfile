# Multi-stage production Dockerfile for FastAPI Backend
FROM python:3.11-slim as base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/pyproject.toml .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    numpy \
    pandas \
    scipy \
    scikit-learn \
    xgboost \
    lightgbm \
    catboost \
    optuna \
    shap \
    fastapi \
    "uvicorn[standard]" \
    sqlalchemy \
    alembic \
    reportlab \
    python-multipart \
    pydantic \
    pydantic-settings \
    httpx

# Copy source code and ML artifacts
COPY backend /app/backend
COPY data /app/data

EXPOSE 8000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
