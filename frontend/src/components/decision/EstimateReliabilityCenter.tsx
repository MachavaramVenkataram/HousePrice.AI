"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Scale,
  Activity,
  AlertOctagon,
  Layers,
  Sparkles,
} from "lucide-react";
import { PropertyFeatures, EstimateReliabilityAssessment } from "@/types";
import { api } from "@/services/api";
import { GlassCard, GlassBadge } from "@/components/ui";

interface EstimateReliabilityCenterProps {
  features: PropertyFeatures;
  intervalWidth?: number;
  estimatedPrice?: number;
  className?: string;
}

export const EstimateReliabilityCenter: React.FC<EstimateReliabilityCenterProps> = ({
  features,
  intervalWidth,
  estimatedPrice,
  className = "",
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ["estimate-reliability", features, intervalWidth, estimatedPrice],
    queryFn: () => api.getEstimateReliability(features, intervalWidth, estimatedPrice),
    enabled: !!estimatedPrice,
    staleTime: 60000,
  });

  if (isLoading || !data) {
    return (
      <GlassCard className={`p-6 text-center text-xs text-slate-400 ${className}`}>
        <div className="inline-block animate-spin mb-2">
          <Activity className="w-5 h-5 text-violet-500" />
        </div>
        <div>Evaluating multi-model consensus & reliability evidence...</div>
      </GlassCard>
    );
  }

  const overall = data.overall_reliability;

  // 4 Supported Evidence Tiers (Priority 5)
  const badgeConfig = {
    Strong: {
      label: "STRONG EVIDENCE",
      variant: "mint" as const,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      pillClass: "bg-emerald-500",
      description: "Strong empirical evidence: calibrated prediction interval, in-distribution input features, and high multi-model consensus.",
    },
    Moderate: {
      label: "MODERATE EVIDENCE",
      variant: "cyan" as const,
      color: "text-cyan-800 bg-cyan-50 border-cyan-200",
      pillClass: "bg-cyan-500",
      description: "Moderate empirical evidence: valid physical parameters, sound calibration, and typical model variation.",
    },
    Limited: {
      label: "LIMITED EVIDENCE",
      variant: "amber" as const,
      color: "text-amber-800 bg-amber-50 border-amber-200",
      pillClass: "bg-amber-500",
      description: "Limited empirical evidence: inputs deviate from typical training distribution or models show elevated disagreement.",
    },
    Unavailable: {
      label: "UNAVAILABLE",
      variant: "slate" as const,
      color: "text-slate-700 bg-slate-100 border-slate-300",
      pillClass: "bg-slate-400",
      description: "Reliability assessment unavailable.",
    },
  }[overall] || {
    label: "UNAVAILABLE",
    variant: "slate" as const,
    color: "text-slate-700 bg-slate-100 border-slate-300",
    pillClass: "bg-slate-400",
    description: "Reliability assessment unavailable.",
  };

  // Count available evidence pillars (out of 5)
  const availableCount = data.dimensions.filter((d) => d.status === "Available").length;
  const totalPillars = data.dimensions.length || 5;

  // Check if Input Distribution check was flagged
  const inputDim = data.dimensions.find((d) => d.dimension.toLowerCase().includes("input"));
  const isInputAtypical = inputDim && inputDim.status !== "Available";

  // Consensus text based on spread
  const consensusSpread = data.consensus?.spread_percentage ?? 0;
  const agreementMessage =
    data.consensus?.agreement_level === "High Agreement"
      ? "Models produce similar estimates."
      : data.consensus?.agreement_level === "Moderate Agreement"
      ? "Models show moderate variation across architectures."
      : "Models disagree on this property. Treat the estimate with additional caution.";

  return (
    <GlassCard variant="elevated" className={`p-6 sm:p-7 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200/60 mb-1.5">
            <ShieldCheck className="w-3 h-3 text-violet-600" />
            <span>Empirical Evidence Assessment</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            ESTIMATE RELIABILITY
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Evaluates prediction intervals, input training density, calibration status, and multi-model consensus.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <GlassBadge variant={badgeConfig.variant} size="md" dot pulse>
            {badgeConfig.label}
          </GlassBadge>
        </div>
      </div>

      {/* Visual Evidence Meter (Discrete Evidence Steps, Not Arbitrary Percentage) */}
      <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">Empirical Evidence Quality</span>
          <span className="font-bold text-slate-900">
            {availableCount} of {totalPillars} Pillars Verified
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 h-2.5">
          {Array.from({ length: totalPillars }).map((_, idx) => {
            const isFilled = idx < availableCount;
            return (
              <div
                key={idx}
                className={`h-full rounded-full transition-all duration-300 ${
                  isFilled
                    ? overall === "Strong"
                      ? "bg-emerald-500"
                      : overall === "Moderate"
                      ? "bg-cyan-500"
                      : "bg-amber-500"
                    : "bg-slate-200"
                }`}
              />
            );
          })}
        </div>
        <p className="text-[11px] text-slate-500">{badgeConfig.description}</p>
      </div>

      {/* Input Outside Typical Training Data Alert Banner if triggered */}
      {isInputAtypical && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-3"
        >
          <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold uppercase tracking-wider text-[11px] text-amber-800">
              INPUT OUTSIDE TYPICAL TRAINING DATA
            </div>
            <p className="leading-relaxed">
              The model may be less reliable for this property because some inputs differ substantially from the training data.
            </p>
            {inputDim?.detail && (
              <p className="text-[11px] text-amber-700/90 font-medium">Flagged: {inputDim.detail}</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Evidence Checklist (Section 10) */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Evidence Checklist
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {data.dimensions.map((dim, idx) => {
            const isOk = dim.status === "Available";
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs transition-colors ${
                  isOk
                    ? "bg-white/80 border-slate-200/70"
                    : "bg-amber-50/40 border-amber-200/70"
                }`}
              >
                {isOk ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>{isOk ? "✓" : "⚠"}</span>
                    <span>{dim.dimension}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{dim.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Model Agreement & Multi-Model Estimates (Section 12) */}
      {data.consensus && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white/90 border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-violet-600" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                MODEL ESTIMATES & CONSENSUS SPREAD
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500">
                Spread: {consensusSpread}% (${Math.round(data.consensus.spread_amount).toLocaleString()})
              </span>
              <GlassBadge
                variant={
                  data.consensus.agreement_level === "High Agreement"
                    ? "mint"
                    : data.consensus.agreement_level === "Moderate Agreement"
                    ? "cyan"
                    : "coral"
                }
                size="sm"
              >
                {data.consensus.agreement_level}
              </GlassBadge>
            </div>
          </div>

          {/* Model Agreement Explanation Note */}
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              data.consensus.agreement_level === "Model Disagreement"
                ? "bg-rose-50 border border-rose-200 text-rose-800"
                : "bg-slate-50 border border-slate-200/60 text-slate-600"
            }`}
          >
            {data.consensus.agreement_level === "Model Disagreement" ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span>{agreementMessage}</span>
          </div>

          {/* Multi-Model Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {data.consensus.models.map((m, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 space-y-1 hover:border-violet-300 transition-colors"
              >
                <div className="text-[10px] uppercase font-bold text-slate-400 truncate">
                  {m.model_name}
                </div>
                <div className="text-sm font-black text-slate-900 font-mono">
                  ${Math.round(m.predicted_price).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
};
