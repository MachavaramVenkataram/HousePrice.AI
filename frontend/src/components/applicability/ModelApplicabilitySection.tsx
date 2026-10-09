"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Globe,
  Database,
  Activity,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { ModelApplicabilityResponse, ApplicabilityCheck, DatasetScopeInfo } from "@/types";
import { GlassCard, GlassBadge } from "@/components/ui";

interface ModelApplicabilitySectionProps {
  applicability?: ModelApplicabilityResponse | null;
  className?: string;
  isCompact?: boolean;
}

export function ModelApplicabilitySection({
  applicability,
  className = "",
  isCompact = false,
}: ModelApplicabilitySectionProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showScopeModal, setShowScopeModal] = useState(false);

  if (!applicability) {
    return (
      <GlassCard className={`p-4 bg-white/70 border-white/60 shadow-xs ${className}`}>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-violet-500 animate-spin" />
            <span>Evaluating model applicability across 8 validation pillars...</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Ames Housing Envelope</span>
        </div>
      </GlassCard>
    );
  }

  const { status, overall_summary, checks, limitations, scope, actionable_guidance } = applicability;

  // Extract key high-level statuses for the compact summary
  const schemaCheck = checks.find((c) => c.name === "schema_validity");
  const rangeCheck = checks.find((c) => c.name === "numeric_range");
  const catCheck = checks.find((c) => c.name === "categorical_support");
  const scopeCheck = checks.find((c) => c.name === "dataset_scope");
  const calCheck = checks.find((c) => c.name === "interval_calibration");

  const getStatusBadge = (chk?: ApplicabilityCheck, fallbackName: string = "") => {
    if (!chk) return <GlassBadge variant="slate">Pending</GlassBadge>;
    switch (chk.status) {
      case "passed":
      case "compatible":
      case "available":
        return <GlassBadge variant="mint">Passed</GlassBadge>;
      case "warning":
      case "limited":
        return <GlassBadge variant="amber">Warning</GlassBadge>;
      case "unsupported":
      case "potentially_mismatched":
      case "unavailable":
        return <GlassBadge variant="rose">Unsupported</GlassBadge>;
      default:
        return <GlassBadge variant="slate">{chk.status}</GlassBadge>;
    }
  };

  const getOverallStyle = () => {
    switch (status) {
      case "passed":
        return {
          bg: "bg-emerald-50/80 border-emerald-200/60 text-emerald-950",
          icon: <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />,
          title: "Model Highly Applicable",
          badge: "emerald",
        };
      case "warning":
      case "limited":
        return {
          bg: "bg-amber-50/80 border-amber-200/60 text-amber-950",
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          title: "Limited Applicability (Atypical Inputs)",
          badge: "amber",
        };
      case "unsupported":
      default:
        return {
          bg: "bg-rose-50/80 border-rose-200/60 text-rose-950",
          icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
          title: "Unsupported Features / Territory Mismatch",
          badge: "rose",
        };
    }
  };

  const overallStyle = getOverallStyle();

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Compact Overview Card */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs transition-all ${overallStyle.bg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5">
          <div className="flex items-center gap-2.5">
            {overallStyle.icon}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <span>Model Applicability Assessment</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-white/80 border border-black/10 text-slate-600">
                  8-Pillar Audit
                </span>
              </div>
              <p className="text-sm font-semibold mt-0.5 text-slate-800">{overall_summary}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-violet-600" />
              <span>{showTechnicalDetails ? "Hide Technical Details" : "Technical Details"}</span>
              {showTechnicalDetails ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Actionable guidance if flagged */}
        {actionable_guidance && status !== "passed" && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-white/70 border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Guidance: </span>
              {actionable_guidance}
            </div>
          </div>
        )}

        {/* Compact 5-Metric Quick Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 text-xs">
          <div className="p-2 rounded-xl bg-white/60 border border-white/80 space-y-1">
            <span className="text-[10px] text-slate-500 font-medium block">Input Schema</span>
            <div className="font-semibold text-slate-800 flex items-center justify-between">
              <span>{schemaCheck?.status === "passed" ? "Passed" : "Warning"}</span>
              {getStatusBadge(schemaCheck)}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-white/60 border border-white/80 space-y-1">
            <span className="text-[10px] text-slate-500 font-medium block">Training Range</span>
            <div className="font-semibold text-slate-800 flex items-center justify-between">
              <span>{rangeCheck?.status === "passed" ? "Represented" : "Unusual"}</span>
              {getStatusBadge(rangeCheck)}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-white/60 border border-white/80 space-y-1">
            <span className="text-[10px] text-slate-500 font-medium block">Category Support</span>
            <div className="font-semibold text-slate-800 flex items-center justify-between">
              <span>{catCheck?.status === "passed" ? "Supported" : "Unsupported"}</span>
              {getStatusBadge(catCheck)}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-white/60 border border-white/80 space-y-1">
            <span className="text-[10px] text-slate-500 font-medium block">Dataset Scope</span>
            <div className="font-semibold text-slate-800 flex items-center justify-between">
              <span>{scopeCheck?.status === "compatible" ? "Ames, IA" : "Mismatched"}</span>
              {getStatusBadge(scopeCheck)}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-white/60 border border-white/80 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-500 font-medium block">Interval Calibration</span>
            <div className="font-semibold text-slate-800 flex items-center justify-between">
              <span>{calCheck?.status === "available" ? "Active (90%)" : "Unavailable"}</span>
              {getStatusBadge(calCheck)}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Technical Details Panel */}
      {showTechnicalDetails && (
        <GlassCard className="p-5 bg-white/90 border-slate-200/80 shadow-md space-y-4 rounded-2xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Detailed Verification Telemetry
              </h4>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {checks.filter((c) => c.status === "passed" || c.status === "compatible" || c.status === "available").length} / {checks.length} Checks Satisfied
            </span>
          </div>

          {/* Granular 8 Checks List */}
          <div className="space-y-2">
            {checks.map((chk, idx) => {
              const isOk = chk.status === "passed" || chk.status === "compatible" || chk.status === "available";
              const isWarn = chk.status === "warning" || chk.status === "limited";
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs transition-all ${
                    isOk
                      ? "bg-slate-50/60 border-slate-200/50 text-slate-800"
                      : isWarn
                      ? "bg-amber-50/60 border-amber-200/60 text-amber-900"
                      : "bg-rose-50/60 border-rose-200/60 text-rose-900"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      {isOk ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : isWarn ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-0.5">
                        <span className="font-bold capitalize text-slate-800">
                          {chk.name.replace(/_/g, " ")}
                        </span>
                        <p className="text-slate-600 leading-relaxed">{chk.message}</p>
                      </div>
                    </div>
                    {getStatusBadge(chk)}
                  </div>

                  {/* Telemetry Details */}
                  {chk.details && Object.keys(chk.details).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-black/5 text-[11px] font-mono text-slate-500 space-y-0.5">
                      {Object.entries(chk.details).map(([k, v]) => (
                        <div key={k} className="flex items-baseline justify-between gap-2">
                          <span className="text-slate-400 capitalize">{k.replace(/_/g, " ")}:</span>
                          <span className="text-slate-700 font-semibold text-right">
                            {typeof v === "object" ? JSON.stringify(v) : String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Dataset Geographic & Historical Scope Card */}
          {scope && (
            <div className="p-4 rounded-xl bg-violet-50/60 border border-violet-200/60 text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-violet-900 font-bold">
                <Globe className="w-4 h-4 text-violet-600" />
                <span>Dataset Geographic and Historical Scope</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Dataset Name:</span>
                  <span className="font-semibold text-slate-800">{scope.dataset_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Geographic Scope:</span>
                  <span className="font-semibold text-slate-800">{scope.geographic_scope}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Historical Period:</span>
                  <span className="font-semibold text-slate-800">{scope.historical_period}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Target Variable:</span>
                  <span className="font-semibold text-slate-800">{scope.target_variable}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-100/70 border border-amber-300/50 text-[11px] text-amber-950 font-medium">
                <strong>Mandatory Market Limitation: </strong>
                {scope.market_warning}
              </div>

              {scope.known_limitations?.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Documented Scope Limitations:
                  </span>
                  <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                    {scope.known_limitations.map((lim, i) => (
                      <li key={i}>{lim}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
