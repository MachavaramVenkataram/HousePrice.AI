"use client";

import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/services/api";
import { PropertyFeatures, normalizeModelInfo } from "@/types";
import { SensitivityChart } from "@/components/charts/SensitivityChart";
import {
  PageTransition,
  GlassCard,
  GlassTabs,
  AnimatedNumber,
} from "@/components/ui";
import {
  ImprovementSimulator,
  ScenarioComparisonMatrix,
} from "@/components/decision";
import {
  SlidersHorizontal,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Sparkles,
  Info,
  Maximize2,
  Calendar,
  Bed,
  Bath,
  Warehouse,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

const BASE_PROPERTY: PropertyFeatures = {
  GrLivArea: 1750,
  TotalBsmtSF: 1000,
  "1stFlrSF": 1000,
  "2ndFlrSF": 750,
  YearBuilt: 1988,
  YearRemodAdd: 1998,
  OverallQual: 7,
  OverallCond: 5,
  FullBath: 2,
  HalfBath: 1,
  BsmtFullBath: 1,
  BedroomAbvGr: 3,
  TotRmsAbvGrd: 7,
  Fireplaces: 1,
  GarageCars: 2,
  GarageArea: 500,
  LotArea: 9600,
  LotFrontage: 70,
  WoodDeckSF: 150,
  OpenPorchSF: 40,
  MoSold: 5,
  YrSold: 2008,
  Neighborhood: "CollgCr",
  BldgType: "1Fam",
  HouseStyle: "2Story",
  MSZoning: "RL",
  KitchenQual: "Gd",
  BsmtQual: "Gd",
  HeatingQC: "Ex",
  CentralAir: "Y",
  GarageType: "Attchd",
  SaleCondition: "Normal",
};

// Preset Scenarios for Scenario Comparison (Req 35)
const SCENARIO_B_LARGER: PropertyFeatures = {
  ...BASE_PROPERTY,
  GrLivArea: 2150,
  "1stFlrSF": 1200,
  "2ndFlrSF": 950,
  TotalBsmtSF: 1150,
  TotRmsAbvGrd: 8,
};

const SCENARIO_C_ADDITIONAL_BED_REMODEL: PropertyFeatures = {
  ...BASE_PROPERTY,
  BedroomAbvGr: 4,
  TotRmsAbvGrd: 8,
  FullBath: 3,
  OverallQual: 8,
  YearRemodAdd: 2005,
};

export default function WhatIfPage() {
  const [baseFeatures, setBaseFeatures] = useState<PropertyFeatures>(BASE_PROPERTY);
  const [modifiedFeatures, setModifiedFeatures] = useState<PropertyFeatures>(BASE_PROPERTY);
  const [selectedSensitivityFeat, setSelectedSensitivityFeat] = useState<string>("GrLivArea");
  const [activeScenarioTab, setActiveScenarioTab] = useState<string>("custom");

  // State for Scenario Comparison (A vs B vs C)
  const [scenarioAData, setScenarioAData] = useState<any>(null);
  const [scenarioBData, setScenarioBData] = useState<any>(null);
  const [scenarioCData, setScenarioCData] = useState<any>(null);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);

  const whatIfMutation = useMutation({
    mutationFn: (vars: { base: PropertyFeatures; mod: PropertyFeatures }) =>
      api.whatIf(vars.base, vars.mod),
  });

  const sensitivityMutation = useMutation({
    mutationFn: (feat: string) => api.sensitivity(modifiedFeatures, feat, 15),
  });

  // Run initial simulation on load
  useEffect(() => {
    whatIfMutation.mutate({ base: baseFeatures, mod: modifiedFeatures });
    sensitivityMutation.mutate(selectedSensitivityFeat);
  }, []);

  const handleSliderChange = (field: keyof PropertyFeatures, val: any) => {
    const updated = { ...modifiedFeatures, [field]: val };
    setModifiedFeatures(updated);
    whatIfMutation.mutate({ base: baseFeatures, mod: updated });
  };

  const handleRunSensitivity = (feat: string) => {
    setSelectedSensitivityFeat(feat);
    sensitivityMutation.mutate(feat);
  };

  const handleReset = () => {
    setModifiedFeatures(baseFeatures);
    whatIfMutation.mutate({ base: baseFeatures, mod: baseFeatures });
  };

  const handleLoadPreset = (preset: "larger" | "remodel") => {
    const target = preset === "larger" ? SCENARIO_B_LARGER : SCENARIO_C_ADDITIONAL_BED_REMODEL;
    setModifiedFeatures(target);
    whatIfMutation.mutate({ base: baseFeatures, mod: target });
  };

  // Run all 3 scenarios for the comparison view
  const loadScenarioComparison = async () => {
    setIsLoadingScenarios(true);
    try {
      const [resA, resB, resC] = await Promise.all([
        api.predict(BASE_PROPERTY),
        api.predict(SCENARIO_B_LARGER),
        api.predict(SCENARIO_C_ADDITIONAL_BED_REMODEL),
      ]);
      setScenarioAData(resA);
      setScenarioBData(resB);
      setScenarioCData(resC);
    } catch (e) {
      console.error("Failed to load scenario comparison", e);
    } finally {
      setIsLoadingScenarios(false);
    }
  };

  useEffect(() => {
    if (activeScenarioTab === "comparison" && !scenarioAData) {
      loadScenarioComparison();
    }
  }, [activeScenarioTab]);

  const sim = whatIfMutation.data;
  const sens = sensitivityMutation.data;

  return (
    <PageTransition className="space-y-10 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-slate-200/60 pb-7">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-violet-100/70 text-violet-800 border border-violet-200/60 shadow-2xs mb-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-violet-600" />
            <span>Counterfactual Simulator & Sensitivity Analysis</span>
          </div>
          <h1 className="text-2xl sm:text-3.5xl font-extrabold text-slate-900 tracking-tight">
            What-If Scenario Simulation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl font-medium">
            Explore how changing property characteristics changes the model&apos;s estimate.
            Simulations calculate real-time Conformal Prediction intervals and non-causal attribution shifts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start">
          <GlassTabs
            tabs={[
              { id: "custom", label: "Interactive Sliders" },
              { id: "improvements", label: "Improvement Simulator (ROI)" },
              { id: "comparison", label: "Scenario Matrix (A vs B vs C)" },
            ]}
            activeTab={activeScenarioTab}
            onChange={(tabId) => setActiveScenarioTab(tabId)}
          />
          {activeScenarioTab === "custom" && (
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-xl glass-panel text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
              title="Reset to baseline property"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: Interactive Slider Simulator */}
      {activeScenarioTab === "custom" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sliders Column (50% approx) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="glass-panel p-6 sm:p-7 space-y-6 rounded-3xl bg-white/85">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Interactive Parameters
                  </h2>
                  <p className="text-[11px] text-slate-500">Adjust features to observe live model response</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLoadPreset("larger")}
                    className="text-[11px] font-bold text-violet-700 bg-violet-50/80 hover:bg-violet-100/80 px-2.5 py-1 rounded-lg border border-violet-200/60 transition-all cursor-pointer shadow-2xs"
                  >
                    +400 sq ft
                  </button>
                  <button
                    onClick={() => handleLoadPreset("remodel")}
                    className="text-[11px] font-bold text-violet-700 bg-violet-50/80 hover:bg-violet-100/80 px-2.5 py-1 rounded-lg border border-violet-200/60 transition-all cursor-pointer shadow-2xs"
                  >
                    +1 Bed & Qual 8
                  </button>
                </div>
              </div>

              {/* Living Area Slider */}
              <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/60 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-2 text-slate-800">
                    <Maximize2 className="w-4 h-4 text-violet-600" />
                    Above-Grade Living Area
                  </span>
                  <span className="font-mono text-slate-900 font-bold">
                    <AnimatedNumber value={modifiedFeatures.GrLivArea} /> sq ft{" "}
                    <span className="text-slate-400 font-normal">
                      ({modifiedFeatures.GrLivArea - baseFeatures.GrLivArea >= 0 ? "+" : ""}
                      {modifiedFeatures.GrLivArea - baseFeatures.GrLivArea})
                    </span>
                  </span>
                </div>
                <input
                  type="range"
                  min={800}
                  max={4000}
                  step={50}
                  value={modifiedFeatures.GrLivArea}
                  onChange={(e) => handleSliderChange("GrLivArea", Number(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer"
                />
              </div>

              {/* Overall Quality Slider */}
              <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/60 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-2 text-slate-800">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                    Overall Material Quality
                  </span>
                  <span className="font-mono text-slate-900 font-bold">
                    <AnimatedNumber value={modifiedFeatures.OverallQual} /> / 10{" "}
                    <span className="text-slate-400 font-normal">
                      ({modifiedFeatures.OverallQual - baseFeatures.OverallQual >= 0 ? "+" : ""}
                      {modifiedFeatures.OverallQual - baseFeatures.OverallQual})
                    </span>
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={modifiedFeatures.OverallQual}
                  onChange={(e) => handleSliderChange("OverallQual", Number(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer"
                />
              </div>

              {/* Year Built Slider */}
              <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/60 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-2 text-slate-800">
                    <Calendar className="w-4 h-4 text-violet-600" />
                    Year Built / Remodeled
                  </span>
                  <span className="font-mono text-slate-900 font-bold">
                    Built: {modifiedFeatures.YearBuilt} | Remod: {modifiedFeatures.YearRemodAdd}
                  </span>
                </div>
                <input
                  type="range"
                  min={1920}
                  max={2010}
                  step={1}
                  value={modifiedFeatures.YearBuilt}
                  onChange={(e) => {
                    const yr = Number(e.target.value);
                    handleSliderChange("YearBuilt", yr);
                    if (modifiedFeatures.YearRemodAdd < yr) {
                      handleSliderChange("YearRemodAdd", yr);
                    }
                  }}
                  className="w-full accent-violet-600 cursor-pointer"
                />
              </div>

              {/* Bathrooms Slider */}
              <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/60 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-2 text-slate-800">
                    <Bath className="w-4 h-4 text-violet-600" />
                    Full Bathrooms
                  </span>
                  <span className="font-mono text-slate-900 font-bold">
                    <AnimatedNumber value={modifiedFeatures.FullBath} /> Full Baths
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={1}
                  value={modifiedFeatures.FullBath}
                  onChange={(e) => handleSliderChange("FullBath", Number(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer"
                />
              </div>

              {/* Bedrooms Slider */}
              <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/60 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-2 text-slate-800">
                    <Bed className="w-4 h-4 text-violet-600" />
                    Bedrooms Above Grade
                  </span>
                  <span className="font-mono text-slate-900 font-bold">
                    <AnimatedNumber value={modifiedFeatures.BedroomAbvGr} /> Bedrooms
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={6}
                  step={1}
                  value={modifiedFeatures.BedroomAbvGr}
                  onChange={(e) => handleSliderChange("BedroomAbvGr", Number(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer"
                />
              </div>

              {/* Garage Capacity Slider */}
              <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/60 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-2 text-slate-800">
                    <Warehouse className="w-4 h-4 text-violet-600" />
                    Garage Capacity
                  </span>
                  <span className="font-mono text-slate-900 font-bold">
                    <AnimatedNumber value={modifiedFeatures.GarageCars} /> Cars
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={4}
                  step={1}
                  value={modifiedFeatures.GarageCars}
                  onChange={(e) => handleSliderChange("GarageCars", Number(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Live Delta Results Card (Req 35: Financial Simulator Feeling) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="glass-panel-elevated p-6 sm:p-7 space-y-6 rounded-3xl bg-white/90">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/50">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Simulation Outcome
                  </span>
                  <div className="text-sm font-bold text-slate-900">WHAT-IF MODEL ESTIMATE</div>
                </div>
                {(() => {
                  const modelInfo = normalizeModelInfo(sim?.model, "Voting Ensemble", "v1.0.0");
                  return (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-violet-50/80 text-violet-700 border border-violet-200/60 shadow-2xs inline-flex items-center gap-1.5">
                      <span>Model: {modelInfo.name}</span>
                      {modelInfo.version && (
                        <span className="font-mono text-[10px] opacity-75">({modelInfo.version})</span>
                      )}
                    </span>
                  );
                })()}
              </div>

              {/* Animated Comparison: Current vs Scenario with Connecting Arrow */}
              <div className="relative p-5 rounded-2xl glass-panel bg-white/80">
                <div className="grid grid-cols-2 gap-6 items-center">
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      CURRENT
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-mono">
                      {sim ? (
                        <AnimatedNumber
                          value={Math.round(sim.original_price)}
                          prefix="$"
                        />
                      ) : (
                        "..."
                      )}
                    </div>
                    {sim?.original_interval && (
                      <div className="text-[11px] text-slate-500 font-mono">
                        ${Math.round(sim.original_interval.lower / 1000)}k — ${Math.round(sim.original_interval.upper / 1000)}k
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400">Baseline configuration</div>
                  </div>

                  {/* Animated Connecting Indicator */}
                  <div className="space-y-1.5 border-l border-slate-200/80 pl-6 relative">
                    <div className="text-[10px] font-bold text-violet-600 uppercase tracking-wider flex items-center gap-1.5">
                      <span>SCENARIO</span>
                      <ArrowRight className="w-3.5 h-3.5 text-violet-500 animate-pulse" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-violet-900 font-mono">
                      {sim ? (
                        <AnimatedNumber
                          value={Math.round(sim.new_price)}
                          prefix="$"
                        />
                      ) : (
                        "..."
                      )}
                    </div>
                    {sim?.new_interval && (
                      <div className="text-[11px] text-violet-700 font-mono">
                        ${Math.round(sim.new_interval.lower / 1000)}k — ${Math.round(sim.new_interval.upper / 1000)}k
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400">Counterfactual estimate</div>
                  </div>
                </div>
              </div>

              {/* Difference Callout (Mint for positive, Coral for negative) */}
              {sim && (
                <div
                  className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${
                    sim.difference >= 0
                      ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-950 shadow-sm shadow-emerald-500/5"
                      : "bg-rose-50/70 border-rose-200/80 text-rose-950 shadow-sm shadow-rose-500/5"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-xs ${
                        sim.difference >= 0
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {sim.difference >= 0 ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-600">Model Estimate Difference</div>
                      <div className="text-2xl font-black font-mono">
                        {sim.difference >= 0 ? "+" : "-"}$
                        <AnimatedNumber
                          value={Math.abs(Math.round(sim.difference))}
                        />{" "}
                        <span className="text-xs font-semibold opacity-75">
                          ({sim.difference >= 0 ? "+" : ""}{sim.percentage_change.toFixed(2)}%)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {sim.delta_statement ||
                          `Model estimate changes by ${sim.difference >= 0 ? "+" : ""}$${Math.abs(Math.round(sim.difference)).toLocaleString()} under counterfactual simulation.`}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Diverging factors list */}
              {sim?.top_diverging_factors && sim.top_diverging_factors.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-slate-200/50">
                  <span className="text-xs font-bold text-slate-700">Modified Attribute Breakdown:</span>
                  <div className="space-y-1.5 font-mono text-xs">
                    {sim.top_diverging_factors.map((f) => (
                      <div
                        key={f.feature}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 border border-slate-200/60 text-slate-700 shadow-2xs"
                      >
                        <span className="font-sans font-semibold text-slate-800">{f.feature}</span>
                        <span className="text-slate-500">
                          {f.from_value} <ArrowRight className="inline w-3 h-3 mx-1 text-slate-400" />{" "}
                          <strong className="text-violet-700 font-bold">{f.to_value}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Responsible Caution Footer (Statistical Association Only) */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-900 flex items-start gap-2.5 shadow-2xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Statistical Association Only:</strong> This simulated difference reflects statistical correlation learned from historical housing data.
                  It does <em>not</em> imply direct physical causation or guarantee that real renovations will recoup this amount.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Improvement Simulator & Modeled Value Delta */}
      {activeScenarioTab === "improvements" && (
        <div className="space-y-6">
          <ImprovementSimulator
            features={modifiedFeatures}
            currentEstimate={sim ? sim.new_price : 215000}
            onApplyScenario={(improvedFeats) => {
              setModifiedFeatures(improvedFeats);
              whatIfMutation.mutate({ base: baseFeatures, mod: improvedFeats });
              setActiveScenarioTab("custom");
            }}
          />
        </div>
      )}

      {/* VIEW 3: Scenario Comparison (Scenario A vs Scenario B vs Scenario C + Matrix) */}
      {activeScenarioTab === "comparison" && (
        <div className="space-y-6">
          <div className="glass-panel-elevated p-6 sm:p-7 space-y-6 rounded-3xl bg-white/90">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50/80 px-2.5 py-1 rounded-full border border-violet-200/60">
                  Model Simulation
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-2">
                  Multi-Scenario Property Comparison
                </h2>
                <p className="text-xs text-slate-500">
                  Directly compare three distinct property states through the active machine learning pipeline.
                </p>
              </div>
              <button
                onClick={loadScenarioComparison}
                disabled={isLoadingScenarios}
                className="px-3.5 py-2 rounded-xl glass-panel text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-2 self-start cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingScenarios ? "animate-spin" : ""}`} />
                <span>Rerun Simulations</span>
              </button>
            </div>

            {isLoadingScenarios ? (
              <div className="py-16 text-center text-xs text-slate-400">
                Running real-time inferences for Scenario A, B, and C...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Scenario A */}
                <div className="glass-panel p-5 space-y-4 rounded-2xl bg-white/80">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      Scenario A
                    </span>
                    <span className="text-[10px] text-slate-400">Baseline</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Current Property</h3>
                    <p className="text-[11px] text-slate-500">Standard 1,750 sq ft baseline</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/70 border border-slate-200/60 space-y-1 shadow-2xs">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">
                      Estimated Property Value
                    </div>
                    <div className="text-2xl font-black text-slate-800 font-mono">
                      ${scenarioAData ? Math.round(scenarioAData.predicted_price).toLocaleString() : "..."}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Interval:{" "}
                      {scenarioAData?.prediction_interval?.lower != null && scenarioAData?.prediction_interval?.upper != null
                        ? `$${Math.round(scenarioAData.prediction_interval.lower).toLocaleString()} — $${Math.round(scenarioAData.prediction_interval.upper).toLocaleString()}`
                        : "Unavailable"}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className="font-semibold text-slate-700 text-[11px]">Configuration:</span>
                    <ul className="text-slate-500 space-y-1 text-[11px]">
                      <li>• Living Area: 1,750 sq ft</li>
                      <li>• Bedrooms: 3 Above Grade</li>
                      <li>• Bathrooms: 2 Full, 1 Half</li>
                      <li>• Overall Quality: 7 / 10</li>
                    </ul>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50/80 text-[10px] text-slate-500">
                    Baseline reference point
                  </div>
                </div>

                {/* Scenario B */}
                <div className="glass-panel p-5 border-violet-200/80 space-y-4 rounded-2xl bg-white/80">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700">
                      Scenario B
                    </span>
                    <span className="text-[10px] text-slate-400">+400 sq ft</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-violet-950">Larger Property</h3>
                    <p className="text-[11px] text-slate-500">Expanded living area & basement</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/70 border border-violet-200/60 space-y-1 shadow-2xs">
                    <div className="text-[10px] font-semibold text-violet-600 uppercase">
                      Estimated Property Value
                    </div>
                    <div className="text-2xl font-black text-violet-900 font-mono">
                      ${scenarioBData ? Math.round(scenarioBData.predicted_price).toLocaleString() : "..."}
                    </div>
                    <div className="text-[11px] text-violet-700 font-mono">
                      Interval:{" "}
                      {scenarioBData?.prediction_interval?.lower != null && scenarioBData?.prediction_interval?.upper != null
                        ? `$${Math.round(scenarioBData.prediction_interval.lower).toLocaleString()} — $${Math.round(scenarioBData.prediction_interval.upper).toLocaleString()}`
                        : "Unavailable"}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className="font-semibold text-slate-700 text-[11px]">Configuration:</span>
                    <ul className="text-slate-500 space-y-1 text-[11px]">
                      <li>• Living Area: 2,150 sq ft (+400)</li>
                      <li>• Basement: 1,150 sq ft (+150)</li>
                      <li>• Total Rooms: 8 (+1)</li>
                      <li>• Overall Quality: 7 / 10</li>
                    </ul>
                  </div>

                  {scenarioAData && scenarioBData && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-[11px] text-emerald-800 font-bold flex items-center justify-between border border-emerald-200/60">
                      <span>Model Estimate Delta:</span>
                      <span className="font-mono">
                        +${Math.round(scenarioBData.predicted_price - scenarioAData.predicted_price).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Scenario C */}
                <div className="glass-panel p-5 border-indigo-200/80 space-y-4 rounded-2xl bg-white/80">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                      Scenario C
                    </span>
                    <span className="text-[10px] text-slate-400">Remodel</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-indigo-950">Additional Bed & Upgrade</h3>
                    <p className="text-[11px] text-slate-500">4 beds, 3 baths, Qual 8 upgrade</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/70 border border-indigo-200/60 space-y-1 shadow-2xs">
                    <div className="text-[10px] font-semibold text-indigo-600 uppercase">
                      Estimated Property Value
                    </div>
                    <div className="text-2xl font-black text-indigo-900 font-mono">
                      ${scenarioCData ? Math.round(scenarioCData.predicted_price).toLocaleString() : "..."}
                    </div>
                    <div className="text-[11px] text-indigo-700 font-mono">
                      Interval:{" "}
                      {scenarioCData?.prediction_interval?.lower != null && scenarioCData?.prediction_interval?.upper != null
                        ? `$${Math.round(scenarioCData.prediction_interval.lower).toLocaleString()} — $${Math.round(scenarioCData.prediction_interval.upper).toLocaleString()}`
                        : "Unavailable"}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className="font-semibold text-slate-700 text-[11px]">Configuration:</span>
                    <ul className="text-slate-500 space-y-1 text-[11px]">
                      <li>• Bedrooms: 4 (+1)</li>
                      <li>• Bathrooms: 3 Full (+1)</li>
                      <li>• Overall Quality: 8 / 10 (+1)</li>
                      <li>• Remodel Year: 2005</li>
                    </ul>
                  </div>

                  {scenarioAData && scenarioCData && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-[11px] text-emerald-800 font-bold flex items-center justify-between border border-emerald-200/60">
                      <span>Model Estimate Delta:</span>
                      <span className="font-mono">
                        +${Math.round(scenarioCData.predicted_price - scenarioAData.predicted_price).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="p-4 rounded-2xl glass-panel text-[11px] text-slate-500 flex items-start gap-2.5 bg-slate-50/70">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <strong>Methodological Context:</strong> These simulations demonstrate how the trained regression ensemble computes price estimates under distinct structural profiles.
                They do not guarantee that real-world home improvements will recoup specific dollar amounts on sale.
              </span>
            </div>
          </div>

          {/* Saved Scenarios Comparison Matrix (Req 10, 44, 45) */}
          <ScenarioComparisonMatrix
            currentFeatures={modifiedFeatures}
            currentEstimate={sim ? sim.new_price : 215000}
            onRestoreScenario={(restoredFeats) => {
              setModifiedFeatures(restoredFeats);
              whatIfMutation.mutate({ base: baseFeatures, mod: restoredFeats });
              setActiveScenarioTab("custom");
            }}
          />
        </div>
      )}

      {/* 1D Sensitivity Analysis Section */}
      <section className="glass-panel-elevated p-6 sm:p-7 space-y-6 rounded-3xl bg-white/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-600" />
              1D Feature Sensitivity Curve
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select a feature to evaluate how the trained model responds across its empirical domain while holding all other features fixed (ceteris paribus).
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-600">Evaluate Feature:</span>
            <select
              value={selectedSensitivityFeat}
              onChange={(e) => handleRunSensitivity(e.target.value)}
              className="text-xs font-bold text-slate-800 glass-input rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
            >
              <option value="GrLivArea">GrLivArea (Living Area)</option>
              <option value="OverallQual">OverallQual (Quality 1-10)</option>
              <option value="TotalBsmtSF">TotalBsmtSF (Basement SF)</option>
              <option value="YearBuilt">YearBuilt (Construction Year)</option>
              <option value="GarageCars">GarageCars (Garage Capacity)</option>
              <option value="FullBath">FullBath (Full Bathrooms)</option>
            </select>
          </div>
        </div>

        {sens && (
          <div className="p-4 rounded-2xl glass-panel bg-white/70">
            <SensitivityChart
              points={sens.points}
              featureName={sens.target_feature}
              height={360}
            />
          </div>
        )}

        <div className="p-4 rounded-2xl glass-panel text-[11px] text-slate-500 flex items-start gap-2.5 bg-slate-50/70">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            <strong>Methodology Note:</strong> This curve displays model sensitivity under synthetic variation.
            It reflects the statistical associations learned by the model and should not be construed as causal real estate guarantees.
          </span>
        </div>
      </section>
    </PageTransition>
  );
}
