import sys
import os
import time
import logging
from contextlib import asynccontextmanager

# Ensure workspace root is in sys.path so pickled artifacts referencing 'backend.*' unpickle cleanly
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .core.config import settings
from .core.database import engine, Base
from .db.models import PredictionRecord, SavedScenario
from .api.v1.router import api_router
from .services.prediction_service import PredictionService

# Setup structured logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("HOUSEPRICE_AI_API")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and artifacts are loaded
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            cols = [r[1] for r in conn.execute(text("PRAGMA table_info(saved_scenarios)")).fetchall()]
            if cols and "model_version" not in cols:
                conn.execute(text("ALTER TABLE saved_scenarios ADD COLUMN model_version VARCHAR(32) DEFAULT 'v1.0.0'"))
                conn.commit()
                logger.info("Added model_version column to saved_scenarios table.")
    except Exception as e:
        logger.warning(f"Database schema check notice: {e}")
    logger.info("Pre-warming PredictionService...")
    PredictionService.get_instance()
    logger.info(f"{settings.PROJECT_NAME} v{settings.VERSION} online and ready.")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_and_logging(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start_time) * 1000.0
    response.headers["X-Process-Time-Ms"] = f"{duration_ms:.2f}"
    
    # Structured log
    logger.info(
        f"{request.method} {request.url.path} - Status: {response.status_code} - {duration_ms:.2f}ms"
    )
    return response


# Include Versioned API Routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "positioning": "Machine-learning property price estimation",
        "primary_description": "Generate a data-driven property price estimate using historical housing data.",
        "tagline": "Estimate property value with machine learning.",
        "documentation": "/docs",
        "health_check": f"{settings.API_V1_STR}/health",
        "api_v1": settings.API_V1_STR,
    }

