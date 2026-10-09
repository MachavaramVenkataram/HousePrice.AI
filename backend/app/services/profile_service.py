import json
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from ..db.models import PropertyProfileRecord
from ..schemas.decision import (
    PropertyProfileCreate,
    PropertyProfileResponse,
    PropertyProfileComparisonItem,
    PropertyProfileComparisonResponse,
)
from .prediction_service import PredictionService

logger = logging.getLogger(__name__)


class ProfileService:
    _instance = None

    def __init__(self):
        self.prediction_service = PredictionService.get_instance()

    @classmethod
    def get_instance(cls) -> "ProfileService":
        if cls._instance is None:
            cls._instance = ProfileService()
        return cls._instance

    def create_profile(self, req: PropertyProfileCreate, db: Session) -> PropertyProfileResponse:
        """Saves a user property profile to persistent storage."""
        rec = PropertyProfileRecord(
            name=req.name,
            description=req.description,
            features_json=json.dumps(req.features.to_dict()),
            estimated_price=req.estimated_price,
            lower_bound=req.lower_bound,
            upper_bound=req.upper_bound,
            model_name=req.model_name,
            model_version=req.model_version,
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)
        return PropertyProfileResponse(**rec.to_dict())

    def list_profiles(self, db: Session, limit: int = 20) -> List[PropertyProfileResponse]:
        """Lists user property profiles ordered by creation date."""
        recs = db.query(PropertyProfileRecord).order_by(PropertyProfileRecord.created_at.desc()).limit(limit).all()
        return [PropertyProfileResponse(**r.to_dict()) for r in recs]

    def delete_profile(self, profile_id: int, db: Session) -> bool:
        """Deletes a property profile by ID."""
        rec = db.query(PropertyProfileRecord).filter(PropertyProfileRecord.id == profile_id).first()
        if not rec:
            return False
        db.delete(rec)
        db.commit()
        return True

    def compare_profiles(self, profile_ids: List[int], db: Session) -> PropertyProfileComparisonResponse:
        """Compares multiple saved property profiles side by side."""
        recs = db.query(PropertyProfileRecord).filter(PropertyProfileRecord.id.in_(profile_ids)).all()
        
        items: List[PropertyProfileComparisonItem] = []
        for r in recs:
            data = r.to_dict()
            f = data.get("features", {})
            area = max(float(f.get("GrLivArea", 1600.0)), 1.0)
            price = float(r.estimated_price)
            ppsqft = round(price / area, 2)

            # Top contributors summary based on quality and size
            qual = int(f.get("OverallQual", 7))
            beds = int(f.get("BedroomAbvGr", 3))
            baths = int(f.get("FullBath", 2))
            built = int(f.get("YearBuilt", 1985))

            top_contribs = [
                f"Overall Quality ({qual}/10)",
                f"Living Area ({round(area):,} sq ft)",
                f"Built {built}",
            ]

            items.append(
                PropertyProfileComparisonItem(
                    profile_id=r.id,
                    name=r.name,
                    estimated_price=round(r.estimated_price, 2),
                    lower_bound=round(r.lower_bound, 2),
                    upper_bound=round(r.upper_bound, 2),
                    living_area=area,
                    bedrooms=beds,
                    full_bath=baths,
                    overall_qual=qual,
                    year_built=built,
                    neighborhood=str(f.get("Neighborhood", "CollgCr")),
                    price_per_sqft=ppsqft,
                    top_contributors=top_contribs,
                )
            )

        return PropertyProfileComparisonResponse(
            profiles=items,
            count=len(items),
        )
