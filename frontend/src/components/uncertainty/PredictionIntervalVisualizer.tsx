"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PredictionResponse, normalizeModelInfo } from "@/types";
import {
  HelpCircle,
  AlertTriangle,
  Info,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  ChevronRight,
} from "lucide-react";

interface PredictionIntervalVisualizerProps {
  result: PredictionResponse;
  coverageLevel: number;
  onCoverageLevelChange?: (level: number) => void;
  isExpert?: boolean;
}

export function PredictionIntervalVisualizer({
  result,
  coverageLevel,
  onCoverageLevelChange,
  isExpert = false,
}: PredictionIntervalVisualizerProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<"simple" | "expert">(isExpert ? "expert" : "simple");

  const pointPrediction = result.prediction ?? result.predicted_price;
  const interval = result.prediction_interval;
  const uncertainty = result.uncertainty;
  const model = normalizeModelInfo(result.model, "Regression Model", result.model_version || "v1.0.0");
  const modelName = model.name;
  const modelVersion = model.version;

  // Requirement 23: Strict Client-Side Validation
  const isValidNumber = (val: any): val is number =>
    typeof val === "number" && !isNaN(val) && isFinite(val);

  const isIntervalValid =
    interval !== null &&
    interval !== undefined &&
    isValidNumber(pointPrediction) &&
    isValidNumber(interval.lower) &&
    isValidNumber(interval.upper) &&
    interval.lower < pointPrediction &&
    pointPrediction < interval.upper &&
    isValidNumber(interval.coverage) &&
    interval.coverage > 0 &&
    interval.coverage < 1 &&
    interval.upper - interval.lower >= 0;

  const intervalWidth = isIntervalValid
    ? interval.interval_width ?? (interval.upper - interval.lower)
    : 0;

  const uncertaintyLevel =
    uncertainty?.uncertainty_level || interval?.uncertainty_level || "Moderate";

  const unavailableReason =
    result.metadata?.interval_unavailable_reason ||
    "Uncertainty calculation was unavailable.";

  // Out of distribution warning check
  const isOod = Boolean(result.metadata?.is_out_of_distribution);
  const oodWarning = result.metadata?.ood_warning;
  const distWarning = result.metadata?.data_distribution_warning;

  // Animation variants respecting prefers-reduced-motion (Requirement 26)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.18,
        delayChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  const pointPredVariant = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  const lineVariant = {
    hidden: { scaleX: shouldReduceMotion ? 1 : 0, opacity: 0 },
    visible: {
      scaleX: 1,
      opacity: 1,
      transition: { duration: shouldReduceMotion ? 0.01 : 0.5, ease: "easeOut" as const },
    },
  };

  const boundsVariant = {
    hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  };

  const explanationVariant = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 6 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <div className="space-y-5">
      {/* Coverage Level Selector (Requirement 5) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 glass-panel rounded-2xl text-xs">
        <div className="flex items-center gap-2 text-slate-800 font-semibold">
          <Sliders className="w-4 h-4 text-violet-600" />
          <span>Configured Coverage Level:</span>
        </div>
        <div className="flex items-center gap-2">
          {[0.9, 0.95].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => onCoverageLevelChange && onCoverageLevelChange(lvl)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                Math.abs(coverageLevel - lvl) < 0.01
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20"
                  : "bg-white/80 text-slate-700 border border-slate-200/80 hover:border-violet-300 hover:bg-white"
              }`}
            >
              {Math.round(lvl * 100)}% Empirical Coverage
            </button>
          ))}
        </div>
      </div>

      {/* Mode View Tabs */}
      <div className="flex gap-2 p-1 glass-panel rounded-xl max-w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("simple")}
          className={`py-1.5 px-3.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "simple"
              ? "bg-white text-violet-700 shadow-xs border border-violet-100"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Simple Mode
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("expert")}
          className={`py-1.5 px-3.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "expert"
              ? "bg-white text-violet-700 shadow-xs border border-violet-100"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Expert Diagnostic Mode
        </button>
      </div>

      {/* Main Results Card */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="glass-panel-elevated p-6 sm:p-7 space-y-6 rounded-3xl"
      >
        {/* Model Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-600 animate-pulse shadow-sm shadow-violet-500/40" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              MODEL ESTIMATE & STATISTICAL INTERVAL
            </span>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-violet-50/80 text-violet-700 border border-violet-200/60 shadow-2xs">
              <span>{modelName}</span>
              <span className="text-violet-400">·</span>
              <span className="font-mono text-[10px]">{modelVersion}</span>
            </span>
          </div>
        </div>

        {/* Step 1: Point Estimate (Requirement 8 & 26) */}
        <motion.div variants={pointPredVariant} className="space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            MODEL ESTIMATE (POINT PREDICTION)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-sans">
              ${Math.round(pointPrediction).toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            This is a machine-learning estimate based on historical housing data.
          </p>
        </motion.div>

        {/* Prediction Interval or Graceful Fallback (Requirement 23 & 24) */}
        {isIntervalValid ? (
          <div className="space-y-5 pt-1">
            {/* Visual Uncertainty Diagram (Requirement 9 & 26) */}
            <div className="p-5 sm:p-6 rounded-2xl glass-panel border-cyan-200/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4 text-cyan-600" />
                  <span>MODEL PREDICTION INTERVAL</span>
                </div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-800 bg-cyan-50/80 border border-cyan-200/60 px-2.5 py-0.5 rounded-full shadow-2xs">
                  <span>{Math.round(interval.coverage * 100)}% Empirical Coverage</span>
                </div>
              </div>

              {/* Graphical Interval Representation ($228K ├──────●──────┤ $264K) */}
              <div className="py-4 px-2 space-y-3">
                <div className="relative flex items-center justify-between">
                  {/* Step 3: Lower Bound */}
                  <motion.div variants={boundsVariant} className="text-left shrink-0">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      LOWER BOUND
                    </div>
                    <div className="text-base sm:text-lg font-bold text-cyan-700 font-mono">
                      ${Math.round(interval.lower).toLocaleString()}
                    </div>
                  </motion.div>

                  {/* Step 2: Animated Horizontal Line with Center Point Indicator */}
                  <div className="relative flex-1 mx-4 sm:mx-6 h-10 flex items-center">
                    {/* The interval span bar (Cyan for neutral statistical info) */}
                    <motion.div
                      variants={lineVariant}
                      style={{ originX: 0.5 }}
                      className="absolute left-0 right-0 h-2 bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-400 rounded-full shadow-sm shadow-cyan-500/20"
                    />

                    {/* Left Cap */}
                    <motion.div
                      variants={boundsVariant}
                      className="absolute left-0 w-2.5 h-5 bg-cyan-600 rounded-sm -translate-x-1/2 shadow-xs"
                    />

                    {/* Center Point Estimate Marker (Violet for AI model info) */}
                    <motion.div
                      variants={pointPredVariant}
                      className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-10"
                    >
                      <div className="w-4 h-4 rounded-full bg-violet-600 border-2 border-white shadow-md ring-3 ring-violet-300/60" />
                      <span className="text-[10px] font-bold text-violet-700 bg-white/90 px-2 py-0.5 rounded-md mt-1.5 border border-violet-200/80 shadow-xs whitespace-nowrap">
                        ${Math.round(pointPrediction).toLocaleString()}
                      </span>
                    </motion.div>

                    {/* Right Cap */}
                    <motion.div
                      variants={boundsVariant}
                      className="absolute right-0 w-2.5 h-5 bg-cyan-600 rounded-sm translate-x-1/2 shadow-xs"
                    />
                  </div>

                  {/* Step 3: Upper Bound */}
                  <motion.div variants={boundsVariant} className="text-right shrink-0">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      UPPER BOUND
                    </div>
                    <div className="text-base sm:text-lg font-bold text-cyan-700 font-mono">
                      ${Math.round(interval.upper).toLocaleString()}
                    </div>
                  </motion.div>
                </div>

                {/* Range Numeric Summary */}
                <div className="text-center pt-2">
                  <span className="text-xs font-semibold text-slate-600">
                    Calibrated Range:{" "}
                    <strong className="text-slate-900 font-mono">
                      ${Math.round(interval.lower).toLocaleString()}
                    </strong>{" "}
                    —{" "}
                    <strong className="text-slate-900 font-mono">
                      ${Math.round(interval.upper).toLocaleString()}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Interval Width & Qualitative Uncertainty (Requirements 10 & 11) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/80 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-500">Interval Width:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    ${Math.round(intervalWidth).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-500">Uncertainty Level:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      uncertaintyLevel === "Lower"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : uncertaintyLevel === "Higher"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-cyan-50 text-cyan-700 border border-cyan-200"
                    }`}
                  >
                    {uncertaintyLevel} Uncertainty
                  </span>
                </div>
              </div>
            </div>

            {/* Step 4: Mode-Specific Detailed Content */}
            {activeTab === "simple" ? (
              /* Simple Mode (Requirement 12) */
              <motion.div variants={explanationVariant} className="space-y-3.5">
                <div className="p-4 rounded-2xl bg-violet-50/60 border border-violet-200/50 text-xs text-slate-700 space-y-1.5 shadow-2xs">
                  <div className="font-bold text-violet-900 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-violet-600 shrink-0" />
                    <span>Why is there a range?</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    The model is estimating from patterns learned from historical housing data,
                    so there is uncertainty around each prediction.
                  </p>
                </div>

                <div className="p-4 rounded-2xl glass-panel text-xs text-slate-600 space-y-1.5">
                  <div className="font-bold text-slate-800">What does this range mean?</div>
                  <p className="text-[11px] leading-relaxed">
                    The model estimates the property at{" "}
                    <strong className="text-slate-900">${Math.round(pointPrediction).toLocaleString()}</strong>, with an
                    uncertainty range of{" "}
                    <strong className="text-slate-900">
                      ${Math.round(interval.lower).toLocaleString()}–$
                      {Math.round(interval.upper).toLocaleString()}
                    </strong>
                    . This is not a guaranteed market price.
                  </p>
                </div>

                <div className="text-[11px] text-slate-500 italic flex items-center gap-1.5 px-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Important: this is not an official property valuation.</span>
                </div>
              </motion.div>
            ) : (
              /* Expert Diagnostic Mode (Requirement 13 & 14) */
              <motion.div variants={explanationVariant} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl glass-panel">
                    <div className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                      Point Prediction
                    </div>
                    <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                      ${Math.round(pointPrediction).toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl glass-panel">
                    <div className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                      Interval Width
                    </div>
                    <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                      ${Math.round(intervalWidth).toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl glass-panel">
                    <div className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                      Calibration Method
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      Split Conformal Prediction
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl glass-panel">
                    <div className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                      Calibration Dataset
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {uncertainty?.calibration_dataset || "Ames Holdout Calibration (292 samples)"}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl glass-panel">
                    <div className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                      Target Empirical Coverage
                    </div>
                    <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                      {Math.round((uncertainty?.target_coverage ?? interval.coverage) * 100)}%
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl glass-panel">
                    <div className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                      Observed Test Coverage (Held-Out)
                    </div>
                    <div className="text-sm font-bold text-cyan-700 font-mono mt-0.5">
                      {uncertainty?.observed_coverage !== undefined &&
                      uncertainty?.observed_coverage !== null
                        ? `${(uncertainty.observed_coverage * 100).toFixed(2)}%`
                        : "Calibrated on holdout split"}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl glass-panel sm:col-span-2">
                    <div className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                      Mean Interval Width (Held-Out Evaluation)
                    </div>
                    <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                      {uncertainty?.mean_interval_width !== undefined &&
                      uncertainty?.mean_interval_width !== null
                        ? `$${Math.round(uncertainty.mean_interval_width).toLocaleString()}`
                        : "Computed on test set"}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl glass-panel text-[11px] text-slate-600 leading-relaxed border-cyan-200/40">
                  <strong className="text-slate-900">Statistical Guarantee:</strong> The prediction interval represents
                  uncertainty around this individual model prediction. It indicates a range in
                  which future observations are expected to fall with approximately the configured
                  empirical coverage under the assumptions of the calibration procedure.
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          /* Graceful Fallback if Interval is Unavailable (Requirement 24) */
          <div className="p-5 rounded-2xl glass-panel space-y-2 border-amber-200/50">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Info className="w-4 h-4 text-slate-400" />
              <span>Prediction interval: Unavailable</span>
            </div>
            <p className="text-xs text-slate-600">
              Reason: <em>{unavailableReason}</em>
            </p>
            <p className="text-[11px] text-slate-500">
              The model estimate above remains valid, but a calibrated prediction interval could not
              be generated for this configuration.
            </p>
          </div>
        )}

        {/* Out-of-Distribution Warning (Requirement 19 & 20) */}
        {isOod && (
          <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>⚠ HIGHER UNCERTAINTY</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              {oodWarning ||
                "These inputs differ substantially from the data used to train/calibrate the model. Treat the estimate with additional caution."}
            </p>
            {distWarning && (
              <p className="text-[10px] text-amber-700 leading-relaxed">
                {distWarning}
              </p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
