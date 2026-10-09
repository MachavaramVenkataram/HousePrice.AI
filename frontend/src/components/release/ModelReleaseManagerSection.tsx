"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/services/api";
import {
  ModelReleaseStatusResponse,
  ModelCandidateSummary,
  ModelValidationResult,
  ModelComparisonResult,
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
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Award,
  Layers,
  ArrowRight,
  Sliders,
  Database,
  Cpu,
  Clock,
  UserCheck,
  FileText,
  Info,
  Check,
  Zap,
} from "lucide-react";

export function ModelReleaseManagerSection() {
  const [selectedCandidateName, setSelectedCandidateName] = useState<string>("Voting Ensemble");
  const [validationResult, setValidationResult] = useState<ModelValidationResult | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ModelComparisonResult | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);
  const [approverName, setApproverName] = useState<string>("Authorized Lead Data Scientist");
  const [promotionNotes, setPromotionNotes] = useState<string>(
    "Model verified against cross-validation and conformal calibration thresholds. Approved for production hot-swap."
  );
  const [actionNotice, setActionNotice] = useState<{
    type: "success" | "warning" | "error";
    text: string;
  } | null>(null);

  // Status Query
  const {
    data: status,
    isLoading: isLoadingStatus,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ["model-release-status"],
    queryFn: () => api.getReleaseStatus(),
  });

  // Validation Mutation
  const validateMutation = useMutation({
    mutationFn: (candidate: string) => api.validateReleaseCandidate(candidate),
    onSuccess: (data) => {
      setValidationResult(data);
      setActionNotice({
        type: data.is_promotable ? "success" : "warning",
        text: data.summary,
      });
    },
    onError: (err: any) => {
      setActionNotice({
        type: "error",
        text: `Validation failed: ${err.message}`,
      });
    },
  });

  // Comparison Mutation
  const compareMutation = useMutation({
    mutationFn: (candidate: string) => api.compareReleaseModels(candidate),
    onSuccess: (data) => {
      setComparisonResult(data);
    },
    onError: (err: any) => {
      setActionNotice({
        type: "error",
        text: `Comparison failed: ${err.message}`,
      });
    },
  });

  // Promotion Mutation
  const promoteMutation = useMutation({
    mutationFn: () =>
      api.promoteModel({
        candidate_name: selectedCandidateName,
        approver: approverName,
        notes: promotionNotes,
      }),
    onSuccess: (newStatus) => {
      setShowApprovalModal(false);
      refetchStatus();
      setValidationResult(null);
      setComparisonResult(null);
      setActionNotice({
        type: "success",
        text: `Model '${selectedCandidateName}' has been successfully promoted to Production with zero-downtime hot-swap!`,
      });
    },
    onError: (err: any) => {
      setActionNotice({
        type: "error",
        text: `Promotion rejected: ${err.message}`,
      });
    },
  });

  // Rollback Mutation
  const rollbackMutation = useMutation({
    mutationFn: () =>
      api.rollbackModel({
        approver: approverName,
        notes: "Emergency or scheduled rollback to previously active verified production model.",
      }),
    onSuccess: (newStatus) => {
      refetchStatus();
      setValidationResult(null);
      setComparisonResult(null);
      setActionNotice({
        type: "success",
        text: `Rollback completed! Production active model restored to '${newStatus.current_production_model.name}'.`,
      });
    },
    onError: (err: any) => {
      setActionNotice({
        type: "error",
        text: `Rollback failed: ${err.message}`,
      });
    },
  });

  if (isLoadingStatus) {
    return (
      <GlassCard className="p-12 text-center bg-white/80 rounded-3xl border-slate-200/80 shadow-sm space-y-3">
        <RefreshCw className="w-8 h-8 text-violet-600 animate-spin mx-auto" />
        <h3 className="text-sm font-bold text-slate-800">Loading Model Governance Registry</h3>
        <p className="text-xs text-slate-500">
          Querying active production artifacts, registered candidate models, and release history...
        </p>
      </GlassCard>
    );
  }

  const currentProd = status?.current_production_model;
  const baseline = status?.baseline_model;
  const candidates = status?.candidates || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Notice Banner */}
      {actionNotice && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-2xs transition-all ${
            actionNotice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-950"
              : actionNotice.type === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-950"
              : "bg-rose-50 border-rose-200 text-rose-950"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : actionNotice.type === "warning" ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{actionNotice.text}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-[11px] underline text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header Card: Current Production vs Baseline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Current Active Production Model */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-violet-50/90 to-purple-50/70 border border-violet-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-800 bg-violet-100/90 border border-violet-200 px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
              <Zap className="w-3 h-3 text-violet-600" />
              <span>Active Production</span>
            </span>
            <span className="text-[11px] font-mono text-violet-600 font-bold">
              {currentProd?.version || "v1.0.0"}
            </span>
          </div>

          <div>
            <div className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-violet-600" />
              <span>{currentProd?.name || "CatBoost"}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Serving real-time inferences and conformal prediction intervals.
            </p>
          </div>

          <div className="pt-2 border-t border-violet-100 grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">5-Fold CV RMSE</span>
              <strong className="text-violet-800">
                ${currentProd?.cv_metrics?.rmse_mean?.toLocaleString() || "28,152"}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Variance R²</span>
              <strong className="text-violet-800">
                {currentProd?.cv_metrics?.r2_mean
                  ? `${(currentProd.cv_metrics.r2_mean * 100).toFixed(2)}%`
                  : "85.32%"}
              </strong>
            </div>
          </div>
        </div>

        {/* Academic Baseline Model */}
        <div className="p-6 rounded-3xl bg-white/80 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
              Reference Baseline
            </span>
            <span className="text-[11px] font-mono text-slate-400">v1.0.0</span>
          </div>

          <div>
            <div className="text-xl font-black text-slate-800 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-slate-400" />
              <span>{baseline?.name || "Linear Regression"}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ordinary Least Squares baseline benchmark for candidate validation.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Baseline RMSE</span>
              <strong className="text-slate-700">
                ${baseline?.cv_metrics?.rmse_mean?.toLocaleString() || "56,095"}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Baseline R²</span>
              <strong className="text-slate-700">
                {baseline?.cv_metrics?.r2_mean
                  ? `${(baseline.cv_metrics.r2_mean * 100).toFixed(2)}%`
                  : "-14.76%"}
              </strong>
            </div>
          </div>
        </div>

        {/* Governance & Rollback Controls */}
        <div className="p-6 rounded-3xl bg-white/80 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
              Governance Engine
            </span>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Zero Downtime
            </span>
          </div>

          <div>
            <div className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-violet-600" />
              <span>Release & Rollback</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Revert active production to previous release with instant memory hot-swap.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => rollbackMutation.mutate()}
              disabled={rollbackMutation.isPending}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>{rollbackMutation.isPending ? "Rolling Back..." : "Trigger Safe Rollback"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Candidate Validation & Promotion Center */}
      <GlassCard className="p-6 sm:p-7 bg-white/90 border-slate-200/80 shadow-sm rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-violet-700 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-violet-600" />
              <span>Candidate Evaluation & Promotion Pipeline</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              Evaluate Candidate Model against Documented Release Criteria
            </h2>
          </div>

          {/* Candidate Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Candidate:</span>
            <select
              value={selectedCandidateName}
              onChange={(e) => {
                setSelectedCandidateName(e.target.value);
                setValidationResult(null);
                setComparisonResult(null);
              }}
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              {candidates.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.stage})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Candidate Actions Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => validateMutation.mutate(selectedCandidateName)}
            disabled={validateMutation.isPending}
            className="py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {validateMutation.isPending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
            <span>Run 5-Pillar Validation</span>
          </button>

          <button
            type="button"
            onClick={() => compareMutation.mutate(selectedCandidateName)}
            disabled={compareMutation.isPending}
            className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {compareMutation.isPending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>Side-by-Side Comparison</span>
          </button>

          {validationResult?.is_promotable && (
            <button
              type="button"
              onClick={() => setShowApprovalModal(true)}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Approve Production Release</span>
            </button>
          )}
        </div>

        {/* 5-Pillar Technical Criteria Checklist */}
        {validationResult && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-violet-600" />
                <span>Automated Validation Criteria Results</span>
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  validationResult.is_promotable
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {validationResult.is_promotable ? "PROMOTION ELIGIBLE" : "PROMOTION BLOCKED"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {validationResult.criteria.map((cr, idx) => {
                const isPassed = cr.status === "passed";
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isPassed
                        ? "bg-emerald-50/50 border-emerald-200/60 text-emerald-950"
                        : "bg-rose-50/50 border-rose-200/60 text-rose-950"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-800">{cr.criterion_name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isPassed ? "bg-emerald-200 text-emerald-900" : "bg-rose-200 text-rose-900"
                        }`}
                      >
                        {isPassed ? "PASSED" : "FAILED"}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1 text-[11px] font-mono">
                      <div className="flex justify-between text-slate-500">
                        <span>Required Threshold:</span>
                        <span className="font-semibold text-slate-700">{cr.threshold}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Observed Value:</span>
                        <span className="font-bold text-violet-700">{cr.observed_value}</span>
                      </div>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-600 leading-relaxed font-sans">
                      {cr.message}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Side-by-Side Comparison Matrix */}
        {comparisonResult && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Detailed Metrics Comparison: {comparisonResult.current_model} vs.{" "}
                {comparisonResult.candidate_model}
              </span>
              <span className="text-xs font-bold text-violet-700 font-mono">
                Recommendation: {comparisonResult.better_model}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200/70">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3.5">Metric</th>
                    <th className="py-2.5 px-3.5">Current ({comparisonResult.current_model})</th>
                    <th className="py-2.5 px-3.5">Candidate ({comparisonResult.candidate_model})</th>
                    <th className="py-2.5 px-3.5">Delta</th>
                    <th className="py-2.5 px-3.5">Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisonResult.comparison_rows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-3.5 font-bold text-slate-800">{row.label}</td>
                      <td className="py-2.5 px-3.5 font-mono text-slate-600">
                        {typeof row.current_value === "number"
                          ? row.unit === "$"
                            ? `$${row.current_value.toLocaleString()}`
                            : row.unit === "%"
                            ? `${row.current_value.toFixed(2)}%`
                            : `${row.current_value} ${row.unit}`
                          : String(row.current_value)}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono font-bold text-violet-700">
                        {typeof row.candidate_value === "number"
                          ? row.unit === "$"
                            ? `$${row.candidate_value.toLocaleString()}`
                            : row.unit === "%"
                            ? `${row.candidate_value.toFixed(2)}%`
                            : `${row.candidate_value} ${row.unit}`
                          : String(row.candidate_value)}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-slate-600">
                        {row.difference !== null && row.difference !== undefined
                          ? `${row.difference > 0 ? "+" : ""}${row.difference.toFixed(2)} ${row.unit}`
                          : "—"}
                      </td>
                      <td className="py-2.5 px-3.5">
                        {row.improvement === true ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Improved
                          </span>
                        ) : row.improvement === false ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Degraded
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            Equivalent
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-slate-600 italic">
              <strong>Evaluation Engine Note: </strong>
              {comparisonResult.overall_recommendation}
            </p>
          </div>
        )}
      </GlassCard>

      {/* Production Release History / Audit Registry */}
      <GlassCard className="p-6 bg-white/90 border-slate-200/80 shadow-xs rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Model Release & Deployment Audit Trail
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {status?.recent_releases?.length || 0} Registered Events
          </span>
        </div>

        {status?.recent_releases && status.recent_releases.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/70">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3.5">Timestamp</th>
                  <th className="py-2.5 px-3.5">Action</th>
                  <th className="py-2.5 px-3.5">Target Model</th>
                  <th className="py-2.5 px-3.5">Previous Model</th>
                  <th className="py-2.5 px-3.5">Authorized Approver</th>
                  <th className="py-2.5 px-3.5">Release Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {status.recent_releases.map((rel) => (
                  <tr key={rel.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-3.5 font-mono text-slate-500 text-[11px]">
                      {new Date(rel.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          rel.action === "promoted"
                            ? "bg-emerald-100 text-emerald-800"
                            : rel.action === "rollback"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {rel.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 font-bold text-slate-800">
                      {rel.model_name} ({rel.model_version})
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-500">
                      {rel.previous_model ? `${rel.previous_model} (${rel.previous_version})` : "—"}
                    </td>
                    <td className="py-2.5 px-3.5 font-semibold text-slate-700">{rel.approver}</td>
                    <td className="py-2.5 px-3.5 text-slate-600 max-w-xs truncate">
                      {rel.notes || "Standard release"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic py-2">
            No production releases recorded yet in this environment. The active baseline was loaded from artifacts.
          </p>
        )}
      </GlassCard>

      {/* Promotion Approval Confirmation Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold">Authorize Production Model Promotion</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are promoting <strong>{selectedCandidateName}</strong> to active production. This will
              dynamically update the runtime <code className="font-mono text-violet-700">PredictionService</code>,
              attach the new model version metadata to future predictions, and record an immutable entry in the
              governance audit trail.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Authorized Lead Scientist Name
                </label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Release Rationale / Governance Notes
                </label>
                <textarea
                  rows={3}
                  value={promotionNotes}
                  onChange={(e) => setPromotionNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => promoteMutation.mutate()}
                disabled={promoteMutation.isPending}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {promoteMutation.isPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Confirm & Hot-Swap Model</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
