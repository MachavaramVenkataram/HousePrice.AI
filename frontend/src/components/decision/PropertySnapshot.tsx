"use client";

import React, { useState } from "react";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Sliders,
} from "lucide-react";
import { PropertyFeatures, PropertyProfile, InputQualityAssessment } from "@/types";
import { GlassCard, GlassBadge, GlassButton } from "@/components/ui";

interface PropertySnapshotProps {
  features: PropertyFeatures;
  profile?: PropertyProfile | null;
  inputQuality?: InputQualityAssessment | null;
  className?: string;
  isExpert?: boolean;
}

export const PropertySnapshot: React.FC<PropertySnapshotProps> = ({
  features,
  profile,
  inputQuality,
  className = "",
}) => {
  const [showQualityDetails, setShowQualityDetails] = useState(false);

  const livingArea = Math.round(features.GrLivArea || 1700);
  const beds = features.BedroomAbvGr || 3;
  const baths = features.FullBath || 2;
  const yearBuilt = features.YearBuilt || 2000;
  const quality = features.OverallQual || 7;
  const neighborhood = features.Neighborhood || "CollgCr";
  const garage = features.GarageCars || 2;
  const bsmt = Math.round(features.TotalBsmtSF || 1000);

  const qualityStatus = inputQuality?.status || "Good";
  const qualityVariant =
    qualityStatus === "Excellent" ? "mint" : qualityStatus === "Good" ? "cyan" : "amber";

  return (
    <GlassCard variant="elevated" className={`p-5 sm:p-6 space-y-4 ${className}`}>
      {/* Top Header & Snapshot Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100/70">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Evaluated Property Profile
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {neighborhood} Single-Family Residence
            </h3>
          </div>
        </div>

        {/* Input Quality Badge with Expandable Details */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <GlassBadge variant={qualityVariant} size="sm" dot>
            Input Quality: {qualityStatus}
          </GlassBadge>
          <button
            type="button"
            onClick={() => setShowQualityDetails(!showQualityDetails)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="View validation quality checks"
          >
            {showQualityDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Profile Attribute Chips */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <span className="px-2.5 py-1 rounded-xl bg-violet-50/80 text-violet-800 border border-violet-200/50">
          {beds} Bedrooms
        </span>
        <span className="px-2.5 py-1 rounded-xl bg-violet-50/80 text-violet-800 border border-violet-200/50">
          {baths} Full Bath
        </span>
        <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/60 font-mono">
          {livingArea.toLocaleString()} sq ft
        </span>
        <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/60">
          Built {yearBuilt}
        </span>
        <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/60">
          Quality {quality}/10
        </span>
        <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/60">
          {garage}-Car Garage
        </span>
        <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/60 font-mono">
          {bsmt.toLocaleString()} sq ft Bsmt
        </span>
      </div>

      {/* Factual Summary Microcopy */}
      <p className="text-xs text-slate-600 leading-relaxed font-medium">
        {profile?.summary_text || (
          <>
            Property characteristics include <strong>{livingArea.toLocaleString()} sq ft</strong> living area,{" "}
            <strong>{beds} bedrooms</strong>, and <strong>{baths} full bathrooms</strong> in {neighborhood}. It was built in {yearBuilt} with a finish rating of {quality}/10.
          </>
        )}
      </p>

      {/* Expandable Input Quality Drawer */}
      {showQualityDetails && inputQuality && (
        <div className="mt-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">Training Distribution & Range Checks</span>
            <span className="text-[11px] text-slate-400 font-mono">
              {inputQuality.passed_checks.length} passed
              {inputQuality.warnings.length > 0 && ` • ${inputQuality.warnings.length} notice`}
            </span>
          </div>

          {inputQuality.warnings.length > 0 && (
            <div className="space-y-1.5">
              {inputQuality.warnings.map((w, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-amber-800 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/60 text-[11px]"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1">
            {inputQuality.passed_checks.slice(0, 4).map((p, idx) => (
              <div key={idx} className="flex items-center gap-2 text-slate-600 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
};
