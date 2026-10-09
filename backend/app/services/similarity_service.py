from typing import Any

import numpy as np

from ..schemas.decision import ComparableInsights, SimilarPropertyComparable
from .dataset_service import DatasetService


class SimilarityService:
    _instance = None

    def __init__(self):
        self.dataset_service = DatasetService.get_instance()
        self.df = self.dataset_service.df.copy()
        self._prepare_scaling()

    @classmethod
    def get_instance(cls) -> "SimilarityService":
        if cls._instance is None:
            cls._instance = SimilarityService()
        return cls._instance

    def _prepare_scaling(self):
        """Precomputes min and max bounds for standardized Euclidean distance."""
        self.num_cols = [
            "GrLivArea",
            "OverallQual",
            "OverallCond",
            "YearBuilt",
            "TotalBsmtSF",
            "BedroomAbvGr",
            "FullBath",
            "GarageCars",
        ]
        self.mins = {}
        self.maxs = {}
        for c in self.num_cols:
            if c in self.df.columns:
                self.mins[c] = float(self.df[c].min())
                self.maxs[c] = float(self.df[c].max())
            else:
                self.mins[c] = 0.0
                self.maxs[c] = 1.0

    def find_similar_properties(
        self,
        features_dict: dict[str, Any],
        estimated_price: float,
        priority: str = "balanced",
        top_k: int = 5,
        match_scope: str = "balanced",
    ) -> ComparableInsights:
        """Finds deterministic nearest historical property records from Ames dataset."""
        df_target = self.df.copy()
        user_neigh = str(features_dict.get("Neighborhood", "CollgCr"))
        user_area = float(features_dict.get("GrLivArea", 1600.0))
        user_qual = int(features_dict.get("OverallQual", 7))
        user_beds = int(features_dict.get("BedroomAbvGr", 3))
        user_baths = int(features_dict.get("FullBath", 2))
        user_year = int(features_dict.get("YearBuilt", 1985))

        # 1. Match Scope filtering
        if match_scope == "closest":
            # Strict living area window (+/- 25%)
            df_target = df_target[
                (df_target["GrLivArea"] >= user_area * 0.75) &
                (df_target["GrLivArea"] <= user_area * 1.25)
            ]
            # If plenty of same-neighborhood properties, prefer them
            neigh_subset = df_target[df_target["Neighborhood"] == user_neigh]
            if len(neigh_subset) >= top_k:
                df_target = neigh_subset
        elif match_scope == "broader":
            # Relaxed filters for wider comparable exploration
            pass
        else:  # balanced
            # Standard living area filter (+/- 35%)
            area_filt = df_target[
                (df_target["GrLivArea"] >= user_area * 0.65) &
                (df_target["GrLivArea"] <= user_area * 1.35)
            ]
            if len(area_filt) >= top_k * 2:
                df_target = area_filt

        # Ensure we still have sufficient candidates
        if len(df_target) < top_k:
            df_target = self.df.copy()

        # 2. Configurable feature weights based on similarity priority
        if priority in ["location", "neighborhood"]:
            weights = {
                "Neighborhood": 0.35,
                "GrLivArea": 0.20,
                "OverallQual": 0.15,
                "YearBuilt": 0.10,
                "TotalBsmtSF": 0.10,
                "BedroomAbvGr": 0.05,
                "FullBath": 0.05,
                "GarageCars": 0.05,
                "OverallCond": 0.05,
            }
        elif priority == "size":
            weights = {
                "GrLivArea": 0.35,
                "TotalBsmtSF": 0.20,
                "BedroomAbvGr": 0.15,
                "FullBath": 0.10,
                "OverallQual": 0.10,
                "OverallCond": 0.05,
                "YearBuilt": 0.05,
                "GarageCars": 0.05,
                "Neighborhood": 0.05,
            }
        elif priority == "quality":
            weights = {
                "OverallQual": 0.40,
                "OverallCond": 0.15,
                "YearBuilt": 0.15,
                "GrLivArea": 0.15,
                "TotalBsmtSF": 0.05,
                "BedroomAbvGr": 0.05,
                "FullBath": 0.05,
                "GarageCars": 0.05,
                "Neighborhood": 0.05,
            }
        elif priority == "age":
            weights = {
                "YearBuilt": 0.40,
                "OverallQual": 0.20,
                "GrLivArea": 0.15,
                "TotalBsmtSF": 0.10,
                "BedroomAbvGr": 0.05,
                "FullBath": 0.05,
                "GarageCars": 0.05,
                "OverallCond": 0.05,
                "Neighborhood": 0.05,
            }
        else:  # balanced
            weights = {
                "GrLivArea": 0.25,
                "OverallQual": 0.25,
                "YearBuilt": 0.15,
                "TotalBsmtSF": 0.10,
                "BedroomAbvGr": 0.10,
                "FullBath": 0.05,
                "GarageCars": 0.05,
                "OverallCond": 0.05,
                "Neighborhood": 0.05,
            }

        # Normalize distance calculation
        sq_diffs = np.zeros(len(df_target))
        for col in self.num_cols:
            if col in self.mins and col in features_dict:
                val = float(features_dict[col])
                c_min = self.mins[col]
                c_max = self.maxs[col]
                denom = max(c_max - c_min, 1e-5)

                norm_user = (val - c_min) / denom
                norm_dataset = (df_target[col].astype(float) - c_min) / denom
                w = weights.get(col, 0.05)
                sq_diffs += w * ((norm_dataset - norm_user) ** 2)

        # Neighborhood penalty if different
        w_neigh = weights.get("Neighborhood", 0.05)
        neigh_penalty = np.where(df_target["Neighborhood"].astype(str) != user_neigh, w_neigh, 0.0)
        sq_diffs += neigh_penalty

        distances = np.sqrt(sq_diffs)
        df_target["_distance"] = distances

        # Convert to bounded mathematical similarity score
        df_target["_similarity"] = np.clip(100.0 * (1.0 - distances), 40.0, 99.8)

        # Pick top_k closest records
        sorted_df = df_target.sort_values(by="_distance", ascending=True).head(top_k)

        comparables: list[SimilarPropertyComparable] = []
        rank = 1
        for idx, row in sorted_df.iterrows():
            rec_id = int(row.get("Id", idx))
            price = float(row.get("SalePrice", 0.0))
            area = max(float(row.get("GrLivArea", 1.0)), 1.0)
            ppsqft = round(price / area, 2)
            c_beds = int(row.get("BedroomAbvGr", 0))
            c_qual = int(row.get("OverallQual", 0))
            c_baths = int(row.get("FullBath", 0))
            c_built = int(row.get("YearBuilt", 0))
            c_neigh = str(row.get("Neighborhood", ""))

            # Dynamically determine key match attributes
            key_matches = []
            if abs(area - user_area) <= 200:
                key_matches.append("Living area")
            if abs(c_qual - user_qual) <= 1:
                key_matches.append("Quality")
            if c_beds == user_beds:
                key_matches.append("Bedrooms")
            if c_neigh == user_neigh:
                key_matches.append("Neighborhood")
            if abs(c_built - user_year) <= 10:
                key_matches.append("Age/Year Built")
            if c_baths == user_baths:
                key_matches.append("Bathrooms")
            if not key_matches:
                key_matches = ["Overall size profile"]

            # Detailed rationale explanation
            why_text = (
                f"Close match on {', '.join(key_matches[:3])}. "
                f"Features {round(area):,} sq ft living area ({c_beds} beds, {c_baths} baths, Quality {c_qual}/10) "
                f"built in {c_built} in {c_neigh}."
            )

            similarity_features = {
                "GrLivArea": float(row.get("GrLivArea", 0)),
                "OverallQual": int(row.get("OverallQual", 0)),
                "OverallCond": int(row.get("OverallCond", 0)),
                "YearBuilt": int(row.get("YearBuilt", 0)),
                "YearRemodAdd": int(row.get("YearRemodAdd", 0)),
                "TotalBsmtSF": float(row.get("TotalBsmtSF", 0)),
                "BedroomAbvGr": int(row.get("BedroomAbvGr", 0)),
                "FullBath": int(row.get("FullBath", 0)),
                "HalfBath": int(row.get("HalfBath", 0)),
                "GarageCars": int(row.get("GarageCars", 0)),
                "LotArea": float(row.get("LotArea", 0)),
                "Neighborhood": c_neigh,
                "HouseStyle": str(row.get("HouseStyle", "1Story")),
            }

            comparables.append(
                SimilarPropertyComparable(
                    id=rec_id,
                    record_id=f"AMES-{rec_id}",
                    similarity_rank=rank,
                    sale_price=round(price, 2),
                    gr_liv_area=float(row.get("GrLivArea", 0.0)),
                    bedrooms=c_beds,
                    full_bath=c_baths,
                    overall_qual=c_qual,
                    year_built=c_built,
                    neighborhood=c_neigh,
                    price_per_sqft=ppsqft,
                    similarity_pct=round(float(row["_similarity"]), 1),
                    distance=round(float(row["_distance"]), 4),
                    key_match_attributes=key_matches,
                    why_selected=why_text,
                    similarity_features=similarity_features,
                    dataset_source="Ames Housing Dataset (2006-2010)",
                )
            )
            rank += 1

        # Summary statistics
        prices = [c.sale_price for c in comparables]
        ppsqfts = [c.price_per_sqft for c in comparables]
        median_price = float(np.median(prices)) if prices else 0.0
        mean_price = float(np.mean(prices)) if prices else 0.0
        min_price = float(np.min(prices)) if prices else 0.0
        max_price = float(np.max(prices)) if prices else 0.0
        median_ppsqft = float(np.median(ppsqfts)) if ppsqfts else 0.0

        user_implied_ppsqft = round(estimated_price / max(user_area, 1.0), 2)

        # Property positioning statement
        if median_price > 0:
            diff = estimated_price - median_price
            pct_diff = round((diff / median_price) * 100.0, 1)
            if abs(pct_diff) <= 3.0:
                positioning = (
                    f"Model estimate (${round(estimated_price):,}) closely tracks the median of similar "
                    f"historical properties (${round(median_price):,}) in the Ames evaluation dataset."
                )
            elif pct_diff > 0:
                positioning = (
                    f"Model estimate (${round(estimated_price):,}) is ${round(diff):,} (+{pct_diff}%) above the "
                    f"median of similar historical properties (${round(median_price):,})."
                )
            else:
                positioning = (
                    f"Model estimate (${round(estimated_price):,}) is ${round(abs(diff)):,} ({pct_diff}%) below the "
                    f"median of similar historical properties (${round(median_price):,})."
                )
        else:
            positioning = "Insufficient historical records found for positioning evaluation."

        return ComparableInsights(
            comparables=comparables,
            comparable_count=len(comparables),
            comparable_median_price=round(median_price, 2),
            comparable_mean_price=round(mean_price, 2),
            comparable_min_price=round(min_price, 2),
            comparable_max_price=round(max_price, 2),
            user_implied_price_per_sqft=user_implied_ppsqft,
            comparable_median_price_per_sqft=round(median_ppsqft, 2),
            positioning_summary=positioning,
        )
