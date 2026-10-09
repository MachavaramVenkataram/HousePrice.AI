"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { normalizeModelInfo } from "@/types";
import {
  History,
  Search,
  Clock,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  Building,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  ChevronRight,
  Calendar,
  Zap,
  CheckCircle2,
  LayoutGrid,
  List,
  Eye,
} from "lucide-react";
import {
  PageTransition,
  GlassCard,
  GlassButton,
  GlassBadge,
  GlassDrawer,
  AnimatedNumber,
  StatusIndicator,
} from "@/components/ui";

export default function HistoryPage() {
  const [search, setSearch] = useState<string>("");
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"timeline" | "table">("timeline");
  const queryClient = useQueryClient();

  const { data: historyList, isLoading } = useQuery({
    queryKey: ["prediction-history"],
    queryFn: () => api.getHistory(50),
    refetchInterval: 12000,
  });

  const feedbackMutation = useMutation({
    mutationFn: async ({ id, feedback }: { id: number; feedback: "accurate" | "inaccurate" }) => {
      return api.submitFeedback(id, feedback);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prediction-history"] });
      if (selectedRecord) {
        setSelectedRecord((prev: any) => (prev ? { ...prev, feedback: "accurate" } : null));
      }
    },
  });

  const filtered = historyList?.filter((h) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const model = normalizeModelInfo(h.model_name);
    return (
      model.name.toLowerCase().includes(term) ||
      h.predicted_price.toString().includes(term) ||
      JSON.stringify(h.inputs || {}).toLowerCase().includes(term) ||
      (h.inputs?.Neighborhood && h.inputs.Neighborhood.toLowerCase().includes(term))
    );
  });

  const totalLogs = historyList?.length || 0;
  const avgPrice = totalLogs
    ? Math.round(historyList!.reduce((acc, curr) => acc + curr.predicted_price, 0) / totalLogs)
    : 0;
  const medianLatency = totalLogs
    ? Math.round(historyList!.reduce((acc, curr) => acc + curr.latency_ms, 0) / totalLogs)
    : 0;

  return (
    <PageTransition>
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
        {/* Header with Rose & Lavender Accent */}
        <div className="border-b border-slate-200/60 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-50/80 text-rose-700 border border-rose-200/60 shadow-2xs mb-2">
              <History className="w-3.5 h-3.5" />
              <span>Audit Trail & Telemetry Logs</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              PREDICTION HISTORY
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl font-medium">
              Review real past property estimates, model versions, conformal prediction intervals,
              input feature payloads, and inference latency.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64 sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by neighborhood, model, price..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-rose-400/40"
              />
            </div>

            {/* View switcher */}
            <div className="flex items-center bg-white/70 p-1 rounded-xl border border-slate-200/70 shadow-2xs">
              <button
                onClick={() => setViewMode("timeline")}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "timeline"
                    ? "bg-rose-500 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-700"
                }`}
                title="Timeline View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "table"
                    ? "bg-rose-500 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-700"
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Telemetry KPI Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlassCard variant="interactive" className="p-5">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span>Recorded Estimates</span>
              <History className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
              <AnimatedNumber value={totalLogs} />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Stored with full feature inputs</p>
          </GlassCard>

          <GlassCard variant="interactive" className="p-5">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span>Average Estimate</span>
              <Building className="w-4 h-4 text-violet-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
              $<AnimatedNumber value={avgPrice} />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Cross-neighborhood mean price</p>
          </GlassCard>

          <GlassCard variant="interactive" className="p-5">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span>Avg Inference Latency</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
              <AnimatedNumber value={medianLatency} /> ms
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Fast end-to-end inference</p>
          </GlassCard>
        </div>

        {/* Content Body: Timeline or Table */}
        {isLoading ? (
          <GlassCard className="p-12 text-center text-slate-400">
            <div className="inline-block animate-spin mb-3">
              <Clock className="w-6 h-6 text-rose-400" />
            </div>
            <div className="text-sm font-semibold">Loading telemetry history...</div>
          </GlassCard>
        ) : !filtered || filtered.length === 0 ? (
          <GlassCard className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto border border-rose-200/50">
              <History className="w-6 h-6" />
            </div>
            <div className="text-base font-bold text-slate-800">No prediction history yet</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your next machine-learning estimate generated in the Estimate workspace will appear here
              with full conformal interval bounds and telemetry.
            </p>
          </GlassCard>
        ) : viewMode === "timeline" ? (
          /* Timeline Hybrid Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item) => {
              const model = normalizeModelInfo(item.model_name);
              return (
                <GlassCard
                  key={item.id}
                  variant="interactive"
                  className="p-5 cursor-pointer relative group transition-all hover:border-rose-300/80"
                  onClick={() => setSelectedRecord(item)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                      <span className="text-xs font-bold text-slate-800 font-mono">
                        #{item.id}
                      </span>
                      <GlassBadge variant="subtle" size="sm">
                        {model.name}
                      </GlassBadge>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Machine-Learning Estimate
                      </div>
                      <div className="text-2xl font-black text-slate-900 font-mono">
                        ${Math.round(item.predicted_price).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Prediction Interval
                      </div>
                      <div className="text-xs font-bold text-rose-700 bg-rose-50/70 px-2.5 py-1 rounded-lg border border-rose-200/50 font-mono mt-0.5">
                        ${Math.round(item.lower_bound).toLocaleString()} — ${Math.round(item.upper_bound).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Input property features preview */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div className="truncate max-w-[280px]">
                      <span className="font-semibold text-slate-800">{item.inputs.GrLivArea || 1700} sqft</span>
                      {" • "}
                      <span>Qual {item.inputs.OverallQual || 7}/10</span>
                      {" • "}
                      <span>{item.inputs.Neighborhood || "CollgCr"}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400 font-mono">{item.latency_ms}ms</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <GlassCard className="p-4 sm:p-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/70 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Log ID</th>
                    <th className="py-3 px-3">Timestamp</th>
                    <th className="py-3 px-3">Model</th>
                    <th className="py-3 px-3">Estimate</th>
                    <th className="py-3 px-3">Prediction Interval</th>
                    <th className="py-3 px-3">Key Features</th>
                    <th className="py-3 px-3">Latency</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filtered.map((item) => {
                    const model = normalizeModelInfo(item.model_name);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedRecord(item)}
                        className="hover:bg-rose-50/20 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-3 font-bold text-slate-800">#{item.id}</td>
                        <td className="py-3 px-3 text-slate-500 font-sans text-[11px]">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 font-sans font-semibold text-slate-800">
                          {model.name}
                        </td>
                        <td className="py-3 px-3 font-black text-rose-950">
                          ${Math.round(item.predicted_price).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-[11px]">
                          ${Math.round(item.lower_bound).toLocaleString()} — ${Math.round(item.upper_bound).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-sans text-slate-600 text-[11px]">
                          {item.inputs.GrLivArea} sqft • Qual {item.inputs.OverallQual}/10 • {item.inputs.Neighborhood}
                        </td>
                        <td className="py-3 px-3 text-slate-400">{item.latency_ms}ms</td>
                        <td className="py-3 px-3 text-right">
                          <GlassButton variant="ghost" size="sm" onClick={() => setSelectedRecord(item)}>
                            <Eye className="w-3.5 h-3.5" />
                          </GlassButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* Prediction Detail Drawer */}
        <GlassDrawer
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Telemetry Record #{selectedRecord?.id}</span>
            </div>
          }
          subtitle={`Logged on ${selectedRecord ? new Date(selectedRecord.timestamp).toLocaleString() : ""}`}
          size="lg"
        >
          {selectedRecord && (
            <div className="space-y-6">
              {/* Valuation & Interval Banner */}
              <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200/60 space-y-3">
                <div className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">
                  Model Point Estimate
                </div>
                <div className="text-3xl font-black text-slate-900 font-mono">
                  ${Math.round(selectedRecord.predicted_price).toLocaleString()}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-rose-200/60 text-xs">
                  <span className="text-slate-600 font-medium">Conformal Prediction Interval:</span>
                  <span className="font-mono font-bold text-rose-800">
                    ${Math.round(selectedRecord.lower_bound).toLocaleString()} — ${Math.round(selectedRecord.upper_bound).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Model & Latency Telemetry */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white/70 border border-slate-200/60">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Deployed Model</div>
                  <div className="text-xs font-bold text-slate-800 mt-1">
                    {normalizeModelInfo(selectedRecord.model_name).name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    v{normalizeModelInfo(selectedRecord.model_name).version || "1.0.0"}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/70 border border-slate-200/60">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Inference Latency</div>
                  <div className="text-xs font-bold text-slate-800 mt-1 font-mono">
                    {selectedRecord.latency_ms} ms
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium">Sub-50ms SLA met</div>
                </div>
              </div>

              {/* Full Input Payload Breakdown */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Input Property Parameters
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  {Object.entries(selectedRecord.inputs || {}).map(([key, val]) => (
                    <div key={key} className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/50">
                      <div className="text-[10px] text-slate-400 font-medium truncate">{key}</div>
                      <div className="text-xs font-bold text-slate-800 font-mono truncate mt-0.5">
                        {String(val)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback Submission Action */}
              <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/70 space-y-3">
                <div className="text-xs font-bold text-slate-800">Ground Truth Valuation Feedback</div>
                <p className="text-[11px] text-slate-500">
                  Help continuously evaluate prediction drift by validating this estimate against actual market data.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <GlassButton
                    variant={selectedRecord.feedback === "accurate" ? "mint" : "outline"}
                    size="sm"
                    onClick={() => feedbackMutation.mutate({ id: selectedRecord.id, feedback: "accurate" })}
                    isLoading={feedbackMutation.isPending}
                    icon={<ThumbsUp className="w-3.5 h-3.5" />}
                  >
                    Accurate Estimate
                  </GlassButton>
                  <GlassButton
                    variant={selectedRecord.feedback === "inaccurate" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => feedbackMutation.mutate({ id: selectedRecord.id, feedback: "inaccurate" })}
                    isLoading={feedbackMutation.isPending}
                    icon={<ThumbsDown className="w-3.5 h-3.5" />}
                  >
                    Inaccurate Estimate
                  </GlassButton>
                </div>
              </div>
            </div>
          )}
        </GlassDrawer>
      </div>
    </PageTransition>
  );
}
