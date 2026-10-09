import json
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from ..core.database import Base


class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    model_name = Column(String(64), nullable=False, default="Voting Ensemble")
    model_version = Column(String(32), nullable=False, default="v1.0.0")
    inputs_json = Column(Text, nullable=False)
    predicted_price = Column(Float, nullable=False)
    lower_bound = Column(Float, nullable=False)
    upper_bound = Column(Float, nullable=False)
    latency_ms = Column(Float, nullable=False, default=0.0)
    feedback = Column(String(32), nullable=True)  # 'accurate', 'inaccurate'
    feedback_comment = Column(Text, nullable=True)

    def to_dict(self):
        try:
            inputs = json.loads(self.inputs_json)
        except Exception:
            inputs = {}
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "model_name": self.model_name,
            "model_version": self.model_version,
            "inputs": inputs,
            "predicted_price": round(self.predicted_price, 2),
            "lower_bound": round(self.lower_bound, 2),
            "upper_bound": round(self.upper_bound, 2),
            "latency_ms": round(self.latency_ms, 2),
            "feedback": self.feedback,
            "feedback_comment": self.feedback_comment,
        }


class SavedScenario(Base):
    __tablename__ = "saved_scenarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    features_json = Column(Text, nullable=False)
    predicted_price = Column(Float, nullable=False)
    lower_bound = Column(Float, nullable=True)
    upper_bound = Column(Float, nullable=True)
    model_name = Column(String(64), nullable=False, default="CatBoost")
    model_version = Column(String(32), nullable=False, default="v1.0.0")

    def to_dict(self):
        try:
            feats = json.loads(self.features_json)
        except Exception:
            feats = {}
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "name": self.name,
            "description": self.description,
            "features": feats,
            "predicted_price": round(self.predicted_price, 2),
            "lower_bound": round(self.lower_bound, 2) if self.lower_bound is not None else None,
            "upper_bound": round(self.upper_bound, 2) if self.upper_bound is not None else None,
            "model_name": self.model_name,
            "model_version": self.model_version,
        }


class PropertyProfileRecord(Base):
    __tablename__ = "property_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    features_json = Column(Text, nullable=False)
    estimated_price = Column(Float, nullable=False)
    lower_bound = Column(Float, nullable=False)
    upper_bound = Column(Float, nullable=False)
    model_name = Column(String(64), nullable=False, default="Voting Ensemble")
    model_version = Column(String(32), nullable=False, default="v1.0.0")

    def to_dict(self):
        try:
            feats = json.loads(self.features_json)
        except Exception:
            feats = {}
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "name": self.name,
            "description": self.description,
            "features": feats,
            "estimated_price": round(self.estimated_price, 2),
            "lower_bound": round(self.lower_bound, 2),
            "upper_bound": round(self.upper_bound, 2),
            "model_name": self.model_name,
            "model_version": self.model_version,
        }


class ModelReleaseRecord(Base):
    """Audit trail and registry history for approved model releases and rollbacks."""
    __tablename__ = "model_releases"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    model_name = Column(String(64), nullable=False)
    model_version = Column(String(32), nullable=False)
    action = Column(String(32), nullable=False)  # 'promoted', 'rollback', 'candidate_registered', 'candidate_rejected'
    previous_model = Column(String(64), nullable=True)
    previous_version = Column(String(32), nullable=True)
    approver = Column(String(128), nullable=False, default="System Administrator")
    notes = Column(Text, nullable=True)
    validation_metrics_json = Column(Text, nullable=True)
    release_criteria_json = Column(Text, nullable=True)

    def to_dict(self):
        try:
            val_metrics = json.loads(self.validation_metrics_json) if self.validation_metrics_json else {}
        except Exception:
            val_metrics = {}
        try:
            criteria = json.loads(self.release_criteria_json) if self.release_criteria_json else []
        except Exception:
            criteria = []
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "model_name": self.model_name,
            "model_version": self.model_version,
            "action": self.action,
            "previous_model": self.previous_model,
            "previous_version": self.previous_version,
            "approver": self.approver,
            "notes": self.notes,
            "validation_metrics": val_metrics,
            "release_criteria": criteria,
        }

