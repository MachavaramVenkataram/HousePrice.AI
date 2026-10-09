import pytest
import numpy as np
import pandas as pd
from backend.app.ml.preprocessing.features import FeatureEngineer
from backend.app.ml.preprocessing.pipeline import HousingPreprocessingPipeline, TargetTransformer
from backend.app.services.prediction_service import PredictionService
from backend.app.schemas.prediction import PropertyFeatures


def test_feature_engineering_dimensions():
    fe = FeatureEngineer()
    df_dummy = pd.DataFrame([{
        "1stFlrSF": 1000.0,
        "2ndFlrSF": 500.0,
        "TotalBsmtSF": 800.0,
        "FullBath": 2,
        "HalfBath": 1,
        "BsmtFullBath": 1,
        "BsmtHalfBath": 0,
        "YearBuilt": 2000,
        "YearRemodAdd": 2005,
        "YrSold": 2010,
        "OverallQual": 8,
        "OverallCond": 6,
        "GarageArea": 400.0,
        "Fireplaces": 1,
        "WoodDeckSF": 150.0,
        "OpenPorchSF": 50.0,
    }])
    df_trans = fe.transform(df_dummy)
    assert df_trans["TotalSF"].iloc[0] == 2300.0
    assert df_trans["TotalBath"].iloc[0] == 3.5
    assert df_trans["HouseAge"].iloc[0] == 10
    assert df_trans["RemodelAge"].iloc[0] == 5
    assert df_trans["QualityScore"].iloc[0] == 48
    assert df_trans["HasGarage"].iloc[0] == 1
    assert df_trans["PorchSF"].iloc[0] == 200.0


def test_target_transformer_invertibility():
    y_raw = np.array([150000.0, 250000.0, 500000.0])
    y_trans = TargetTransformer.transform(y_raw)
    y_inv = TargetTransformer.inverse_transform(y_trans)
    np.testing.assert_allclose(y_raw, y_inv, rtol=1e-5)


def test_prediction_service_deterministic():
    service = PredictionService.get_instance()
    feat = PropertyFeatures(
        GrLivArea=1800.0,
        OverallQual=7,
        YearBuilt=2004,
    )
    res1 = service.predict(feat)
    res2 = service.predict(feat)
    assert res1.predicted_price == res2.predicted_price
    assert res1.prediction_interval.lower_bound == res2.prediction_interval.lower_bound
    assert res1.prediction_interval.upper_bound == res2.prediction_interval.upper_bound
    assert res1.prediction_interval.lower_bound <= res1.predicted_price <= res1.prediction_interval.upper_bound
