import os
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

# SQLite needs check_same_thread=False for multithreading
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_db_schema():
    """Guarantees SQLite schema matches current models."""
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            cols = [r[1] for r in conn.execute(text("PRAGMA table_info(saved_scenarios)")).fetchall()]
            if cols and "model_version" not in cols:
                conn.execute(text("ALTER TABLE saved_scenarios ADD COLUMN model_version VARCHAR(32) DEFAULT 'v1.0.0'"))
                conn.commit()
    except Exception:
        pass


def get_db():
    """FastAPI database session dependency."""
    ensure_db_schema()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
