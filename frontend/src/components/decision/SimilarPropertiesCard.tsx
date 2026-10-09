"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  Building,
  TrendingUp,
  TrendingDown,
  Info,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Layers,
  Percent,
  CheckCircle2,
  ExternalLink,
  Tag,
  Calendar,
  Maximize2,
  Home,
  Compass,
} from "lucide-react";
import { PropertyFeatures, ComparableInsights, SimilarPropertyComparable } from "@/types";
import { api } from "@/services/api";
import { GlassCard, GlassBadge, GlassButton, GlassDrawer, AnimatedNumber } from "@/components/ui";

interface SimilarPropertiesCardProps {
  features: PropertyFeatures;
  estimatedPrice: number;
  className?: string;
}

export const SimilarPropertiesCard: React.FC<SimilarPropertiesCardProps> = ({
  features,
  estimatedPrice,
  className = "",
}) => {
  const [priority, setPriority] = useState<string>("balanced");
  const [matchScope, setMatchScope] = useState<string>("balanced");
  const [selectedComp, setSelectedComp] = useState<SimilarPropertyComparable | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["similar-properties", features, estimatedPrice, priority, matchScope],
    queryFn: () => api.getSimilarProperties(features, estimatedPrice, priority, 5, matchScope),
    enabled: estimatedPrice > 0,
    staleTime: 60000,
  });

  const priorities = [
    { id: "balanced", label: "Balanced" },
    { id: "size", label: "Size" },
    { id: "quality", label: "Quality" },
    { id: "location", label: "Location" },
    { id: "age", label: "Age" },
  ];

  const scopes = [
    { id: "closest", label: "Closest Match" },
    { id: "balanced", label: "Balanced Match" },
    { id: "broader", label: "Broader Match" },
  ];

  const diff = data ? estimatedPrice - data.comparable_median_price : 0;
  const isAboveMedian = diff > 0;

  return (
    <GlassCard variant="elevated" className={`p-6 sm:p-7 space-y-6 ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200/60 mb-1.5">
            <History className="w-3 h-3 text-cyan-600" />
            <span>Actual Historical Ames Records</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            HISTORICAL DATASET COMPARABLES
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Transparent distance-based retrieval against actual 2006–2010 transaction records.
          </p>
        </div>

        {/* Dual Filter Controls: Match Scope & Priority */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Scope */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Scope:</span>
            {scopes.map((s) => (
              <button
                key={s.id}
                onClick={() => setMatchScope(s.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  matchScope === s.id
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Priority */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Weight:</span>
            {priorities.map((p) => (
              <button
                key={p.id}
                onClick={() => setPriority(p.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  priority === p.id
                    ? "bg-cyan-600 text-white shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <div className="inline-block animate-spin">
            <History className="w-7 h-7 text-cyan-500" />
          </div>
          <div className="text-xs font-semibold">Calculating multi-attribute feature distance...</div>
        </div>
      ) : isError || !data || data.comparables.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs rounded-2xl bg-slate-50/50 border border-slate-200/60 font-medium">
          No sufficiently similar historical records were found.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Comparison Scoreboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Model Estimate vs Median */}
            <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/70 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Your Model Estimate vs Comparable Median
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  ${Math.round(estimatedPrice).toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-medium font-mono">
                  / ${Math.round(data.comparable_median_price).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold">
                {isAboveMedian ? (
                  <span className="text-emerald-700 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" /> +${Math.round(diff).toLocaleString()} above median
                  </span>
                ) : (
                  <span className="text-amber-700 flex items-center gap-0.5">
                    <TrendingDown className="w-3.5 h-3.5" /> -${Math.round(Math.abs(diff)).toLocaleString()} below median
                  </span>
                )}
              </div>
            </div>

            {/* Historical Range */}
            <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/70 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Historical Comparable Range
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono">
                ${Math.round(data.comparable_min_price / 1000)}K – ${Math.round(data.comparable_max_price / 1000)}K
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Historical dataset comparison ({data.comparable_count} records evaluated)
              </div>
            </div>

            {/* Positioning Summary */}
            <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/70 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Positioning Interpretation
              </span>
              <p className="text-xs font-semibold text-slate-800 leading-snug">
                {data.positioning_summary}
              </p>
              <p className="text-[10px] text-slate-400">
                This comparison uses historical records from the selected dataset and does not represent current market pricing.
              </p>
            </div>
          </div>

          {/* Premium Comparable Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {data.comparables.map((comp, idx) => (
              <motion.div
                key={comp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
                onClick={() => setSelectedComp(comp)}
                className="group relative p-4 rounded-2xl bg-white/80 hover:bg-white border border-slate-200/80 hover:border-cyan-300 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3"
              >
                <div>
                  {/* Card Header: Rank & Record */}
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-slate-500 text-[11px]">
                      Historical Property #{comp.similarity_rank || idx + 1}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                      {comp.record_id || `AMES-${comp.id}`}
                    </span>
                  </div>

                  {/* Sale Price */}
                  <div className="mb-2">
                    <div className="text-xl font-black text-slate-900 font-mono tracking-tight group-hover:text-cyan-700 transition-colors">
                      ${Math.round(comp.sale_price).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      ${comp.price_per_sqft}/sq ft • {Math.round(comp.gr_liv_area).toLocaleString()} sq ft
                    </div>
                  </div>

                  {/* Key Physical Specs */}
                  <div className="text-xs text-slate-700 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <span>{comp.bedrooms} bed</span>
                      <span>•</span>
                      <span>{comp.full_bath} bath</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-800">Quality {comp.overall_qual}/10</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Built in {comp.year_built} • {comp.neighborhood}
                    </div>
                  </div>
                </div>

                {/* Key Match Attributes & Drawer Action */}
                <div className="pt-2.5 border-t border-slate-100/90 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1">
                    {(comp.key_match_attributes || ["Living area", "Bedrooms"]).slice(0, 2).map((attr, aIdx) => (
                      <span
                        key={aIdx}
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200/50"
                      >
                        {attr}
                      </span>
                    ))}
                  </div>

                  <span className="text-xs text-cyan-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Details <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Historical Disclaimer Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 text-[11px] text-slate-500 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
            <span>
              <strong>Historical Dataset Notice:</strong> {data.historical_disclaimer}
            </span>
          </div>
        </div>
      )}

      {/* Similar Property Detail Drawer */}
      <GlassDrawer
        isOpen={selectedComp !== null}
        onClose={() => setSelectedComp(null)}
        title={
          selectedComp ? (
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-cyan-600" />
              <span>Historical Record {selectedComp.record_id || `AMES-${selectedComp.id}`}</span>
            </div>
          ) : ""
        }
        subtitle="Full comparative attribute breakdown against your modeled property inputs"
        size="lg"
      >
        {selectedComp && (
          <div className="space-y-6 text-slate-800">
            {/* Header Sale Price */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-50/70 to-emerald-50/70 border border-cyan-200/60">
              <span className="text-[10px] uppercase font-bold text-cyan-800">Historical Sale Price</span>
              <div className="text-3xl font-black text-slate-900 font-mono mt-0.5">
                ${Math.round(selectedComp.sale_price).toLocaleString()}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Ames, Iowa recorded transaction • ${selectedComp.price_per_sqft}/sq ft above-grade
              </div>
            </div>

            {/* Why This Property Was Selected */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                <span>Why It Was Selected</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {selectedComp.why_selected ||
                  `Strong proximity match on ${selectedComp.key_match_attributes?.join(", ") || "core characteristics"}. Normalized mathematical distance: ${selectedComp.distance}.`}
              </p>
            </div>

            {/* Side-by-Side Comparison Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Side-by-Side Attribute Comparison
              </h4>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                      <th className="py-2.5 px-3 text-left">Property Characteristic</th>
                      <th className="py-2.5 px-3 text-left">Your Inputs</th>
                      <th className="py-2.5 px-3 text-left">Historical Match</th>
                      <th className="py-2.5 px-3 text-right">Alignment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-xs">
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-700">Living Area</td>
                      <td className="py-2.5 px-3">{Math.round(features.GrLivArea).toLocaleString()} sq ft</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{Math.round(selectedComp.gr_liv_area).toLocaleString()} sq ft</td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        {Math.abs(features.GrLivArea - selectedComp.gr_liv_area) <= 150 ? (
                          <span className="text-emerald-700 font-bold text-[11px]">✓ Exact / Close</span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Comparable</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-700">Overall Quality</td>
                      <td className="py-2.5 px-3">{features.OverallQual}/10</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{selectedComp.overall_qual}/10</td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        {features.OverallQual === selectedComp.overall_qual ? (
                          <span className="text-emerald-700 font-bold text-[11px]">✓ Identical</span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">±1 Grade</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-700">Bedrooms</td>
                      <td className="py-2.5 px-3">{features.BedroomAbvGr} beds</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{selectedComp.bedrooms} beds</td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        {features.BedroomAbvGr === selectedComp.bedrooms ? (
                          <span className="text-emerald-700 font-bold text-[11px]">✓ Identical</span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Close</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-700">Bathrooms</td>
                      <td className="py-2.5 px-3">{features.FullBath} full</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{selectedComp.full_bath} full</td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        {features.FullBath === selectedComp.full_bath ? (
                          <span className="text-emerald-700 font-bold text-[11px]">✓ Identical</span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Close</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-700">Year Built</td>
                      <td className="py-2.5 px-3">{features.YearBuilt}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{selectedComp.year_built}</td>
                      <td className="py-2.5 px-3 text-right font-sans text-slate-400 text-[11px]">
                        Δ {Math.abs(features.YearBuilt - selectedComp.year_built)} yrs
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-700">Neighborhood</td>
                      <td className="py-2.5 px-3 font-sans">{features.Neighborhood}</td>
                      <td className="py-2.5 px-3 font-sans font-bold text-slate-900">{selectedComp.neighborhood}</td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        {features.Neighborhood === selectedComp.neighborhood ? (
                          <span className="text-emerald-700 font-bold text-[11px]">✓ Same Zone</span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Adjacent</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Methodology Note */}
            <div className="p-3.5 rounded-xl bg-slate-50 text-[11px] text-slate-500 border border-slate-200/80">
              <strong>Methodology:</strong> Standardized Euclidean feature distance with min-max bound normalization across continuous dimensions. Ranking is strictly mathematical and deterministic.
            </div>
          </div>
        )}
      </GlassDrawer>
    </GlassCard>
  );
};
