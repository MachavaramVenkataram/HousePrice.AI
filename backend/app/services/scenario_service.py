import copy
from typing import Dict, Any, List, Optional
from ..schemas.prediction import PropertyFeatures
from ..schemas.decision import ImprovementScenario, ImprovementSimulationResponse
from .prediction_service import PredictionService


class ScenarioService:
    _instance = None

    def __init__(self):
        self.prediction_service = PredictionService.get_instance()

    @classmethod
    def get_instance(cls) -> "ScenarioService":
        if cls._instance is None:
            cls._instance = ScenarioService()
        return cls._instance

    def simulate_improvements(
        self,
        base_features: PropertyFeatures,
        renovation_costs: Optional[Dict[str, float]] = None,
    ) -> ImprovementSimulationResponse:
        """Simulates structured physical property improvements using real model inference."""
        costs = renovation_costs or {}
        
        # 1. Base prediction
        base_res = self.prediction_service.predict(base_features)
        base_price = base_res.predicted_price

        scenarios_def = [
            {
                "id": "quality_upgrade",
                "name": "Finish & Material Quality Upgrade (+1 Grade)",
                "desc": "Elevate architectural materials, trim, cabinetry, and fixtures from current level by +1 point.",
                "modify": lambda f: setattr(f, "OverallQual", min(10, f.OverallQual + 1)),
                "driver": "Overall Quality (+1 Grade)",
                "default_cost": 15000.0,
            },
            {
                "id": "modern_remodel",
                "name": "Full Kitchen & Energy Remodel",
                "desc": "Upgrade kitchen to Excellent grade, modern heating QC, and update remodel timestamp.",
                "modify": lambda f: (
                    setattr(f, "KitchenQual", "Ex"),
                    setattr(f, "HeatingQC", "Ex"),
                    setattr(f, "YearRemodAdd", max(f.YearRemodAdd, 2010)),
                    setattr(f, "OverallQual", min(10, f.OverallQual + 1)),
                ),
                "driver": "Kitchen & Energy Modernization",
                "default_cost": 25000.0,
            },
            {
                "id": "space_addition",
                "name": "Finished Living Space Addition (+300 sq ft)",
                "desc": "Expand above-grade living area by 300 square feet with an additional room.",
                "modify": lambda f: (
                    setattr(f, "GrLivArea", f.GrLivArea + 300.0),
                    setattr(f, "FirstFlrSF", f.FirstFlrSF + 150.0),
                    setattr(f, "SecondFlrSF", f.SecondFlrSF + 150.0),
                    setattr(f, "TotRmsAbvGrd", f.TotRmsAbvGrd + 1),
                ),
                "driver": "Living Area Expansion (+300 sq ft)",
                "default_cost": 35000.0,
            },
            {
                "id": "bathroom_addition",
                "name": "Add Additional Full Bathroom",
                "desc": "Add a full bathroom above grade to improve bedroom-to-bath convenience.",
                "modify": lambda f: setattr(f, "FullBath", min(6, f.FullBath + 1)),
                "driver": "Bathroom Count (+1 Full Bath)",
                "default_cost": 12000.0,
            },
        ]

        scenarios: List[ImprovementScenario] = []
        for item in scenarios_def:
            s_feat = copy.deepcopy(base_features)
            item["modify"](s_feat)

            try:
                s_res = self.prediction_service.predict(s_feat)
                pot_price = s_res.predicted_price
                diff = pot_price - base_price
                
                # Check user renovation cost
                user_cost = costs.get(item["id"], item["default_cost"])
                net_diff = diff - user_cost if user_cost is not None else None

                scenarios.append(
                    ImprovementScenario(
                        scenario_id=item["id"],
                        name=item["name"],
                        description=item["desc"],
                        modified_features=s_feat,
                        potential_estimate=round(pot_price, 2),
                        potential_interval=s_res.prediction_interval,
                        modeled_difference=round(diff, 2),
                        top_driver=item["driver"],
                        user_renovation_cost=round(user_cost, 2) if user_cost is not None else None,
                        net_modeled_scenario_difference=round(net_diff, 2) if net_diff is not None else None,
                    )
                )
            except Exception:
                continue

        return ImprovementSimulationResponse(
            current_estimate=round(base_price, 2),
            scenarios=scenarios,
        )
