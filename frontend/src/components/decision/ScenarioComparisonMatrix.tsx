"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark,
  Trash2,
  Copy,
  Plus,
  RefreshCw,
  Scale,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Sliders,
  Sparkles,
  Layers,
  RotateCcw,
  Clock,
  Tag,
} from "lucide-react";
import { SavedScenario, PropertyFeatures, PredictionInterval } from "@/types";
import { api } from "@/services/api";
import { GlassCard, GlassBadge, GlassButton, AnimatedNumber } from "@/components/ui";

interface LiveScenario {
  id: string; // "current" | "improved" | "alternative" | string
  name: string;
  category: "Current Property" | "Improved Property" | "Alternative Property" | "Custom Scenario";
  features: PropertyFeatures;
  predicted_price: number;
  interval?: PredictionInterval | null;
  diff_from_baseline: number;
  model_name: string;
  model_version: string;
  timestamp: string;
  isLoading?: boolean;
}

interface ScenarioComparisonMatrixProps {
  currentFeatures: PropertyFeatures;
  currentEstimate?: number;
  currentLowerBound?: number;
  currentUpperBound?: number;
  modelName?: string;
  modelVersion?: string;
  className?: string;
  onRestoreScenario?: (features: PropertyFeatures) => void;
}

export const ScenarioComparisonMatrix: React.FC<ScenarioComparisonMatrixProps> = ({
  currentFeatures,
  currentEstimate = 240000,
  currentLowerBound = 220000,
  currentUpperBound = 260000,
  modelName = "CatBoost",
  modelVersion = "v1.0.0",
  className = "",
  onRestoreScenario,
}) => {
  // Saved scenarios from backend database
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Active Scenarios: Current Property, Improved Property, Alternative Property
  const [scenarios, setScenarios] = useState<LiveScenario[]>([]);
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState<string>("");

  // Initialize and run real inference for Improved & Alternative properties
  useEffect(() => {
    let isCancelled = false;

    const initScenarios = async () => {
      // 1. Current Property
      const currentScen: LiveScenario = {
        id: "current",
        name: "Current Property",
        category: "Current Property",
        features: { ...currentFeatures },
        predicted_price: currentEstimate,
        interval: {
          lower: currentLowerBound,
          upper: currentUpperBound,
          lower_bound: currentLowerBound,
          upper_bound: currentUpperBound,
          coverage: 0.9,
          confidence_level: 0.9,
          uncertainty_level: "Moderate",
        },
        diff_from_baseline: 0,
        model_name: modelName,
        model_version: modelVersion,
        timestamp: new Date().toISOString(),
        isLoading: false,
      };

      // 2. Improved Property (Expanded Living Area & Quality)
      const improvedFeats: PropertyFeatures = {
        ...currentFeatures,
        GrLivArea: Math.min(4500, Math.round(currentFeatures.GrLivArea * 1.15)),
        OverallQual: Math.min(10, currentFeatures.OverallQual + 1),
      };

      // 3. Alternative Property (Reconfigured Layout / Bedroom count)
      const altFeats: PropertyFeatures = {
        ...currentFeatures,
        BedroomAbvGr: Math.min(6, currentFeatures.BedroomAbvGr + 1),
        TotRmsAbvGrd: Math.min(12, currentFeatures.TotRmsAbvGrd + 1),
        FullBath: Math.min(4, currentFeatures.FullBath + 1),
      };

      // Set placeholder states with real loading flags
      setScenarios([
        currentScen,
        {
          id: "improved",
          name: "Improved Property",
          category: "Improved Property",
          features: improvedFeats,
          predicted_price: currentEstimate,
          diff_from_baseline: 0,
          model_name: modelName,
          model_version: modelVersion,
          timestamp: new Date().toISOString(),
          isLoading: true,
        },
        {
          id: "alternative",
          name: "Alternative Property",
          category: "Alternative Property",
          features: altFeats,
          predicted_price: currentEstimate,
          diff_from_baseline: 0,
          model_name: modelName,
          model_version: modelVersion,
          timestamp: new Date().toISOString(),
          isLoading: true,
        },
      ]);

      // Execute actual model inference for both non-baseline scenarios
      try {
        const [improvedRes, altRes] = await Promise.all([
          api.predict(improvedFeats),
          api.predict(altFeats),
        ]);

        if (isCancelled) return;

        const impModelName = typeof improvedRes.model === "string" ? improvedRes.model : improvedRes.model?.name || modelName;
        const impModelVer = typeof improvedRes.model === "object" ? improvedRes.model.version : modelVersion;
        const altModelName = typeof altRes.model === "string" ? altRes.model : altRes.model?.name || modelName;
        const altModelVer = typeof altRes.model === "object" ? altRes.model.version : modelVersion;

        setScenarios([
          currentScen,
          {
            id: "improved",
            name: "Improved Property",
            category: "Improved Property",
            features: improvedFeats,
            predicted_price: improvedRes.predicted_price,
            interval: improvedRes.prediction_interval,
            diff_from_baseline: improvedRes.predicted_price - currentEstimate,
            model_name: impModelName,
            model_version: impModelVer,
            timestamp: new Date().toISOString(),
            isLoading: false,
          },
          {
            id: "alternative",
            name: "Alternative Property",
            category: "Alternative Property",
            features: altFeats,
            predicted_price: altRes.predicted_price,
            interval: altRes.prediction_interval,
            diff_from_baseline: altRes.predicted_price - currentEstimate,
            model_name: altModelName,
            model_version: altModelVer,
            timestamp: new Date().toISOString(),
            isLoading: false,
          },
        ]);
      } catch (err) {
        console.error("Failed to run scenario inference:", err);
      }
    };

    initScenarios();

    return () => {
      isCancelled = true;
    };
  }, [currentFeatures, currentEstimate, currentLowerBound, currentUpperBound, modelName, modelVersion]);

  // Fetch initial saved scenarios from database
  useEffect(() => {
    api
      .getSavedScenarios()
      .then((data) => setSavedScenarios(data))
      .catch((err) => console.error("Could not fetch saved scenarios:", err));
  }, []);

  // Run model inference when a scenario's features change
  const runInferenceForScenario = async (scenId: string, updatedFeatures: PropertyFeatures) => {
    try {
      setScenarios((prev) =>
        prev.map((s) => (s.id === scenId ? { ...s, isLoading: true, features: updatedFeatures } : s))
      );

      const res = await api.predict(updatedFeatures);
      const newPrice = res.predicted_price;
      const diff = newPrice - currentEstimate;
      const mName = typeof res.model === "string" ? res.model : res.model?.name || modelName;
      const mVer = typeof res.model === "object" ? res.model.version : modelVersion;

      setScenarios((prev) =>
        prev.map((s) =>
          s.id === scenId
            ? {
                ...s,
                features: updatedFeatures,
                predicted_price: newPrice,
                interval: res.prediction_interval,
                diff_from_baseline: diff,
                model_name: mName,
                model_version: mVer,
                timestamp: new Date().toISOString(),
                isLoading: false,
              }
            : s
        )
      );
    } catch (err) {
      console.error("Scenario prediction failed", err);
      setScenarios((prev) =>
        prev.map((s) => (s.id === scenId ? { ...s, isLoading: false } : s))
      );
    }
  };

  const handleDuplicate = (source: LiveScenario) => {
    if (scenarios.length >= 5) {
      setNotification("Maximum of 5 comparison scenarios supported simultaneously.");
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    const newId = `custom-${Date.now()}`;
    const newScen: LiveScenario = {
      id: newId,
      name: `Branch of ${source.name}`,
      category: "Custom Scenario",
      features: { ...source.features },
      predicted_price: source.predicted_price,
      interval: source.interval,
      diff_from_baseline: source.diff_from_baseline,
      model_name: source.model_name,
      model_version: source.model_version,
      timestamp: new Date().toISOString(),
    };
    setScenarios((prev) => [...prev, newScen]);
    setNotification(`Created branch "${newScen.name}"`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleResetToCurrent = (scenId: string) => {
    runInferenceForScenario(scenId, { ...currentFeatures });
  };

  const handleDeleteScenario = (scenId: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== scenId));
  };

  const handleSaveToDatabase = async (scen: LiveScenario) => {
    try {
      const lower = scen.interval?.lower ?? scen.interval?.lower_bound ?? scen.predicted_price * 0.9;
      const upper = scen.interval?.upper ?? scen.interval?.upper_bound ?? scen.predicted_price * 1.1;

      const saved = await api.saveScenario({
        name: scen.name,
        features: scen.features,
        predicted_price: scen.predicted_price,
        lower_bound: lower,
        upper_bound: upper,
        model_name: scen.model_name,
        model_version: scen.model_version,
      });
      setSavedScenarios((prev) => [saved, ...prev]);
      setNotification(`Scenario "${scen.name}" saved to database (${scen.model_version})!`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error("Failed to save scenario", err);
      setNotification("Failed to save scenario.");
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleDeleteSavedScenario = async (savedId: number) => {
    try {
      await api.deleteScenario(savedId);
      setSavedScenarios((prev) => prev.filter((s) => s.id !== savedId));
      setNotification(`Scenario #${savedId} removed from database.`);
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error("Failed to delete scenario", err);
    }
  };

  const handleRestoreSaved = (saved: SavedScenario) => {
    if (onRestoreScenario) {
      onRestoreScenario(saved.features as PropertyFeatures);
      setNotification(`Restored inputs from scenario "${saved.name}"`);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const startRenaming = (scen: LiveScenario) => {
    setRenameId(scen.id);
    setRenameText(scen.name);
  };

  const saveRename = () => {
    if (renameId && renameText.trim()) {
      setScenarios((prev) =>
        prev.map((s) => (s.id === renameId ? { ...s, name: renameText.trim() } : s))
      );
    }
    setRenameId(null);
  };

  // Find max estimate for scaling visualization bars
  const allEstimates = scenarios.map((s) => s.predicted_price).concat([currentEstimate]);
  const maxEstimate = Math.max(...allEstimates, 1);

  return (
    <GlassCard variant="elevated" className={`p-6 sm:p-7 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200/60 mb-1.5">
            <Scale className="w-3 h-3 text-violet-600" />
            <span>Scenario Intelligence Workspace</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            SCENARIO WORKSPACE & COMPARISON
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Compare Current, Improved, and Alternative property profiles evaluated using the actual ML inference pipeline.
          </p>
        </div>

        {scenarios.length < 5 && (
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={() => {
              const baseScen = scenarios[0] || {
                id: "current",
                name: "Current Property",
                category: "Current Property" as const,
                features: currentFeatures,
                predicted_price: currentEstimate,
                diff_from_baseline: 0,
                model_name: modelName,
                model_version: modelVersion,
                timestamp: new Date().toISOString(),
              };
              handleDuplicate(baseScen);
            }}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Scenario</span>
          </GlassButton>
        )}
      </div>

      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </motion.div>
      )}

      {/* Comparison Visualizer Bars */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-3">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
          <span>Comparative Model Estimates</span>
          <span className="text-[11px] font-normal text-slate-400">
            Real Inference · Model Version {modelVersion}
          </span>
        </div>

        <div className="space-y-2.5">
          {scenarios.map((scen, idx) => {
            const widthPct = (scen.predicted_price / maxEstimate) * 100;
            const isPos = scen.diff_from_baseline >= 0;
            const isBase = scen.id === "current";
            const barColors = isBase
              ? "bg-slate-400"
              : scen.id === "improved"
              ? "bg-emerald-600"
              : scen.id === "alternative"
              ? "bg-violet-600"
              : "bg-cyan-600";

            return (
              <div key={scen.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-800">{scen.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                      {scen.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-900 font-black">
                      ${Math.round(scen.predicted_price).toLocaleString("en-US")}
                    </span>
                    {!isBase && (
                      <span
                        className={`text-[11px] font-bold font-mono ${
                          isPos ? "text-emerald-700" : "text-rose-600"
                        }`}
                      >
                        ({isPos ? "+" : ""}${Math.round(scen.diff_from_baseline).toLocaleString("en-US")})
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-slate-200/70 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`h-full ${barColors} rounded-full`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((scen) => {
          const isBase = scen.id === "current";
          const isPos = scen.diff_from_baseline >= 0;
          const isEditing = activeEditingId === scen.id;
          const lowerB = scen.interval?.lower ?? scen.interval?.lower_bound;
          const upperB = scen.interval?.upper ?? scen.interval?.upper_bound;

          return (
            <div
              key={scen.id}
              className={`p-4 sm:p-5 rounded-2xl bg-white/90 border transition-all shadow-2xs space-y-3 ${
                isBase
                  ? "border-slate-200/90"
                  : scen.id === "improved"
                  ? "border-emerald-200 hover:border-emerald-300"
                  : "border-slate-200/80 hover:border-violet-300"
              }`}
            >
              {/* Card Header & Actions */}
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-violet-600">
                      {scen.category}
                    </span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-500">
                      {scen.model_version}
                    </span>
                  </div>

                  {renameId === scen.id ? (
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="text"
                        value={renameText}
                        onChange={(e) => setRenameText(e.target.value)}
                        className="text-xs px-2 py-0.5 rounded border border-violet-300 w-full font-bold"
                        autoFocus
                      />
                      <button
                        onClick={saveRename}
                        className="text-xs text-violet-700 font-bold px-1.5 py-0.5 bg-violet-100 rounded cursor-pointer"
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{scen.name}</h4>
                      {!isBase && (
                        <button
                          onClick={() => startRenaming(scen)}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Rename scenario"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {!isBase && (
                  <button
                    onClick={() => handleDeleteScenario(scen.id)}
                    className="text-slate-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                    title="Delete scenario"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Estimate & Diff */}
              <div className="space-y-1 pt-1 border-t border-slate-100">
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      Model Estimate
                    </div>
                    <div className="text-xl font-black text-slate-900 font-mono">
                      {scen.isLoading ? (
                        <span className="text-xs font-normal text-violet-600 animate-pulse">
                          Computing with trained model...
                        </span>
                      ) : (
                        `$${Math.round(scen.predicted_price).toLocaleString("en-US")}`
                      )}
                    </div>
                  </div>
                  {!isBase && (
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Modeled Diff</div>
                      <div
                        className={`text-sm font-black font-mono ${
                          isPos ? "text-emerald-700" : "text-rose-600"
                        }`}
                      >
                        {isPos ? "+" : ""}${Math.round(scen.diff_from_baseline).toLocaleString("en-US")}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 font-mono">
                  {lowerB !== undefined && upperB !== undefined ? (
                    `Interval: $${Math.round(lowerB / 1000)}k – $${Math.round(upperB / 1000)}k (90%)`
                  ) : (
                    "Interval: Unavailable"
                  )}
                </div>
              </div>

              {/* Physical Parameters View or Sliders */}
              <div className="space-y-2">
                {!isEditing ? (
                  <div className="grid grid-cols-2 gap-1 py-1.5 px-2 rounded-xl bg-slate-50 text-[11px] text-slate-600 font-medium">
                    <div>{scen.features.GrLivArea} sq ft area</div>
                    <div>
                      {scen.features.BedroomAbvGr} bd / {scen.features.FullBath} ba
                    </div>
                    <div>Quality: {scen.features.OverallQual}/10</div>
                    <div>Condition: {scen.features.OverallCond}/10</div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-violet-50/60 border border-violet-100 text-xs space-y-2.5">
                    {/* Living Area Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Living Area:</span>
                        <span className="font-bold">{scen.features.GrLivArea} sq ft</span>
                      </div>
                      <input
                        type="range"
                        min={800}
                        max={4000}
                        step={50}
                        value={scen.features.GrLivArea}
                        onChange={(e) =>
                          runInferenceForScenario(scen.id, {
                            ...scen.features,
                            GrLivArea: Number(e.target.value),
                          })
                        }
                        className="w-full accent-violet-600 cursor-pointer"
                      />
                    </div>

                    {/* Overall Quality Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Overall Quality:</span>
                        <span className="font-bold">{scen.features.OverallQual}/10</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={scen.features.OverallQual}
                        onChange={(e) =>
                          runInferenceForScenario(scen.id, {
                            ...scen.features,
                            OverallQual: Number(e.target.value),
                          })
                        }
                        className="w-full accent-violet-600 cursor-pointer"
                      />
                    </div>

                    {/* Bedrooms Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Bedrooms:</span>
                        <span className="font-bold">{scen.features.BedroomAbvGr} bd</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={6}
                        step={1}
                        value={scen.features.BedroomAbvGr}
                        onChange={(e) =>
                          runInferenceForScenario(scen.id, {
                            ...scen.features,
                            BedroomAbvGr: Number(e.target.value),
                          })
                        }
                        className="w-full accent-violet-600 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {!isBase && (
                  <button
                    onClick={() => setActiveEditingId(isEditing ? null : scen.id)}
                    className="w-full py-1 text-[11px] font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>{isEditing ? "Close Sliders" : "Edit Parameters"}</span>
                  </button>
                )}
              </div>

              {/* Action Buttons: Duplicate, Restore, Save */}
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 text-[11px] font-semibold">
                <button
                  onClick={() => handleDuplicate(scen)}
                  className="py-1 px-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-center transition-colors cursor-pointer"
                  title="Duplicate this scenario"
                >
                  Duplicate
                </button>
                {onRestoreScenario && (
                  <button
                    onClick={() => onRestoreScenario(scen.features)}
                    className="py-1 px-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-center transition-colors cursor-pointer"
                    title="Restore inputs to primary form"
                  >
                    Restore
                  </button>
                )}
                <button
                  onClick={() => handleSaveToDatabase(scen)}
                  className="py-1 px-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-center transition-colors cursor-pointer"
                  title="Persist scenario to database"
                >
                  Save
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Saved Scenarios Vault Section */}
      {savedScenarios.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-violet-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Saved Scenarios Vault ({savedScenarios.length})
              </h4>
            </div>
            <span className="text-[10px] text-slate-400">Persisted in database</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedScenarios.map((saved) => (
              <div
                key={saved.id}
                className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 text-xs space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-bold text-slate-900 truncate">{saved.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-violet-100/70 text-violet-700 shrink-0">
                      {saved.model_version || "v1.0.0"}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>
                      {saved.created_at ? new Date(saved.created_at).toLocaleDateString("en-US") : "Recorded"}
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-sm font-bold text-slate-900">
                    ${Math.round(saved.predicted_price).toLocaleString("en-US")}
                  </div>
                  {saved.lower_bound && saved.upper_bound && (
                    <div className="text-[10px] font-mono text-slate-500">
                      ${Math.round(saved.lower_bound / 1000)}k – ${Math.round(saved.upper_bound / 1000)}k
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                  {onRestoreScenario && (
                    <button
                      onClick={() => handleRestoreSaved(saved)}
                      className="text-[11px] font-semibold text-violet-700 hover:text-violet-900 cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteSavedScenario(saved.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    title="Delete saved scenario"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-causal Disclaimer Notice */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span>
          <strong>Statistical Inference Notice:</strong> Model-estimated scenario differences describe statistical predictions
          based on historical Ames Housing data relationships. They do not constitute guaranteed market price appreciation,
          contractor estimates, or certified appraisals.
        </span>
      </div>
    </GlassCard>
  );
};
