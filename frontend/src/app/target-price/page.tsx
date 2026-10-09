"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/services/api";
import {
  PropertyFeatures,
  TargetPriceResponse,
  TargetPriceScenario,
  TargetPriceCapabilities,
  TargetPriceRequest,
} from "@/types";
import {
  PageTransition,
  GlassCard,
  GlassButton,
  GlassBadge,
  AnimatedNumber,
  StatusIndicator,
} from "@/components/ui";
import {
  Target,
  Sliders,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  Share2,
  Copy,
  Info,
  Check,
  RefreshCw,
  Home,
  Layers,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Maximize2,
  ShieldCheck,
  Building,
} from "lucide-react";

const DEFAULT_STARTING_FEATURES: PropertyFeatures = {
  GrLivArea: 1600,
  TotalBsmtSF: 950,
  "1stFlrSF": 950,
  "2ndFlrSF": 650,
  YearBuilt: 1990,
  YearRemodAdd: 2000,
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
  LotArea: 9500,
  LotFrontage: 70,
  WoodDeckSF: 120,
  OpenPorchSF: 45,
  MoSold: 6,
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

export default function TargetPricePage() {
  const router = useRouter();

  // 1. Target Budget & Objective state
  const [targetAmount, setTargetAmount] = useState<number>(250000);
  const [objective, setObjective] = useState<"balanced" | "closest_target" | "smallest_feature_changes">("balanced");
  const [startingFeatures, setStartingFeatures] = useState<PropertyFeatures>(DEFAULT_STARTING_FEATURES);

  // 2. Changeable Features selection
  const [changeableFeatures, setChangeableFeatures] = useState<string[]>([
    "GrLivArea",
    "OverallQual",
    "BedroomAbvGr",
    "FullBath",
    "GarageCars",
  ]);

  // UI state
  const [savedScenarioId, setSavedScenarioId] = useState<string | null>(null);
  const [expandedScenarioId, setExpandedScenarioId] = useState<string | null>(null);
  const [customRangeMin, setCustomRangeMin] = useState<string>("");
  const [customRangeMax, setCustomRangeMax] = useState<string>("");

  // Capabilities query
  const { data: capabilities, isLoading: isLoadingCaps } = useQuery({
    queryKey: ["target-price-capabilities"],
    queryFn: () => api.getTargetPriceCapabilities(),
  });

  // Search Mutation
  const searchMutation = useMutation({
    mutationFn: (req: TargetPriceRequest) => api.searchTargetPrice(req),
  });

  // Run initial search once capabilities load
  useEffect(() => {
    if (!searchMutation.data && !searchMutation.isPending) {
      handleSearch();
    }
  }, []);

  const handleSearch = () => {
    const req: TargetPriceRequest = {
      target_price: targetAmount,
      starting_features: startingFeatures,
      changeable_features: changeableFeatures,
      objective: objective,
      max_scenarios: 6,
    };
    if (customRangeMin || customRangeMax) {
      req.feature_constraints = {
        GrLivArea: {
          min_value: customRangeMin ? parseFloat(customRangeMin) : undefined,
          max_value: customRangeMax ? parseFloat(customRangeMax) : undefined,
        },
      };
    }
    searchMutation.mutate(req);
  };

  const handleToggleFeature = (feat: string) => {
    if (changeableFeatures.includes(feat)) {
      if (changeableFeatures.length === 1) return; // Keep at least one
      setChangeableFeatures(changeableFeatures.filter((f) => f !== feat));
    } else {
      setChangeableFeatures([...changeableFeatures, feat]);
    }
  };

  const handleSaveScenario = async (sc: TargetPriceScenario) => {
    try {
      await api.saveScenario({
        name: `Target $${targetAmount.toLocaleString()} - ${sc.name}`,
        features: sc.features,
        predicted_price: sc.predicted_price,
        lower_bound: sc.prediction_interval?.lower || sc.predicted_price * 0.9,
        upper_bound: sc.prediction_interval?.upper || sc.predicted_price * 1.1,
        model_name: sc.model_name,
        model_version: sc.model_version,
      });
      setSavedScenarioId(sc.id);
      setTimeout(() => setSavedScenarioId(null), 3000);
    } catch (e) {
      console.error("Save scenario failed", e);
    }
  };

  const handleOpenInWhatIf = (sc: TargetPriceScenario) => {
    try {
      localStorage.setItem("houseprice_whatif_base", JSON.stringify(startingFeatures));
      localStorage.setItem("houseprice_whatif_modified", JSON.stringify(sc.features));
    } catch {}
    router.push("/what-if");
  };

  const formatCurrency = (val: number) => `$${Math.round(val).toLocaleString()}`;

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Banner */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-700">
            <Target className="w-4 h-4 text-violet-600" />
            <span>Inverse Optimization & Feasibility Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Target Price Explorer
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
            Begin with your desired budget or target estimate and explore feasible combinations
            of verified Ames property features that produce model estimates closest to that goal.
            Powered by the real trained regression pipeline with conformal prediction bounds.
          </p>
        </div>

        {/* Top Disclaimer Notice */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-xs text-amber-950 flex items-start gap-3 shadow-2xs">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Target Price Disclaimer: </strong>
            These scenarios show how the trained model responds to different property inputs. They do not
            guarantee real-world transaction prices or indicate that a property with these characteristics is
            currently listed or available on the market at the target.
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column (Left, 5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <GlassCard className="p-6 bg-white/85 border-slate-200/70 shadow-sm rounded-2xl space-y-6">
              {/* Step 1: Target Budget Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-violet-600" />
                    <span>Target Model Estimate</span>
                  </label>
                  <span className="text-lg font-black text-violet-700 font-mono">
                    {formatCurrency(targetAmount)}
                  </span>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min={35000}
                  max={750000}
                  step={5000}
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                />

                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {[150000, 200000, 250000, 350000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTargetAmount(amt)}
                      className={`py-1.5 px-2 rounded-xl text-center font-semibold transition-all border ${
                        targetAmount === amt
                          ? "bg-violet-600 text-white border-violet-600 shadow-2xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      ${(amt / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Optimization Objective */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-violet-600" />
                  <span>Optimization Objective</span>
                </label>

                <div className="space-y-2 text-xs">
                  {[
                    {
                      id: "balanced",
                      name: "Balanced Scenario (Recommended)",
                      desc: "Minimizes delta to budget (60% weight) with minimal architectural changes (40% weight).",
                    },
                    {
                      id: "closest_target",
                      name: "Closest Target",
                      desc: "Strictly minimizes |estimate - target budget|, allowing larger feature adaptations.",
                    },
                    {
                      id: "smallest_feature_changes",
                      name: "Smallest Feature Changes",
                      desc: "Prioritizes preserving your starting property profile while staying near the budget.",
                    },
                  ].map((obj) => (
                    <div
                      key={obj.id}
                      onClick={() => setObjective(obj.id as any)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        objective === obj.id
                          ? "bg-violet-50/90 border-violet-300 text-violet-950 shadow-2xs"
                          : "bg-slate-50/60 border-slate-200/60 text-slate-600 hover:bg-slate-100/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{obj.name}</span>
                        {objective === obj.id && (
                          <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{obj.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 3: Changeable Features Selection */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-violet-600" />
                    <span>Permitted Variables</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {changeableFeatures.length} selected
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Select which property attributes the search engine may adjust to match your target:
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: "GrLivArea", label: "Living Area (sq ft)" },
                    { id: "OverallQual", label: "Overall Quality (1–10)" },
                    { id: "BedroomAbvGr", label: "Bedrooms" },
                    { id: "FullBath", label: "Bathrooms" },
                    { id: "GarageCars", label: "Garage Capacity" },
                    { id: "TotalBsmtSF", label: "Basement Area" },
                    { id: "Neighborhood", label: "Neighborhood" },
                    { id: "YearBuilt", label: "Construction Year" },
                  ].map((feat) => {
                    const isChecked = changeableFeatures.includes(feat.id);
                    return (
                      <button
                        type="button"
                        key={feat.id}
                        onClick={() => handleToggleFeature(feat.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                          isChecked
                            ? "bg-violet-50/80 border-violet-300 text-violet-900 font-semibold"
                            : "bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        <span className="truncate pr-1">{feat.label}</span>
                        <div
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            isChecked
                              ? "bg-violet-600 border-violet-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Optional Square Footage Constraint */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 block">
                  Optional Living Area Envelope (sq ft)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min (e.g. 1200)"
                    value={customRangeMin}
                    onChange={(e) => setCustomRangeMin(e.target.value)}
                    className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400"
                  />
                  <input
                    type="number"
                    placeholder="Max (e.g. 3000)"
                    value={customRangeMax}
                    onChange={(e) => setCustomRangeMax(e.target.value)}
                    className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleSearch}
                disabled={searchMutation.isPending}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {searchMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Searching Feasible Combinations...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-violet-200" />
                    <span>Discover Target Scenarios</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </GlassCard>
          </div>

          {/* Results Column (Right, 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {searchMutation.isPending ? (
              <GlassCard className="p-12 text-center bg-white/80 rounded-2xl border-slate-200/80 shadow-sm space-y-4">
                <RefreshCw className="w-8 h-8 text-violet-600 animate-spin mx-auto" />
                <h3 className="text-base font-bold text-slate-800">
                  Exploring Parameter Space
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Evaluating thousands of candidate configurations through the active CatBoost regression
                  pipeline and computing conformal prediction intervals...
                </p>
              </GlassCard>
            ) : searchMutation.isError ? (
              <GlassCard className="p-8 bg-rose-50/80 border-rose-200 rounded-2xl text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
                <h3 className="text-sm font-bold text-rose-900">Search Failed</h3>
                <p className="text-xs text-rose-700">
                  {searchMutation.error.message || "An unexpected error occurred during scenario search."}
                </p>
              </GlassCard>
            ) : searchMutation.data?.feasible_count === 0 ? (
              <GlassCard className="p-8 bg-amber-50/80 border-amber-200 rounded-2xl space-y-3 text-center">
                <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
                <h3 className="text-sm font-bold text-amber-950">
                  No Feasible Scenarios Found
                </h3>
                <p className="text-xs text-amber-800 max-w-md mx-auto leading-relaxed">
                  {searchMutation.data.explanation ||
                    "The selected target price cannot be realized within supported feature combinations."}
                </p>
                <div className="pt-2">
                  <span className="text-[11px] text-slate-500">
                    Ames dataset prices typically range from $35,000 to $755,000. Try setting your target
                    between $100,000 and $450,000.
                  </span>
                </div>
              </GlassCard>
            ) : searchMutation.data ? (
              <div className="space-y-4">
                {/* Result Summary Bar */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/80 border border-slate-200/70 shadow-2xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Discovered Scenarios
                    </span>
                    <div className="text-sm font-bold text-slate-800">
                      {searchMutation.data.scenarios.length} Feasible Configurations
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Target Budget</span>
                    <div className="text-sm font-mono font-bold text-violet-700">
                      {formatCurrency(searchMutation.data.target_amount)}
                    </div>
                  </div>
                </div>

                {/* Scenario Cards */}
                <div className="space-y-4">
                  {searchMutation.data.scenarios.map((sc, idx) => {
                    const isExpanded = expandedScenarioId === sc.id;
                    const isSaved = savedScenarioId === sc.id;
                    const diffPct = sc.percentage_difference;
                    const isUnder = sc.difference_from_target < 0;

                    return (
                      <GlassCard
                        key={sc.id}
                        className={`p-5 rounded-2xl bg-white/90 border transition-all ${
                          idx === 0
                            ? "border-violet-300 shadow-md ring-1 ring-violet-200/50"
                            : "border-slate-200/70 shadow-xs hover:border-slate-300"
                        }`}
                      >
                        {/* Scenario Headline */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            {idx === 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800 uppercase tracking-wider">
                                Best Match
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">
                                Option #{idx + 1}
                              </span>
                            )}
                            <h3 className="text-sm font-bold text-slate-800">{sc.name}</h3>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-slate-900 font-mono">
                              {formatCurrency(sc.predicted_price)}
                            </span>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full font-mono ${
                                Math.abs(diffPct) <= 2
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isUnder
                                  ? "bg-sky-100 text-sky-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {sc.difference_from_target >= 0 ? "+" : ""}
                              {formatCurrency(sc.difference_from_target)} ({diffPct.toFixed(1)}%)
                            </span>
                          </div>
                        </div>

                        {/* Conformal Prediction Interval */}
                        {sc.prediction_interval && (
                          <div className="mt-3 p-2.5 rounded-xl bg-violet-50/50 border border-violet-100 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
                              <span className="font-medium">90% Conformal Interval:</span>
                            </div>
                            <span className="font-mono font-bold text-violet-900">
                              {formatCurrency(sc.prediction_interval.lower)} – {formatCurrency(sc.prediction_interval.upper)}
                            </span>
                          </div>
                        )}

                        {/* Changed Features Pills */}
                        <div className="mt-3 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Key Modified Features ({sc.changed_count}):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {sc.changed_features.map((cf, i) => (
                              <div
                                key={i}
                                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px] text-slate-700 flex items-center gap-1 font-medium"
                              >
                                <span className="text-slate-500">{cf.feature_label}:</span>
                                <span className="line-through text-slate-400">{cf.original_value}</span>
                                <span className="font-bold text-violet-700">→ {cf.new_value}</span>
                                {cf.unit && <span className="text-slate-500">{cf.unit}</span>}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Expandable Full Specification */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 text-xs animate-in fade-in duration-150">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                              <div className="p-2 rounded-lg bg-slate-50/80">
                                <span className="text-slate-400 block">Living Area</span>
                                <span className="font-bold text-slate-800">{sc.features.GrLivArea} sq ft</span>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-50/80">
                                <span className="text-slate-400 block">Quality</span>
                                <span className="font-bold text-slate-800">{sc.features.OverallQual} / 10</span>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-50/80">
                                <span className="text-slate-400 block">Bed / Bath</span>
                                <span className="font-bold text-slate-800">
                                  {sc.features.BedroomAbvGr} bd / {sc.features.FullBath} ba
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-50/80">
                                <span className="text-slate-400 block">Garage</span>
                                <span className="font-bold text-slate-800">{sc.features.GarageCars} cars</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                              <span>Model: {sc.model_name} ({sc.model_version})</span>
                              <span>Score: {sc.objective_score.toFixed(3)}</span>
                            </div>
                          </div>
                        )}

                        {/* Card Actions */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedScenarioId(isExpanded ? null : sc.id)}
                            className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? "Hide Full Specs" : "View Full Specs"}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveScenario(sc)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              {isSaved ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700 font-bold">Saved!</span>
                                </>
                              ) : (
                                <>
                                  <Bookmark className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Save Scenario</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenInWhatIf(sc)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200/60 shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <span>Open in What-If</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
