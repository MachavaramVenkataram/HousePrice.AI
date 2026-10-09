"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  BarChart2,
  SlidersHorizontal,
  Database,
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers,
  FlaskConical,
  HelpCircle,
  TrendingDown,
  Info,
} from "lucide-react";
import { TrustSection } from "@/components/uncertainty/TrustSection";
import {
  PageTransition,
  GlassCard,
  AnimatedNumber,
  GlassTabs,
  StatusIndicator,
} from "@/components/ui";

export default function OverviewPage() {
  const [benchmarkMetric, setBenchmarkMetric] = useState<"rmse" | "mae" | "r2">("rmse");

  const { data: benchmark } = useQuery({
    queryKey: ["benchmark-summary"],
    queryFn: () => api.getBenchmark(),
  });

  const { data: profile } = useQuery({
    queryKey: ["dataset-profile-summary"],
    queryFn: () => api.getDatasetProfile(),
  });

  const ensembleModel = benchmark?.find((b) =>
    b.model.toLowerCase().includes("voting")
  );
  const baselineModel = benchmark?.find((b) =>
    b.model.toLowerCase().includes("linear regression")
  );

  return (
    <PageTransition className="space-y-12 pb-8">
      {/* Hero Section (Sections 19, 20 & 21: Liquid Glass Hero + Interactive Property Visualization) */}
      <GlassCard
        variant="elevated"
        lightBeam={true}
        padding="lg"
        className="relative overflow-hidden border border-white/95 shadow-xl shadow-violet-100/40 rounded-3xl"
      >
        {/* Soft internal liquid color diffusion */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-radial from-violet-300/25 via-purple-100/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-radial from-cyan-200/25 via-sky-100/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-5 right-10 w-72 h-72 bg-radial from-emerald-100/20 via-teal-50/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Hero Pitch */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-violet-100/80 text-violet-800 border border-violet-200/60 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-violet-600 animate-spin" style={{ animationDuration: "8s" }} />
              <span>HOUSEPRICE AI • ADVANCED PROPERTY VALUATION</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl lg:text-5.5xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                Predict with data.{" "}
                <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Understand the estimate.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal pt-1 max-w-2xl">
                Generate machine-learning property price estimates, understand uncertainty, and explore what drives each prediction with calibrated Split Conformal Prediction intervals and local SHAP feature attributions.
              </p>
            </div>

            {/* Hero CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/predict"
                className="glass-cta-primary inline-flex items-center gap-2 px-6 py-3.5 font-bold text-sm shadow-md transition-all cursor-pointer group rounded-2xl"
              >
                <Sparkles className="w-4 h-4 text-violet-200" />
                <span>Estimate Property Value</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/what-if"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/90 hover:bg-white text-slate-700 border border-slate-200/90 text-sm font-semibold shadow-2xs hover:border-violet-300 transition-all cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 text-violet-600" />
                <span>Try What-If</span>
              </Link>

              <Link
                href="/model-lab"
                className="inline-flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-white/60 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/70 text-sm font-medium transition-colors cursor-pointer"
              >
                <BarChart2 className="w-4 h-4 text-slate-400" />
                <span>Explore the Model</span>
              </Link>
            </div>
          </div>

          {/* Right Hero Visual (Section 21: Floating Liquid-Glass Property & Prediction Interval Card) */}
          <div className="lg:col-span-5">
            <div className="glass-panel p-6 border border-white/95 shadow-xl shadow-violet-200/40 rounded-2xl space-y-5 bg-gradient-to-b from-white/95 via-white/85 to-violet-50/30">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Live Model Valuation Preview
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700 font-mono">
                  Voting Ensemble v1.0.0
                </span>
              </div>

              {/* Estimated Property Value Hero Figure */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Model Estimate
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-mono">
                  $245,000
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Sample Ames Property (1,710 sq ft • Qual 7/10 • Built 2003)
                </div>
              </div>

              {/* Visual Conformal Prediction Interval (Section 21 & 33) */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    Prediction Interval
                  </span>
                  <span className="text-cyan-700 text-[10px] font-bold bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                    90% Conformal Coverage
                  </span>
                </div>

                <div className="flex items-center justify-between font-mono text-xs font-bold text-slate-700">
                  <span>$228K</span>
                  <span className="text-violet-700 font-extrabold text-sm">$245,000</span>
                  <span>$264K</span>
                </div>

                {/* Interval Graphic Line */}
                <div className="relative h-2 bg-slate-200/80 rounded-full flex items-center">
                  <div className="absolute inset-y-0 left-2 right-2 bg-gradient-to-r from-cyan-400 via-violet-500 to-cyan-400 rounded-full" />
                  <div className="absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-violet-600 border-2 border-white shadow-xs" />
                </div>

                <div className="text-[10px] text-slate-400 text-center pt-0.5">
                  Finite-sample empirical coverage calibrated on holdout split
                </div>
              </div>

              {/* Local SHAP Preview */}
              <div className="space-y-1.5 pt-1 text-xs border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Top SHAP Insights
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 text-emerald-900 flex items-center justify-between">
                    <span className="font-semibold">+ Living Area</span>
                    <span className="font-mono text-emerald-700 font-bold">+$24.2k</span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 text-emerald-900 flex items-center justify-between">
                    <span className="font-semibold">+ Overall Qual</span>
                    <span className="font-mono text-emerald-700 font-bold">+$18.5k</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Decision Intelligence Flow (ESTIMATE -> UNDERSTAND -> COMPARE -> SIMULATE -> PLAN -> DECIDE) (Req 1, 55) */}
      <div className="glass-card-premium p-6 rounded-3xl border border-white/80 shadow-md bg-white/70 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Property Decision Intelligence Journey
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            From single-point estimate to actionable, transparent decisions
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { step: "1. ESTIMATE", label: "Model Valuation", desc: "Ensemble price calculation", color: "from-violet-500/10 to-indigo-500/10 text-violet-700 border-violet-200/60" },
            { step: "2. UNDERSTAND", label: "Split Conformal", desc: "Quantified uncertainty bands", color: "from-cyan-500/10 to-sky-500/10 text-cyan-800 border-cyan-200/60" },
            { step: "3. COMPARE", label: "Historical Records", desc: "Ames dataset comparables", color: "from-emerald-500/10 to-teal-500/10 text-emerald-800 border-emerald-200/60" },
            { step: "4. SIMULATE", label: "What-If & Remodel", desc: "Modeled improvement changes", color: "from-amber-500/10 to-orange-500/10 text-amber-800 border-amber-200/60" },
            { step: "5. PLAN", label: "Affordability", desc: "Mortgage & payment checks", color: "from-rose-500/10 to-pink-500/10 text-rose-800 border-rose-200/60" },
            { step: "6. DECIDE", label: "Executive Synthesis", desc: "Confidence & report export", color: "from-purple-500/10 to-violet-500/10 text-purple-800 border-purple-200/60" },
          ].map((item, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-2xl bg-gradient-to-b ${item.color} border shadow-2xs space-y-1`}
            >
              <div className="text-[10px] font-black uppercase tracking-wider opacity-70">
                {item.step}
              </div>
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {item.label}
              </div>
              <div className="text-[10px] text-slate-500 leading-tight">
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prominent Quick Actions (Req 38, 39) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Quick Decision Actions:
          </span>
          <span className="text-[11px] text-violet-600 font-semibold">
            Instant Access
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/predict"
            className="p-4 rounded-2xl glass-panel glass-panel-interactive border border-white/95 bg-white/80 hover:bg-white transition-all shadow-2xs group cursor-pointer space-y-2 block"
          >
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                ✦
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 group-hover:text-violet-700 transition-colors">
                New Estimate
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Calculate value with conformal intervals & SHAP attribution
              </p>
            </div>
          </Link>

          <Link
            href="/what-if"
            className="p-4 rounded-2xl glass-panel glass-panel-interactive border border-white/95 bg-white/80 hover:bg-white transition-all shadow-2xs group cursor-pointer space-y-2 block"
          >
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                ⚡
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                What-If Simulator
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Simulate additions, remodels, and test 1D sensitivity curves
              </p>
            </div>
          </Link>

          <Link
            href="/what-if"
            className="p-4 rounded-2xl glass-panel glass-panel-interactive border border-white/95 bg-white/80 hover:bg-white transition-all shadow-2xs group cursor-pointer space-y-2 block"
          >
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                📊
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Compare Scenarios
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Side-by-side matrices comparing estimates & configurations
              </p>
            </div>
          </Link>

          <Link
            href="/history"
            className="p-4 rounded-2xl glass-panel glass-panel-interactive border border-white/95 bg-white/80 hover:bg-white transition-all shadow-2xs group cursor-pointer space-y-2 block"
          >
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                📜
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                Prediction History
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Audit past model valuations, intervals, and latency records
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* KPI Cards Strip (Requirement 25 & 26: Liquid Glass Cards with Semantic Colors & Animated Numbers) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Production Model (Semantic Violet) */}
        <div className="glass-panel glass-panel-interactive p-5 space-y-2.5 border-violet-100/80 bg-white/85">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Production Model</span>
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-subtle-pulse" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 truncate">
            {ensembleModel?.model || "Voting Ensemble"}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            <Cpu className="w-3.5 h-3.5 text-violet-600" />
            <span>XGBoost + CatBoost + LightGBM</span>
          </div>
        </div>

        {/* 2. 5-Fold CV RMSE (Semantic Cyan) */}
        <div className="glass-panel glass-panel-interactive p-5 space-y-2.5 border-cyan-100/80 bg-white/85">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>5-Fold CV RMSE</span>
            <TrendingUp className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-mono">
            <AnimatedNumber
              value={ensembleModel ? Math.round(ensembleModel.cv_rmse_mean) : 28286}
              prefix="$"
            />
            <span className="text-xs font-normal text-slate-400 ml-1.5">
              ±${ensembleModel ? Math.round(ensembleModel.cv_rmse_std).toLocaleString() : "9,915"}
            </span>
          </div>
          <div className="text-xs text-cyan-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Lowest Validation Error</span>
          </div>
        </div>

        {/* 3. Prediction Coverage (Semantic Mint) */}
        <div className="glass-panel glass-panel-interactive p-5 space-y-2.5 border-emerald-100/80 bg-white/85">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Prediction Coverage</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-mono">
            <AnimatedNumber value={90} suffix="% Coverage" />
          </div>
          <div className="text-xs text-emerald-700 font-medium">
            Split Conformal Calibration (±$37.2k)
          </div>
        </div>

        {/* 4. Dataset Integrity (Semantic Amber/Peach) */}
        <div className="glass-panel glass-panel-interactive p-5 space-y-2.5 border-amber-100/80 bg-white/85">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Dataset Integrity</span>
            <Database className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-mono">
            <AnimatedNumber value={profile?.rows || 1460} /> Homes /{" "}
            <AnimatedNumber value={profile?.total_columns || 81} /> Cols
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Quality Score:{" "}
              <AnimatedNumber
                value={profile?.data_quality_score || 92.5}
                decimals={1}
              />
              /100
            </span>
          </div>
        </div>
      </section>

      {/* Model Benchmark Showcase (Section 27 & 28: Model Intelligence Surface with Metric Toggle) */}
      <section className="glass-panel p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 mb-1.5">
              <FlaskConical className="w-3 h-3" />
              <span>Model Intelligence</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              Empirical Model Performance Comparison
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              All candidates evaluated on identical 5-fold cross-validation splits and holdout test set against the standard Linear Regression academic baseline.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Metric Switcher Tabs (Req 28) */}
            <GlassTabs
              tabs={[
                { id: "rmse", label: "RMSE" },
                { id: "mae", label: "MAE" },
                { id: "r2", label: "R² Score" },
              ]}
              activeTab={benchmarkMetric}
              onChange={(id) => setBenchmarkMetric(id as "rmse" | "mae" | "r2")}
            />

            <Link
              href="/model-lab"
              className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1 self-start sm:self-auto group cursor-pointer"
            >
              <span className="hidden sm:inline">View Lab</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200/80 rounded-2xl bg-white/70">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3.5">Model</th>
                <th className="py-3 px-3.5">Category</th>
                <th className="py-3 px-3.5">5-Fold CV RMSE</th>
                <th className="py-3 px-3.5">Test RMSE</th>
                <th className="py-3 px-3.5">Test MAE</th>
                <th className="py-3 px-3.5">Test R²</th>
                <th className="py-3 px-3.5">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {benchmark ? (
                benchmark.slice(0, 5).map((m, idx) => (
                  <tr
                    key={m.model}
                    className={`hover:bg-slate-50 transition-colors ${
                      idx === 0 ? "bg-violet-50/50 font-medium" : ""
                    }`}
                  >
                    <td className="py-3 px-3.5 font-sans font-bold text-slate-900 flex items-center gap-2">
                      {idx === 0 && (
                        <span className="w-2 h-2 rounded-full bg-violet-600" />
                      )}
                      {m.model}
                    </td>
                    <td className="py-3 px-3.5 font-sans text-slate-500 text-[11px]">{m.category}</td>
                    <td className="py-3 px-3.5 text-slate-900 font-bold">
                      ${Math.round(m.cv_rmse_mean).toLocaleString()}{" "}
                      <span className="text-[10px] text-slate-400 font-normal">±${Math.round(m.cv_rmse_std).toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-3.5 font-bold text-slate-900">${Math.round(m.test_rmse).toLocaleString()}</td>
                    <td className="py-3 px-3.5 text-slate-700">${Math.round(m.test_mae).toLocaleString()}</td>
                    <td className="py-3 px-3.5 text-emerald-600 font-bold">{(m.test_r2 * 100).toFixed(2)}%</td>
                    <td className="py-3 px-3.5 font-sans">
                      {idx === 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800 border border-violet-200">
                          Production
                        </span>
                      ) : m.model.includes("Linear") ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Baseline
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Candidate
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                    Loading benchmark metrics...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Platform Architecture & Key Features (MLOps & Platform Cards) */}
      <section className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 mb-1.5">
            <Cpu className="w-3 h-3" />
            <span>Production ML Architecture</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">End-to-End MLOps Capabilities</h2>
          <p className="text-xs text-slate-500 mt-1">
            Engineered from ground up with production data science and software engineering standards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel glass-panel-interactive p-6 space-y-3.5 bg-white/85">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Split Conformal Uncertainty</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Provides finite-sample empirical coverage on calibration data. Generates calibrated Split Conformal Prediction
              intervals rather than ungrounded point forecasts.
            </p>
            <Link
              href="/predict"
              className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-800 pt-1 group"
            >
              <span>Estimate Property Value</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="glass-panel glass-panel-interactive p-6 space-y-3.5 bg-white/85">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Scenario What-If Simulator</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Modify living area, remodel year, or quality scores to observe model estimate changes
              in real time through the live pipeline.
            </p>
            <Link
              href="/what-if"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 pt-1 group"
            >
              <span>Simulate Changes</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="glass-panel glass-panel-interactive p-6 space-y-3.5 bg-white/85">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shadow-2xs">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Data Distribution & Drift</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Continuous Kolmogorov-Smirnov 2-sample statistical testing to identify feature distribution shifts
              against historical training baselines.
            </p>
            <Link
              href="/monitoring"
              className="inline-flex items-center gap-1 text-xs font-bold text-cyan-700 hover:text-cyan-900 pt-1 group"
            >
              <span>View Drift Monitor</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW WE REPORT UNCERTAINTY (Light Glass Panel) */}
      <TrustSection />

      {/* Model Limitations & Responsible ML Notice (Requirement 48: Light Pearl/Lavender Card) */}
      <section className="glass-panel p-6 rounded-2xl bg-white/85 border border-violet-100/70 shadow-xs space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
          <ShieldCheck className="w-4 h-4 text-violet-600" />
          <span>About Model Estimates & Limitations</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          HOUSEPRICE AI generates data-driven price estimates learned from historical transactions in the Ames Housing dataset (1,460 residential properties, 81 features).
          These statistical predictions depend on patterns present in historical data and may differ from real-world market prices.
          Market conditions, sudden interest rate shifts, and unmeasured physical property conditions are not captured by the training corpus.
          Model estimates do not constitute official real estate appraisals or guaranteed transaction valuations.
        </p>
      </section>
    </PageTransition>
  );
}
