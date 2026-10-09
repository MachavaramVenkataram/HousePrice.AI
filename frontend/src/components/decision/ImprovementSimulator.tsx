"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Hammer,
  TrendingUp,
  DollarSign,
  Sparkles,
  Info,
  CheckCircle2,
  ArrowRight,
  Sliders,
  Calculator,
  ArrowUpRight,
} from "lucide-react";
import { PropertyFeatures, ImprovementSimulationResponse } from "@/types";
import { api } from "@/services/api";
import { GlassCard, GlassBadge, GlassButton, AnimatedNumber } from "@/components/ui";

interface ImprovementSimulatorProps {
  features: PropertyFeatures;
  currentEstimate: number;
  className?: string;
  onApplyScenario?: (improvedFeats: PropertyFeatures) => void;
}

export const ImprovementSimulator: React.FC<ImprovementSimulatorProps> = ({
  features,
  currentEstimate,
  className = "",
  onApplyScenario,
}) => {
  const [customCosts, setCustomCosts] = useState<Record<string, number>>({
    quality_upgrade: 15000,
    modern_remodel: 25000,
    space_addition: 35000,
    bathroom_addition: 12000,
  });

  const [renovationCostMode, setRenovationCostMode] = useState<boolean>(false);

  const { data, isLoading } = useQuery({
    queryKey: ["improve-simulation", features, customCosts],
    queryFn: () => api.simulateImprovements(features, customCosts),
    enabled: currentEstimate > 0,
    staleTime: 60000,
  });

  const handleCostChange = (id: string, val: number) => {
    setCustomCosts((prev) => ({ ...prev, [id]: val }));
  };

  // Helper to extract feature diffs for "WHAT CHANGED?"
  const getFeatureDiffs = (mod: PropertyFeatures) => {
    const diffs: { label: string; from: string | number; to: string | number }[] = [];
    if (mod.GrLivArea !== features.GrLivArea) {
      diffs.push({
        label: "Living Area",
        from: `${features.GrLivArea.toLocaleString()} sq ft`,
        to: `${mod.GrLivArea.toLocaleString()} sq ft`,
      });
    }
    if (mod.OverallQual !== features.OverallQual) {
      diffs.push({
        label: "Overall Quality",
        from: `${features.OverallQual}/10`,
        to: `${mod.OverallQual}/10`,
      });
    }
    if (mod.OverallCond !== features.OverallCond) {
      diffs.push({
        label: "Condition",
        from: `${features.OverallCond}/10`,
        to: `${mod.OverallCond}/10`,
      });
    }
    if (mod.FullBath !== features.FullBath) {
      diffs.push({
        label: "Full Baths",
        from: features.FullBath,
        to: mod.FullBath,
      });
    }
    if (mod.BedroomAbvGr !== features.BedroomAbvGr) {
      diffs.push({
        label: "Bedrooms",
        from: features.BedroomAbvGr,
        to: mod.BedroomAbvGr,
      });
    }
    if (mod.YearRemodAdd !== features.YearRemodAdd) {
      diffs.push({
        label: "Remodel Year",
        from: features.YearRemodAdd,
        to: mod.YearRemodAdd,
      });
    }
    if (mod.GarageCars !== features.GarageCars) {
      diffs.push({
        label: "Garage Capacity",
        from: `${features.GarageCars} cars`,
        to: `${mod.GarageCars} cars`,
      });
    }
    return diffs;
  };

  return (
    <GlassCard variant="elevated" className={`p-6 sm:p-7 space-y-6 ${className}`}>
      {/* Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 mb-1.5">
            <Hammer className="w-3 h-3 text-amber-600" />
            <span>Model-Based Scenario Simulation</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            PROPERTY IMPROVEMENT SIMULATOR
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Evaluate how the machine-learning model responds to physical modifications using actual historical regression relationships.
          </p>
        </div>

        {/* Renovation Cost Mode Toggle (Section 22) */}
        <button
          onClick={() => setRenovationCostMode(!renovationCostMode)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
            renovationCostMode
              ? "bg-amber-500 text-white border-amber-500 shadow-xs"
              : "bg-white text-slate-700 border-slate-200 hover:border-amber-300"
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>{renovationCostMode ? "Renovation Cost Mode Active" : "Enable Renovation Cost Mode"}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400 space-y-2">
          <div className="inline-block animate-spin">
            <Hammer className="w-6 h-6 text-amber-500" />
          </div>
          <div className="text-xs font-semibold">Simulating improvements through ML model...</div>
        </div>
      ) : !data || data.scenarios.length === 0 ? (
        <div className="p-6 text-center text-slate-400 text-xs">
          Improvement simulation unavailable for these inputs.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.scenarios.map((sc) => {
              const netDiff = sc.net_modeled_scenario_difference;
              const isPositiveNet = netDiff !== null && netDiff !== undefined && netDiff > 0;
              const diffs = getFeatureDiffs(sc.modified_features);
              const userCost = customCosts[sc.scenario_id] || 0;

              return (
                <div
                  key={sc.scenario_id}
                  className="p-5 rounded-2xl bg-white/80 border border-slate-200/70 space-y-4 hover:border-amber-300/80 transition-all shadow-xs"
                >
                  {/* Scenario Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{sc.name}</h4>
                      <p className="text-[11px] text-slate-500 leading-snug">{sc.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        Model Response
                      </div>
                      <div className="text-base font-black text-emerald-700 font-mono flex items-center justify-end gap-0.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>+${Math.round(sc.modeled_difference).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* WHAT CHANGED? Section (Section 21) */}
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 space-y-1.5 text-xs">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      WHAT CHANGED?
                    </div>
                    {diffs.length > 0 ? (
                      <div className="space-y-1">
                        {diffs.map((d, i) => (
                          <div key={i} className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-slate-600">{d.label}:</span>
                            <span className="font-mono text-slate-900 font-semibold flex items-center gap-1">
                              <span>{d.from}</span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                              <span className="text-violet-700 font-bold">{d.to}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">Targeted attribute update</div>
                    )}
                  </div>

                  {/* Valuation Comparison Details */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                    <div className="p-2 rounded-xl bg-slate-50/60">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                        Current Estimate
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        ${Math.round(currentEstimate).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50/60">
                      <span className="text-[10px] text-emerald-700 block font-semibold uppercase">
                        Improved Estimate
                      </span>
                      <span className="font-mono font-black text-slate-900">
                        ${Math.round(sc.potential_estimate).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Renovation Cost Mode (Section 22) */}
                  {renovationCostMode && (
                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/70 space-y-2 text-xs">
                      <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                        ILLUSTRATIVE MODEL-BASED SCENARIO
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-600">Model-estimated value change:</span>
                          <span className="font-mono font-bold text-emerald-700">
                            +${Math.round(sc.modeled_difference).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-600">User-entered renovation cost:</span>
                          <div className="flex items-center gap-1 font-mono">
                            <span>$</span>
                            <input
                              type="number"
                              min={0}
                              step={1000}
                              value={userCost}
                              onChange={(e) => handleCostChange(sc.scenario_id, Number(e.target.value))}
                              className="w-20 px-2 py-0.5 rounded border border-slate-300 bg-white text-right text-xs font-bold"
                            />
                          </div>
                        </div>

                        {netDiff !== null && netDiff !== undefined && (
                          <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 text-xs font-bold">
                            <span className="text-slate-700">Difference:</span>
                            <span
                              className={`font-mono ${
                                isPositiveNet ? "text-emerald-700" : "text-rose-600"
                              }`}
                            >
                              {netDiff >= 0 ? "+" : "-"}${Math.round(Math.abs(netDiff)).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-amber-700 italic">
                        Not a guaranteed return or construction quote.
                      </p>
                    </div>
                  )}

                  {onApplyScenario && (
                    <button
                      onClick={() => onApplyScenario(sc.modified_features)}
                      className="w-full py-1.5 px-3 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Apply Scenario to Inputs</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Statistical Disclaimer Notice (Section 20 & 47) */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Model-Estimated Scenario Disclaimer:</strong> {data.disclaimer} Scenario changes describe the model&apos;s statistical response to altered inputs and do not establish causal real-world price changes.
            </span>
          </div>
        </div>
      )}
    </GlassCard>
  );
};
