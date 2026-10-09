from typing import Dict, Any
from ..schemas.decision import AffordabilityRequest, AffordabilityCalculation


class AffordabilityService:
    _instance = None

    @classmethod
    def get_instance(cls) -> "AffordabilityService":
        if cls._instance is None:
            cls._instance = AffordabilityService()
        return cls._instance

    def calculate(self, req: AffordabilityRequest) -> AffordabilityCalculation:
        """Calculates transparent mathematical mortgage amortization and budget comparison."""
        price = max(req.estimated_price, 1000.0)
        budget = max(req.budget, 1000.0)
        down = min(req.down_payment, price)
        loan_amt = max(0.0, price - down)

        down_pct = round((down / price) * 100.0, 1) if price > 0 else 0.0

        r = (req.interest_rate_pct / 100.0) / 12.0
        n = req.loan_term_years * 12

        if r > 0 and loan_amt > 0:
            factor = (1.0 + r) ** n
            monthly_pi = loan_amt * ((r * factor) / (factor - 1.0))
        elif loan_amt > 0:
            monthly_pi = loan_amt / max(n, 1)
        else:
            monthly_pi = 0.0

        monthly_ti = req.monthly_property_tax + req.monthly_home_insurance
        total_monthly = monthly_pi + monthly_ti
        total_pi_paid = monthly_pi * n
        total_interest = max(0.0, total_pi_paid - loan_amt)
        total_cost = down + total_pi_paid + (monthly_ti * n)

        budget_delta = budget - price
        is_within = budget_delta >= 0

        if is_within:
            status_label = f"Within target budget (+${round(budget_delta):,} under budget)"
        else:
            status_label = f"Exceeds target budget by ${round(abs(budget_delta)):,}"

        return AffordabilityCalculation(
            budget=round(budget, 2),
            estimated_price=round(price, 2),
            down_payment=round(down, 2),
            down_payment_pct=down_pct,
            loan_amount=round(loan_amt, 2),
            interest_rate_pct=req.interest_rate_pct,
            loan_term_years=req.loan_term_years,
            monthly_principal_interest=round(monthly_pi, 2),
            monthly_taxes_insurance=round(monthly_ti, 2),
            total_monthly_payment=round(total_monthly, 2),
            total_interest_paid=round(total_interest, 2),
            total_cost_of_loan=round(total_cost, 2),
            upfront_cash_needed=round(down, 2),
            is_within_budget=is_within,
            budget_delta=round(budget_delta, 2),
            status_label=status_label,
        )

    def calculate_multi(self, reqs: list[AffordabilityRequest]) -> list[AffordabilityCalculation]:
        """Calculates and compares multiple budget scenarios (e.g. Budget A, Budget B, Budget C)."""
        labels = ["Budget A (Conservative)", "Budget B (Target)", "Budget C (Stretch)"]
        results = []
        for i, req in enumerate(reqs):
            calc = self.calculate(req)
            calc.scenario_label = labels[i] if i < len(labels) else f"Budget Scenario #{i+1}"
            results.append(calc)
        return results

