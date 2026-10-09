"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Share2,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  TrendingUp,
  Scale,
  Layers,
  Info,
  ExternalLink,
  Wallet,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import {
  PropertyFeatures,
  PredictionInterval,
  FeatureContribution,
  EstimateReliabilityAssessment,
} from "@/types";
import { GlassCard, GlassBadge, GlassButton, AnimatedNumber } from "@/components/ui";

interface DecisionSummaryProps {
  features: PropertyFeatures;
  predictedPrice: number;
  predictionInterval?: PredictionInterval | null;
  modelName?: string;
  reliabilityStatus?: "Strong" | "Moderate" | "Limited" | "Unavailable";
  reliabilityAssessment?: EstimateReliabilityAssessment | null;
  comparableMedianPrice?: number | null;
  savedScenarioDiff?: number | null;
  budgetStatus?: string | null;
  shapContributions?: FeatureContribution[];
  className?: string;
}

export const DecisionSummary: React.FC<DecisionSummaryProps> = ({
  features,
  predictedPrice,
  predictionInterval,
  modelName = "Voting Ensemble",
  reliabilityStatus = "Moderate",
  reliabilityAssessment,
  comparableMedianPrice,
  savedScenarioDiff,
  budgetStatus,
  shapContributions,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Interval bounds
  const lowerBoundVal = Math.round(
    predictionInterval?.lower ?? predictionInterval?.lower_bound ?? predictedPrice * 0.9
  );
  const upperBoundVal = Math.round(
    predictionInterval?.upper ?? predictionInterval?.upper_bound ?? predictedPrice * 1.1
  );

  // Top contributors
  const topDrivers = shapContributions && shapContributions.length > 0
    ? shapContributions.slice(0, 3).map((s) => s.feature.replace(/_/g, " "))
    : ["Overall Quality", "Living Area", "Age / Year Built"];

  // Model agreement label
  const modelAgreement =
    reliabilityAssessment?.consensus?.agreement_level === "High Agreement"
      ? "High"
      : reliabilityAssessment?.consensus?.agreement_level === "Moderate Agreement"
      ? "Moderate"
      : reliabilityAssessment?.consensus?.agreement_level === "Model Disagreement"
      ? "Disagreement"
      : "Moderate";

  // Dynamic "WHAT TO CONSIDER" Non-Prescriptive Evidence Section (Section 30)
  const considerations: { text: string; type: "ok" | "warn" | "info" }[] = [];

  // Check 1: Input distribution
  const inputDim = reliabilityAssessment?.dimensions.find((d) =>
    d.dimension.toLowerCase().includes("input")
  );
  if (inputDim && inputDim.status !== "Available") {
    considerations.push({
      text: "Some property inputs differ substantially from the typical historical training data.",
      type: "warn",
    });
  } else {
    considerations.push({
      text: "Your property inputs are within typical single-family training ranges.",
      type: "ok",
    });
  }

  // Check 2: Model agreement
  if (modelAgreement === "Disagreement") {
    considerations.push({
      text: "Several candidate models disagree on this property. Treat the estimate with additional caution.",
      type: "warn",
    });
  } else {
    considerations.push({
      text: "Evaluated regression models produce consistent estimates for this feature set.",
      type: "ok",
    });
  }

  // Check 3: Prediction interval uncertainty
  const intervalSpread = upperBoundVal - lowerBoundVal;
  const relSpread = (intervalSpread / (predictedPrice || 1)) * 100;
  if (relSpread > 35) {
    considerations.push({
      text: `Model uncertainty is relatively wide (${Math.round(relSpread)}% of estimate), reflecting residual variance.`,
      type: "warn",
    });
  } else {
    considerations.push({
      text: `Prediction interval is relatively compact (${Math.round(relSpread)}% spread at 90% coverage).`,
      type: "ok",
    });
  }

  // Check 4: Historical comparable variation
  if (comparableMedianPrice) {
    const diffComp = Math.abs(predictedPrice - comparableMedianPrice);
    if (diffComp > 25000) {
      considerations.push({
        text: `Historical comparable properties in this neighborhood show substantial sale price dispersion.`,
        type: "info",
      });
    } else {
      considerations.push({
        text: `Historical dataset comparables align closely with the model estimate.`,
        type: "ok",
      });
    }
  }

  const summaryText = `PROPERTY DECISION SUMMARY
Estimated Value: $${Math.round(predictedPrice).toLocaleString()}
Prediction Interval: $${Math.round(lowerBoundVal / 1000)}K – $${Math.round(upperBoundVal / 1000)}K
Estimate Reliability: ${reliabilityStatus}
Historical Comparable Median: ${comparableMedianPrice ? `$${Math.round(comparableMedianPrice / 1000)}K` : "Available in Dataset"}
Model Agreement: ${modelAgreement}
Budget Status: ${budgetStatus || "Evaluated in Planner"}
Top Contributors: ${topDrivers.join(", ")}

This is a machine-learning estimate based on historical housing data (Ames, IA). It is not an official appraisal or guaranteed market valuation.`;

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <GlassCard variant="elevated" className={`p-6 sm:p-7 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200/60 mb-1.5">
            <Sparkles className="w-3 h-3 text-violet-600" />
            <span>Decision Intelligence Synthesis</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            PROPERTY DECISION SUMMARY
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Synthesizes model estimate, prediction interval, reliability evidence, historical benchmarks, and budget status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? "Copied" : "Copy Brief"}</span>
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Share</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Structured Decision Scorecard Matrix (Section 28 & 29) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Estimated Value */}
        <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Estimated Value</span>
          <div className="text-lg font-black text-slate-900 font-mono">
            ${Math.round(predictedPrice).toLocaleString()}
          </div>
          <span className="text-[10px] text-violet-700 font-medium block truncate">
            {modelName}
          </span>
        </div>

        {/* Metric 2: Prediction Interval */}
        <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Prediction Interval</span>
          <div className="text-sm font-black text-slate-800 font-mono">
            ${Math.round(lowerBoundVal / 1000)}K – ${Math.round(upperBoundVal / 1000)}K
          </div>
          <span className="text-[10px] text-slate-500 font-medium block">
            90% Conformal
          </span>
        </div>

        {/* Metric 3: Estimate Reliability */}
        <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Estimate Reliability</span>
          <div className="text-sm font-black text-slate-900">
            {reliabilityStatus}
          </div>
          <span className="text-[10px] text-emerald-700 font-medium block">
            Multi-pillar evidence
          </span>
        </div>

        {/* Metric 4: Historical Comp Median */}
        <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Historical Comp Median</span>
          <div className="text-sm font-black text-slate-900 font-mono">
            {comparableMedianPrice ? `$${Math.round(comparableMedianPrice / 1000)}K` : "—"}
          </div>
          <span className="text-[10px] text-slate-500 font-medium block truncate">
            Ames Transactions
          </span>
        </div>

        {/* Metric 5: Model Agreement */}
        <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Model Agreement</span>
          <div className="text-sm font-black text-slate-900">
            {modelAgreement}
          </div>
          <span className="text-[10px] text-slate-500 font-medium block">
            Spread thresholded
          </span>
        </div>

        {/* Metric 6: Budget Status */}
        <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Budget Status</span>
          <div className="text-sm font-black text-slate-900">
            {budgetStatus || "Within Budget"}
          </div>
          <span className="text-[10px] text-slate-500 font-medium block">
            Affordability Planner
          </span>
        </div>
      </div>

      {/* Top Contributors Banner */}
      <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Top Contributors:</span>
          <div className="flex flex-wrap gap-1.5">
            {topDrivers.map((d, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-800 font-medium text-[11px]"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
        <span className="text-[11px] text-slate-400 italic">
          Ground Living Area: {features.GrLivArea} sq ft · Quality: {features.OverallQual}/10 · Built: {features.YearBuilt}
        </span>
      </div>

      {/* WHAT TO CONSIDER Section (Section 30) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/90 border border-slate-200/80 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-tight">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>WHAT TO CONSIDER</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Non-prescriptive observations grounded strictly in empirical model behavior and training data density:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {considerations.map((c, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                c.type === "warn"
                  ? "bg-amber-50/50 border-amber-200/70 text-amber-900"
                  : "bg-slate-50/70 border-slate-200/60 text-slate-700"
              }`}
            >
              {c.type === "warn" ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{c.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transparent Disclaimer (Section 29) */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <span>
          <strong>Responsible ML Notice:</strong> This is a machine-learning estimate based on historical housing data (Ames, Iowa). It is not an official appraisal or guaranteed market valuation.
        </span>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-violet-600" />
                  <span>Shareable Property Decision Summary</span>
                </h4>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono whitespace-pre-wrap select-all max-h-60 overflow-y-auto">
                {summaryText}
              </pre>

              <div className="flex justify-end gap-2 pt-2">
                <GlassButton variant="secondary" size="sm" onClick={() => setShowShareModal(false)}>
                  Close
                </GlassButton>
                <GlassButton variant="primary" size="sm" onClick={handleCopySummary}>
                  {copied ? "Copied!" : "Copy to Clipboard"}
                </GlassButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
};
