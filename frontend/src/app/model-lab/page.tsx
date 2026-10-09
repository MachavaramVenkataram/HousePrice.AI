"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { ScatterPlot } from "@/components/charts/ScatterPlot";
import { ResidualChart } from "@/components/charts/ResidualChart";
import { GlobalShapBar } from "@/components/charts/GlobalShapBar";
import ReactECharts from "echarts-for-react";
import {
  PageTransition,
  GlassCard,
  GlassTabs,
  AnimatedNumber,
} from "@/components/ui";
import { ModelReleaseManagerSection } from "@/components/release/ModelReleaseManagerSection";
import {
  FlaskConical,
  BarChart3,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  TrendingUp,
  Cpu,
  Info,
  ShieldAlert,
  Award,
  GitBranch,
  Database,
  Sliders,
} from "lucide-react";

export default function ModelLabPage() {
  const [activeTab, setActiveTab] = useState<string>("benchmark");
  const [errorSearch, setErrorSearch] = useState<string>("");
  const [benchmarkMetric, setBenchmarkMetric] = useState<"rmse" | "mae" | "r2">("rmse");

  const { data: benchmark } = useQuery({
    queryKey: ["benchmark"],
    queryFn: () => api.getBenchmark(),
  });

  const { data: scatter } = useQuery({
    queryKey: ["scatter"],
    queryFn: () => api.getScatter(),
  });

  const { data: residuals } = useQuery({
    queryKey: ["residuals"],
    queryFn: () => api.getResiduals(),
  });

  const { data: errors } = useQuery({
    queryKey: ["errors"],
    queryFn: () => api.getErrors(),
  });

  const { data: globalShap } = useQuery({
    queryKey: ["global-shap"],
    queryFn: () => api.getGlobalShap(),
  });

  const { data: optuna } = useQuery({
    queryKey: ["optuna"],
    queryFn: () => api.getOptuna(),
  });

  const filteredErrors = errors?.filter((e) => {
    if (!errorSearch) return true;
    const term = errorSearch.toLowerCase();
    return (
      e.id.toString().includes(term) ||
      JSON.stringify(e.key_features).toLowerCase().includes(term)
    );
  });

  // Separate baseline models from advanced models
  const baselineModels = benchmark?.filter((m) => m.category === "Baseline" || m.model.includes("Linear") || m.model.includes("Ridge") || m.model.includes("Lasso") || m.model.includes("Elastic")) || [];
  const advancedModels = benchmark?.filter((m) => m.category === "Advanced" && !baselineModels.some((b) => b.model === m.model)) || [];

  // Data for the Model Comparison Visual Chart (Section 32)
  const comparisonModels = [...(benchmark || [])].sort((a, b) => a.cv_rmse_mean - b.cv_rmse_mean);
  const chartOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: any) => {
        const item = params[0];
        const val = item.value;
        let formatted = `$${Number(val).toLocaleString()}`;
        if (benchmarkMetric === "r2") {
          formatted = `${(Number(val) * 100).toFixed(2)}%`;
        }
        return `
          <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
            <div style="font-weight: 700; color: #1e1b4b;">${item.name}</div>
            <div style="color: #6366f1; margin-top: 2px;">
              ${benchmarkMetric.toUpperCase()}: <strong>${formatted}</strong>
            </div>
          </div>
        `;
      },
    },
    grid: {
      left: "4%",
      right: "4%",
      bottom: "12%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: comparisonModels.map((m) => m.model),
      axisLabel: {
        rotate: 25,
        fontSize: 10,
        color: "#64748b",
      },
      axisLine: { lineStyle: { color: "#e2e8f0" } },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (v: number) => {
          if (benchmarkMetric === "r2") return `${(v * 100).toFixed(0)}%`;
          return `$${(v / 1000).toFixed(0)}k`;
        },
        color: "#64748b",
        fontSize: 10,
      },
      splitLine: { lineStyle: { color: "rgba(226, 232, 240, 0.6)" } },
    },
    series: [
      {
        name: benchmarkMetric.toUpperCase(),
        type: "bar",
        data: comparisonModels.map((m) => {
          let val = m.cv_rmse_mean;
          if (benchmarkMetric === "mae") val = m.cv_mae_mean;
          if (benchmarkMetric === "r2") val = m.cv_r2_mean;
          const isSelected = m.model === "Voting Ensemble";
          return {
            value: val,
            itemStyle: {
              color: isSelected
                ? "#7c3aed"
                : m.category === "Baseline"
                ? "#94a3b8"
                : "#a78bfa",
              borderRadius: [6, 6, 0, 0],
            },
          };
        }),
      },
    ],
  };

  // Optuna curve option
  const optunaCurveOption = optuna ? {
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const item = params[0];
        return `
          <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
            <div style="font-weight: 700; color: #7c3aed;">Trial #${item.name}</div>
            <div>Objective RMSE: <strong>$${Math.round(Number(item.value)).toLocaleString()}</strong></div>
          </div>
        `;
      },
    },
    grid: { left: "6%", right: "4%", bottom: "10%", top: "12%", containLabel: true },
    xAxis: {
      type: "category",
      data: optuna.trial_history.map((t) => `#${t.trial}`),
      name: "Trial",
      axisLabel: { color: "#64748b", fontSize: 10 },
    },
    yAxis: {
      type: "value",
      name: "CV RMSE ($)",
      axisLabel: {
        formatter: (v: number) => `$${(v / 1000).toFixed(0)}k`,
        color: "#64748b",
        fontSize: 10,
      },
      splitLine: { lineStyle: { color: "#f1f5f9" } },
    },
    series: [
      {
        type: "line",
        smooth: true,
        data: optuna.trial_history.map((t) => t.rmse),
        lineStyle: { color: "#7c3aed", width: 3 },
        itemStyle: { color: "#7c3aed" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(124, 58, 237, 0.25)" },
              { offset: 1, color: "rgba(124, 58, 237, 0.0)" },
            ],
          },
        },
      },
    ],
  } : null;

  return (
    <PageTransition className="space-y-10 max-w-7xl mx-auto">
      {/* Header (Requirement 38: Model Intelligence Center) */}
      <div className="border-b border-slate-200/60 pb-7">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-violet-100/70 text-violet-800 border border-violet-200/60 shadow-2xs mb-2">
          <FlaskConical className="w-3.5 h-3.5 text-violet-600" />
          <span>Model Intelligence Center</span>
        </div>
        <h1 className="text-2xl sm:text-3.5xl font-extrabold text-slate-900 tracking-tight">
          Model Intelligence & Benchmarking
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl font-medium">
          Explore empirical 5-fold cross-validation metrics across trained regression models, inspect residual diagnostics, evaluate boundary error cases, and review Bayesian hyperparameter optimization.
        </p>
      </div>

      {/* Top Cards: Production Candidate, Academic Baseline, Selection Criterion */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Selected Production Model */}
        <div className="glass-panel-elevated p-5 sm:p-6 border-violet-200/80 space-y-3 rounded-2xl bg-white/90">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50/90 border border-violet-200/60 px-2.5 py-0.5 rounded-full shadow-2xs">
              Production Candidate
            </span>
            <span className="text-[10px] text-slate-400 font-mono">v1.0.0</span>
          </div>
          <div className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-violet-600" />
            <span>Voting Ensemble</span>
          </div>
          <div className="text-xs text-slate-600 font-mono">
            5-Fold CV RMSE: <strong className="text-violet-700 font-bold">$27,210.21</strong> ±$4,642.64
          </div>
          <div className="text-[11px] text-slate-500">
            Ensemble: XGBoost + LightGBM + CatBoost + GBR
          </div>
        </div>

        {/* Academic Baseline Model */}
        <div className="glass-panel p-5 sm:p-6 space-y-3 rounded-2xl bg-white/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100/90 border border-slate-200/60 px-2.5 py-0.5 rounded-full shadow-2xs">
              Academic Baseline
            </span>
            <span className="text-[10px] text-slate-400 font-mono">v1.0.0</span>
          </div>
          <div className="text-lg font-black text-slate-800 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-slate-500" />
            <span>Linear Regression</span>
          </div>
          <div className="text-xs text-slate-600 font-mono">
            5-Fold CV RMSE: <strong className="text-slate-800 font-bold">$53,885.44</strong> ±$52,080.07
          </div>
          <div className="text-[11px] text-slate-500">
            Advanced models are evaluated against the Linear Regression baseline.
          </div>
        </div>

        {/* Documented Selection Rule */}
        <div className="glass-panel p-5 sm:p-6 space-y-3 rounded-2xl bg-white/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Selection Criterion
          </span>
          <div className="text-xs font-bold text-slate-800">
            Primary: Lowest Validation RMSE
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            <strong>Rule:</strong> Voting Ensemble was selected as the production candidate because it achieved the lowest 5-fold cross-validation RMSE ($27,210.21) among evaluated models. Secondary validation criteria: MAE ($15,668.38) and R² (87.37% CV, 90.07% Test).
          </p>
        </div>
      </div>

      {/* Navigation Tabs with Animated Spring Indicator (Req 38 & 39) */}
      <GlassTabs
        tabs={[
          { id: "benchmark", label: "Model Benchmark" },
          { id: "releases", label: "Model Release Manager" },
          { id: "scatter", label: "Predicted vs. Actual" },
          { id: "residuals", label: "Residual Diagnostics" },
          { id: "errors", label: "Error Explorer" },
          { id: "shap", label: "Global Attribution" },
          { id: "optuna", label: "Optuna HPO" },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId)}
      />

      {/* Tab: Model Release Manager */}
      {activeTab === "releases" && <ModelReleaseManagerSection />}

      {/* Tab 1: Benchmark Table & Visual (Sections 31 & 32) */}
      {activeTab === "benchmark" && (
        <div className="space-y-6">
          {/* Section 32: Model Comparison Visual Summary */}
          <div className="glass-panel-elevated p-6 sm:p-7 space-y-5 rounded-3xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-violet-600" />
                  Model Comparison Visual Summary
                </h2>
                <p className="text-xs text-slate-500">
                  Compare cross-validation performance across all 9 candidate and baseline models.
                </p>
              </div>

              {/* Metric Selector (RMSE, MAE, R²) */}
              <div className="flex items-center gap-1.5 p-1 glass-panel rounded-xl">
                <button
                  onClick={() => setBenchmarkMetric("rmse")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    benchmarkMetric === "rmse"
                      ? "bg-violet-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  RMSE (Lower is Better)
                </button>
                <button
                  onClick={() => setBenchmarkMetric("mae")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    benchmarkMetric === "mae"
                      ? "bg-violet-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  MAE
                </button>
                <button
                  onClick={() => setBenchmarkMetric("r2")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    benchmarkMetric === "r2"
                      ? "bg-violet-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  R² (Higher is Better)
                </button>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ReactECharts option={chartOption} style={{ height: "100%", width: "100%" }} />
            </div>
          </div>

          {/* Section 31: Benchmark Table with Light Glass Surface & Semantic Colors */}
          <div className="glass-panel-elevated p-6 sm:p-7 space-y-6 rounded-3xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  5-Fold Cross-Validation & Test Benchmark Table
                </h2>
                <p className="text-xs text-slate-500">
                  Evaluated across 1,460 residential properties from the Ames Housing Dataset using identical preprocessors. Advanced models are evaluated against the Linear Regression academic baseline.
                </p>
              </div>
              <div className="text-[11px] font-mono text-violet-700 bg-violet-50/80 px-3 py-1 rounded-full border border-violet-200/60 shadow-2xs">
                Selection Rule: Lowest 5-Fold CV RMSE
              </div>
            </div>

            {/* ADVANCED MODELS TABLE */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-700">
                  Advanced Models
                </span>
                <span className="text-[11px] text-slate-400">
                  Evaluated against academic baseline
                </span>
              </div>
              <div className="overflow-x-auto border border-slate-200/70 rounded-2xl glass-panel">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/60 border-b border-slate-200/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider sticky top-0">
                      <th className="py-3 px-3.5">Model</th>
                      <th className="py-3 px-3.5">5-Fold CV RMSE (mean ± std)</th>
                      <th className="py-3 px-3.5">5-Fold CV MAE (mean ± std)</th>
                      <th className="py-3 px-3.5">5-Fold CV R²</th>
                      <th className="py-3 px-3.5">Test RMSE</th>
                      <th className="py-3 px-3.5">Test MAE</th>
                      <th className="py-3 px-3.5">Test R²</th>
                      <th className="py-3 px-3.5">Inference</th>
                      <th className="py-3 px-3.5">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {advancedModels.map((m) => (
                      <tr
                        key={m.model}
                        className={`hover:bg-violet-50/20 transition-colors ${
                          m.model === "Voting Ensemble" ? "bg-violet-50/30 font-medium" : ""
                        }`}
                      >
                        <td className="py-3 px-3.5 font-sans font-semibold text-slate-900 flex items-center gap-2">
                          {m.model === "Voting Ensemble" && (
                            <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
                          )}
                          {m.model}
                        </td>
                        <td className="py-3 px-3.5 text-slate-900 font-bold">
                          ${Math.round(m.cv_rmse_mean).toLocaleString()}{" "}
                          <span className="text-[10px] text-slate-400 font-normal">
                            ±${Math.round(m.cv_rmse_std).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-700">
                          ${Math.round(m.cv_mae_mean).toLocaleString()}{" "}
                          <span className="text-[10px] text-slate-400 font-normal">
                            ±${Math.round(m.cv_mae_std).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-700">
                          {(m.cv_r2_mean * 100).toFixed(2)}%
                        </td>
                        <td className="py-3 px-3.5 text-slate-900">${Math.round(m.test_rmse).toLocaleString()}</td>
                        <td className="py-3 px-3.5 text-slate-700">${Math.round(m.test_mae).toLocaleString()}</td>
                        <td className="py-3 px-3.5 text-emerald-600 font-bold">{(m.test_r2 * 100).toFixed(2)}%</td>
                        <td className="py-3 px-3.5 text-slate-500">{m.inference_time_ms.toFixed(1)}ms</td>
                        <td className="py-3 px-3.5 font-sans">
                          {m.model === "Voting Ensemble" ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700 border border-violet-200">
                              Production
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              Candidate
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BASELINE MODELS TABLE */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Academic Baseline Models
                </span>
                <span className="text-[11px] text-slate-400">
                  Standard linear reference benchmarks
                </span>
              </div>
              <div className="overflow-x-auto border border-slate-200/70 rounded-2xl glass-panel">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/60 border-b border-slate-200/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider sticky top-0">
                      <th className="py-3 px-3.5">Model</th>
                      <th className="py-3 px-3.5">5-Fold CV RMSE (mean ± std)</th>
                      <th className="py-3 px-3.5">5-Fold CV MAE (mean ± std)</th>
                      <th className="py-3 px-3.5">5-Fold CV R²</th>
                      <th className="py-3 px-3.5">Test RMSE</th>
                      <th className="py-3 px-3.5">Test MAE</th>
                      <th className="py-3 px-3.5">Test R²</th>
                      <th className="py-3 px-3.5">Inference</th>
                      <th className="py-3 px-3.5">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {baselineModels.map((m) => (
                      <tr key={m.model} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3.5 font-sans font-medium text-slate-800">
                          {m.model}
                        </td>
                        <td className="py-3 px-3.5 text-slate-800">
                          ${Math.round(m.cv_rmse_mean).toLocaleString()}{" "}
                          <span className="text-[10px] text-slate-400 font-normal">
                            ±${Math.round(m.cv_rmse_std).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-700">
                          ${Math.round(m.cv_mae_mean).toLocaleString()}{" "}
                          <span className="text-[10px] text-slate-400 font-normal">
                            ±${Math.round(m.cv_mae_std).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-700">
                          {(m.cv_r2_mean * 100).toFixed(2)}%
                        </td>
                        <td className="py-3 px-3.5 text-slate-900">${Math.round(m.test_rmse).toLocaleString()}</td>
                        <td className="py-3 px-3.5 text-slate-700">${Math.round(m.test_mae).toLocaleString()}</td>
                        <td className="py-3 px-3.5 text-emerald-600 font-bold">{(m.test_r2 * 100).toFixed(2)}%</td>
                        <td className="py-3 px-3.5 text-slate-500">{m.inference_time_ms.toFixed(1)}ms</td>
                        <td className="py-3 px-3.5 font-sans">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Baseline
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Regression-Only Metric Explanation */}
            <div className="p-4 rounded-2xl glass-panel text-xs text-slate-600 flex items-start gap-3">
              <Info className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-slate-800">Continuous Regression Evaluation Standards:</span>
                <p className="leading-relaxed text-[11px]">
                  Property valuation is a continuous regression problem. Classification metrics like <em>Accuracy</em> or <em>Confusion Matrices</em> do not apply. Performance is measured via Root Mean Squared Error (RMSE), Mean Absolute Error (MAE), and Coefficient of Determination (R²).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Predicted vs Actual Scatter */}
      {activeTab === "scatter" && (
        <div className="glass-panel-elevated p-6 sm:p-7 space-y-5 rounded-3xl">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Predicted vs. Actual Sale Price (Test Set)
            </h2>
            <p className="text-xs text-slate-500">
              Dashed diagonal indicates 1:1 prediction agreement. Points closer to the diagonal indicate tighter alignment between model estimates and historical transaction prices.
            </p>
          </div>
          {scatter && (
            <div className="p-4 rounded-2xl glass-panel">
              <ScatterPlot data={scatter} height={460} />
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Residual Diagnostics */}
      {activeTab === "residuals" && (
        <div className="space-y-6">
          {residuals && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="glass-panel p-4.5 space-y-1 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Mean Residual
                </span>
                <div className="text-xl font-black font-mono text-slate-900">
                  ${Math.round(residuals.mean_residual).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400">Near-zero indicates minimal systematic bias</div>
              </div>

              <div className="glass-panel p-4.5 space-y-1 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Median Absolute Error
                </span>
                <div className="text-xl font-black font-mono text-slate-900">
                  ${Math.round(residuals.median_absolute_error).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400">Robust metric insensitive to extreme outliers</div>
              </div>

              <div className="glass-panel p-4.5 space-y-1 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Within 10% Error Bound
                </span>
                <div className="text-xl font-black font-mono text-emerald-600">
                  {residuals.pct_within_10_percent}%
                </div>
                <div className="text-[11px] text-slate-400">Test properties within ±10% relative residual</div>
              </div>

              <div className="glass-panel p-4.5 space-y-1 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Within 20% Error Bound
                </span>
                <div className="text-xl font-black font-mono text-emerald-600">
                  {residuals.pct_within_20_percent}%
                </div>
                <div className="text-[11px] text-slate-400">Commercial estimation standard tolerance</div>
              </div>
            </div>
          )}

          <div className="glass-panel-elevated p-6 sm:p-7 rounded-3xl">
            {scatter && <ResidualChart scatterData={scatter} height={380} />}
          </div>
        </div>
      )}

      {/* Tab 4: Prediction Errors Explorer */}
      {activeTab === "errors" && (
        <div className="glass-panel-elevated p-6 sm:p-7 space-y-5 rounded-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Prediction Error Explorer (Top Residual Divergences)
              </h2>
              <p className="text-xs text-slate-500">
                Investigate properties where model prediction diverged most significantly from actual transactional price to diagnose domain boundary cases.
              </p>
            </div>
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ID or attribute..."
                value={errorSearch}
                onChange={(e) => setErrorSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200/70 rounded-2xl glass-panel">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/60 border-b border-slate-200/70 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3.5">Test ID</th>
                  <th className="py-3 px-3.5">Actual Price</th>
                  <th className="py-3 px-3.5">Model Estimate</th>
                  <th className="py-3 px-3.5">Residual</th>
                  <th className="py-3 px-3.5">Relative Divergence</th>
                  <th className="py-3 px-3.5">Key Home Attributes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredErrors?.slice(0, 15).map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3.5 font-bold text-slate-800">#{e.id}</td>
                    <td className="py-3 px-3.5 font-bold text-slate-900">${e.actual_price.toLocaleString()}</td>
                    <td className="py-3 px-3.5 text-slate-700">${e.predicted_price.toLocaleString()}</td>
                    <td
                      className={`py-3 px-3.5 font-bold ${
                        e.residual > 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {e.residual > 0 ? "+" : ""}${Math.round(e.residual).toLocaleString()}
                    </td>
                    <td className="py-3 px-3.5 font-bold text-rose-600">
                      {e.relative_error_pct.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3.5 font-sans text-[11px] text-slate-600">
                      {e.key_features.GrLivArea} sqft • Qual {e.key_features.OverallQual}/10 • Built{" "}
                      {e.key_features.YearBuilt} • {e.key_features.Neighborhood}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Global Feature Attribution */}
      {activeTab === "shap" && (
        <div className="glass-panel-elevated p-6 sm:p-7 space-y-5 rounded-3xl">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Global Model Feature Attribution (SHAP TreeExplainer)
            </h2>
            <p className="text-xs text-slate-500">
              Ranking features by mean absolute SHAP value across the entire training corpus. Reflects the primary statistical drivers learned by tree-based models across the Ames dataset.
            </p>
          </div>
          {globalShap && (
            <div className="p-4 rounded-2xl glass-panel">
              <GlobalShapBar data={globalShap} height={420} />
            </div>
          )}

          <div className="p-4 rounded-2xl glass-panel text-[11px] text-slate-500">
            <strong>Causality Notice:</strong> Global SHAP importance reflects model attribution across the historical dataset, not macroeconomic cause-and-effect.
          </div>
        </div>
      )}

      {/* Tab 6: Optuna HPO Results (Section 33) */}
      {activeTab === "optuna" && (
        <div className="space-y-6">
          <div className="glass-panel-elevated p-6 sm:p-7 space-y-6 rounded-3xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50/80 px-2.5 py-1 rounded-full border border-violet-200/60 shadow-2xs">
                  Bayesian Optimization
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-2">
                  OPTUNA HYPERPARAMETER OPTIMIZATION
                </h2>
                <p className="text-xs text-slate-500">
                  Optimization Method: <strong>Optuna TPE</strong> • Objective: 5-Fold Cross-Validation RMSE • Model: LightGBM Regressor.
                </p>
              </div>
              <div className="text-xs font-bold text-violet-700 bg-violet-50/80 px-3.5 py-1.5 rounded-full border border-violet-200/60 shadow-2xs self-start">
                Best CV Score: ${optuna ? Math.round(optuna.best_cv_rmse).toLocaleString() : "28,174"} ({optuna?.trial_history?.length || 12} Trials)
              </div>
            </div>

            {optuna && (
              <div className="space-y-6">
                {/* Best Trial & Parameters Cards */}
                <div className="p-5 rounded-2xl glass-panel space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Best Trial Parameters Selected by Optuna:
                    </span>
                    <span className="text-[11px] text-slate-500">Trials completed: {optuna.trial_history.length}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                    {Object.entries(optuna.best_params).map(([k, v]) => (
                      <div key={k} className="p-3 bg-white/70 rounded-xl border border-slate-200/60 shadow-2xs">
                        <div className="text-[10px] text-slate-400 font-sans">{k}</div>
                        <div className="font-bold text-violet-900 mt-0.5">{String(v)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 33: Optimization Curve */}
                {optunaCurveOption && (
                  <div className="p-5 rounded-2xl glass-panel space-y-3">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Optimization Curve (Objective RMSE Across Trials)
                    </span>
                    <div className="h-64 w-full">
                      <ReactECharts option={optunaCurveOption} style={{ height: "100%", width: "100%" }} />
                    </div>
                  </div>
                )}

                {/* Trial History Table */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-700">Optimization Trial History:</span>
                  <div className="overflow-x-auto border border-slate-200/70 rounded-2xl glass-panel">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="bg-white/60 border-b border-slate-200/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider font-sans">
                          <th className="py-3 px-3.5">Trial #</th>
                          <th className="py-3 px-3.5">CV RMSE Objective</th>
                          <th className="py-3 px-3.5">n_estimators</th>
                          <th className="py-3 px-3.5">learning_rate</th>
                          <th className="py-3 px-3.5">max_depth</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {optuna.trial_history.map((t) => (
                          <tr key={t.trial} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-3.5 font-bold text-slate-700">#{t.trial}</td>
                            <td className="py-3 px-3.5 font-bold text-violet-700">
                              ${Math.round(t.rmse).toLocaleString()}
                            </td>
                            <td className="py-3 px-3.5 text-slate-600">{t.params.n_estimators}</td>
                            <td className="py-3 px-3.5 text-slate-600">{t.params.learning_rate?.toFixed(4)}</td>
                            <td className="py-3 px-3.5 text-slate-600">{t.params.max_depth}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PageTransition>
  );
}
