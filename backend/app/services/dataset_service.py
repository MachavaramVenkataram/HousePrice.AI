
import numpy as np
import pandas as pd

from ..ml.data.loader import (
    TARGET,
    get_data_profile,
    load_dataset,
)
from ..schemas.dataset import DatasetProfileResponse, LocationSummary, PaginatedDatasetResponse


class DatasetService:
    _instance = None

    def __init__(self):
        self.df = load_dataset()

    @classmethod
    def get_instance(cls) -> "DatasetService":
        if cls._instance is None:
            cls._instance = DatasetService()
        return cls._instance

    def get_profile(self) -> DatasetProfileResponse:
        prof = get_data_profile()
        return DatasetProfileResponse(**prof)

    def query_rows(
        self,
        page: int = 1,
        page_size: int = 15,
        search: str | None = None,
        neighborhood: str | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        min_bedrooms: int | None = None,
        sort_by: str = "SalePrice",
        sort_desc: bool = True,
    ) -> PaginatedDatasetResponse:
        filtered_df = self.df.copy()

        # Filters
        if neighborhood and neighborhood != "All":
            filtered_df = filtered_df[filtered_df["Neighborhood"] == neighborhood]

        if min_price is not None:
            filtered_df = filtered_df[filtered_df[TARGET] >= min_price]

        if max_price is not None:
            filtered_df = filtered_df[filtered_df[TARGET] <= max_price]

        if min_bedrooms is not None:
            filtered_df = filtered_df[filtered_df["BedroomAbvGr"] >= min_bedrooms]

        if search:
            s_lower = search.lower()
            mask = filtered_df["Neighborhood"].astype(str).str.lower().str.contains(s_lower) | \
                   filtered_df["HouseStyle"].astype(str).str.lower().str.contains(s_lower) | \
                   filtered_df["BldgType"].astype(str).str.lower().str.contains(s_lower)
            filtered_df = filtered_df[mask]

        # Sorting
        if sort_by in filtered_df.columns:
            filtered_df = filtered_df.sort_values(by=sort_by, ascending=not sort_desc)

        total_rows = len(filtered_df)
        total_pages = max(1, (total_rows + page_size - 1) // page_size)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size

        sliced = filtered_df.iloc[start_idx:end_idx]

        # Return primary visible columns
        display_cols = [
            "Id",
            "SalePrice",
            "Neighborhood",
            "GrLivArea",
            "OverallQual",
            "YearBuilt",
            "TotalBsmtSF",
            "BedroomAbvGr",
            "FullBath",
            "GarageCars",
            "LotArea",
            "HouseStyle",
        ]
        available_cols = [c for c in display_cols if c in sliced.columns]

        # Replace NaN with None for clean JSON serialization
        records = sliced[available_cols].replace({np.nan: None}).to_dict(orient="records")

        return PaginatedDatasetResponse(
            total_rows=total_rows,
            total=total_rows,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            columns=available_cols,
            data=records,
            rows=records,
        )

    def get_location_analytics(self) -> list[LocationSummary]:
        if "Neighborhood" not in self.df.columns or TARGET not in self.df.columns:
            return []

        grouped = self.df.groupby("Neighborhood")
        summaries = []

        for name, group in grouped:
            prices = pd.to_numeric(group[TARGET], errors="coerce").dropna()
            liv_area = pd.to_numeric(group["GrLivArea"], errors="coerce").dropna()
            if len(prices) > 0:
                summaries.append(LocationSummary(
                    neighborhood=str(name),
                    count=len(group),
                    mean_price=round(float(prices.mean()), 2),
                    median_price=round(float(prices.median()), 2),
                    min_price=round(float(prices.min()), 2),
                    max_price=round(float(prices.max()), 2),
                    mean_liv_area=round(float(liv_area.mean()), 1) if len(liv_area) > 0 else 0.0,
                ))

        summaries.sort(key=lambda x: x.median_price, reverse=True)
        return summaries
