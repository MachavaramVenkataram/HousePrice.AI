"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  Info,
  DollarSign,
  Calendar,
  Percent,
  TrendingDown,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
} from "lucide-react";
import { AffordabilityCalculation, AffordabilityRequest } from "@/types";
import { api } from "@/services/api";
import { GlassCard, GlassBadge, AnimatedNumber } from "@/components/ui";

interface AffordabilityPlannerProps {
  estimatedPrice: number;
  className?: string;
  showExpertFormula?: boolean;
}

export const AffordabilityPlanner: React.FC<AffordabilityPlannerProps> = ({
  estimatedPrice,
  className = "",
  showExpertFormula = false,
}) => {
  // Preset scenarios: Budget A (Conservative), Budget B (Target), Budget C (Stretch)
  const [activeTab, setActiveTab] = useState<"A" | "B" | "C">("B");
  const [showFormula, setShowFormula] = useState<boolean>(showExpertFormula);

  const [scenarios, setScenarios] = useState<Record<"A" | "B" | "C", AffordabilityRequest>>({
    A: {
      budget: Math.round(estimatedPrice * 0.95),
      estimated_price: estimatedPrice,
      down_payment: Math.round(estimatedPrice * 0.2),
      interest_rate_pct: 6.5,
      loan_term_years: 30,
      monthly_property_tax: 250,
      monthly_home_insurance: 100,
    },
    B: {
      budget: Math.round(estimatedPrice * 1.05),
      estimated_price: estimatedPrice,
      down_payment: Math.round(estimatedPrice * 0.2),
      interest_rate_pct: 6.5,
      loan_term_years: 30,
      monthly_property_tax: 250,
      monthly_home_insurance: 100,
    },
    C: {
      budget: Math.round(estimatedPrice * 1.15),
      estimated_price: estimatedPrice,
      down_payment: Math.round(estimatedPrice * 0.15),
      interest_rate_pct: 6.5,
      loan_term_years: 30,
      monthly_property_tax: 250,
      monthly_home_insurance: 100,
    },
  });

  const [allCalcs, setAllCalcs] = useState<Record<"A" | "B" | "C", AffordabilityCalculation | null>>({
    A: null,
    B: null,
    C: null,
  });

  // Keep estimated_price synced when prop changes
  useEffect(() => {
    setScenarios((prev) => ({
      A: { ...prev.A, estimated_price: estimatedPrice },
      B: { ...prev.B, estimated_price: estimatedPrice },
      C: { ...prev.C, estimated_price: estimatedPrice },
    }));
  }, [estimatedPrice]);

  // Recalculate all 3 scenarios
  useEffect(() => {
    let isMounted = true;

    Promise.all([
      api.calculateAffordability(scenarios.A),
      api.calculateAffordability(scenarios.B),
      api.calculateAffordability(scenarios.C),
    ])
      .then(([resA, resB, resC]) => {
        if (isMounted) {
          setAllCalcs({
            A: resA,
            B: resB,
            C: resC,
          });
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [scenarios]);

  const currentScenario = scenarios[activeTab];
  const currentCalc = allCalcs[activeTab];

  const updateCurrentScenario = (field: keyof AffordabilityRequest, value: number) => {
    setScenarios((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value,
      },
    }));
  };

  return (
    <GlassCard variant="elevated" className={`p-6 sm:p-7 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 mb-1.5">
            <Wallet className="w-3 h-3 text-emerald-600" />
            <span>Illustrative payment calculation</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            AFFORDABILITY PLANNER
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Compare model estimates against multi-budget targets and compute standard amortization payments. Illustrative payment calculation only.
          </p>
        </div>

        {currentCalc && (
          <GlassBadge variant={currentCalc.is_within_budget ? "mint" : "amber"} size="md" dot>
            {currentCalc.is_within_budget ? "Within Budget" : "Exceeds Budget"}
          </GlassBadge>
        )}
      </div>

      {/* Scenario Selector Tabs: Budget A, Budget B, Budget C */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-1.5 rounded-2xl border border-slate-200/60">
        <div className="flex items-center gap-1.5">
          {(["A", "B", "C"] as const).map((tab) => {
            const label = tab === "A" ? "Budget A (Conservative)" : tab === "B" ? "Budget B (Target)" : "Budget C (Stretch)";
            const isActive = activeTab === tab;
            const scenarioBudget = scenarios[tab].budget;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
                }`}
              >
                <span>{label}</span>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  ${Math.round(scenarioBudget / 1000)}k
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowFormula(!showFormula)}
          className="text-[11px] font-semibold text-violet-600 hover:text-violet-800 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-violet-50 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Formula Details</span>
          {showFormula ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Amortization Formula in Expert Mode */}
      {showFormula && (
        <div className="p-4 rounded-2xl bg-violet-50/50 border border-violet-100 text-xs text-slate-700 space-y-2">
          <div className="font-bold text-violet-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>Standard Mathematical Amortization Formula</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-violet-100 font-mono text-[11px] text-slate-800 text-center">
            Monthly Payment = P × [ r(1 + r)ⁿ ] / [ (1 + r)ⁿ - 1 ] + Taxes + Insurance
          </div>
          <div className="text-[11px] text-slate-500 leading-relaxed grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div><strong>P (Principal):</strong> Property Price − Down Payment (${Math.round(currentCalc?.loan_amount ?? 0).toLocaleString()})</div>
            <div><strong>r (Monthly Rate):</strong> Annual Rate / 12 ({(currentScenario.interest_rate_pct / 12).toFixed(3)}%)</div>
            <div><strong>n (Payments):</strong> Loan Term × 12 ({currentScenario.loan_term_years * 12} months)</div>
          </div>
        </div>
      )}

      {/* Interactive Controls for Current Scenario */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold">
        {/* Target Budget */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-600">
            <span>Target Budget:</span>
            <span className="font-mono text-slate-900">${currentScenario.budget.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={100000}
            max={800000}
            step={5000}
            value={currentScenario.budget}
            onChange={(e) => updateCurrentScenario("budget", Number(e.target.value))}
            className="w-full accent-violet-600 cursor-pointer"
          />
        </div>

        {/* Down Payment */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-600">
            <span>Down Payment:</span>
            <span className="font-mono text-slate-900">
              ${currentScenario.down_payment.toLocaleString()} (
              {Math.round((currentScenario.down_payment / (estimatedPrice || 1)) * 100)}%)
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={estimatedPrice}
            step={2500}
            value={currentScenario.down_payment}
            onChange={(e) => updateCurrentScenario("down_payment", Number(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
        </div>

        {/* Interest Rate */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-600">
            <span>Mortgage Rate:</span>
            <span className="font-mono text-slate-900">{currentScenario.interest_rate_pct}%</span>
          </div>
          <input
            type="range"
            min={2.0}
            max={12.0}
            step={0.1}
            value={currentScenario.interest_rate_pct}
            onChange={(e) => updateCurrentScenario("interest_rate_pct", Number(e.target.value))}
            className="w-full accent-violet-600 cursor-pointer"
          />
        </div>

        {/* Loan Term */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-600">
            <span>Loan Term:</span>
            <span className="text-slate-900">{currentScenario.loan_term_years} Years</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[15, 20, 30].map((term) => (
              <button
                key={term}
                onClick={() => updateCurrentScenario("loan_term_years", term)}
                className={`py-1 rounded-lg text-center transition-all cursor-pointer ${
                  currentScenario.loan_term_years === term
                    ? "bg-violet-600 text-white font-bold shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {term}y
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Result Scorecards */}
      {currentCalc && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/70 space-y-1 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Illustrative Monthly Payment
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono flex items-baseline gap-1">
              $<AnimatedNumber value={Math.round(currentCalc.total_monthly_payment)} />
              <span className="text-xs text-slate-400 font-normal"> / mo</span>
            </div>
            <div className="text-[11px] text-slate-500">
              P&I: ${Math.round(currentCalc.monthly_principal_interest).toLocaleString()} • Taxes & Ins: $
              {Math.round(currentCalc.monthly_taxes_insurance).toLocaleString()}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/70 space-y-1 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Estimated Loan Balance
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono">
              $<AnimatedNumber value={Math.round(currentCalc.loan_amount)} />
            </div>
            <div className="text-[11px] text-slate-500">
              {currentCalc.down_payment_pct}% down (${Math.round(currentCalc.down_payment).toLocaleString()} upfront)
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/70 space-y-1 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Budget vs Model Estimate
            </span>
            <div
              className={`text-2xl font-black font-mono ${
                currentCalc.is_within_budget ? "text-emerald-700" : "text-amber-600"
              }`}
            >
              {currentCalc.is_within_budget ? "+" : "-"}$
              <AnimatedNumber value={Math.round(Math.abs(currentCalc.budget_delta))} />
            </div>
            <p className="text-[11px] text-slate-600 font-medium">{currentCalc.status_label}</p>
          </div>
        </div>
      )}

      {/* Multi-Budget Comparison Table (Section 26) */}
      <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-tight">
            <Layers className="w-3.5 h-3.5 text-violet-600" />
            <span>Interactive Multi-Budget Comparison</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Select a tab above to customize</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                <th className="pb-2">Scenario</th>
                <th className="pb-2">Budget</th>
                <th className="pb-2">Est. Property Value</th>
                <th className="pb-2">Down Payment</th>
                <th className="pb-2">Loan Amount</th>
                <th className="pb-2">Est. Payment</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(["A", "B", "C"] as const).map((key) => {
                const s = scenarios[key];
                const c = allCalcs[key];
                const isSelected = activeTab === key;
                return (
                  <tr
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-violet-50/60 font-semibold" : "hover:bg-slate-50/60"
                    }`}
                  >
                    <td className="py-2.5 font-bold text-slate-900">
                      Budget {key} {key === "A" ? "(Cons.)" : key === "B" ? "(Target)" : "(Stretch)"}
                    </td>
                    <td className="py-2.5 font-mono text-slate-800">${s.budget.toLocaleString()}</td>
                    <td className="py-2.5 font-mono text-slate-800">${estimatedPrice.toLocaleString()}</td>
                    <td className="py-2.5 font-mono text-slate-800">${s.down_payment.toLocaleString()}</td>
                    <td className="py-2.5 font-mono text-slate-800">${c ? Math.round(c.loan_amount).toLocaleString() : "—"}</td>
                    <td className="py-2.5 font-mono font-bold text-slate-900">
                      ${c ? Math.round(c.total_monthly_payment).toLocaleString() : "—"}/mo
                    </td>
                    <td className="py-2.5">
                      {c ? (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.is_within_budget
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {c.is_within_budget ? "Within Budget" : "Exceeds"}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Concise Financial Disclaimer (Section 27) */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <span>
          <strong>Illustrative payment calculation:</strong> Payment calculations are illustrative and depend on the inputs you provide. They are not financial advice or mortgage pre-approvals.
        </span>
      </div>
    </GlassCard>
  );
};
