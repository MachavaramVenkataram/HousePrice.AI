"use client";

import React from "react";
import { ShieldCheck, Info, Sparkles, CheckCircle2 } from "lucide-react";

export function TrustSection() {
  return (
    <div className="glass-panel p-6 sm:p-7 border border-violet-200/80 bg-gradient-to-br from-white/95 via-violet-50/30 to-purple-50/20 shadow-sm shadow-violet-100/50 rounded-2xl relative overflow-hidden">
      {/* Soft luminous ambient flare */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-violet-200/25 via-cyan-100/10 to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-violet-100/80 text-violet-800 border border-violet-200/60 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
            <span>RESPONSIBLE MACHINE LEARNING & UNCERTAINTY REPORTING</span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
            Statistical Rigor Over Misleading Confidence Scores
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            HousePrice AI pairs each property estimate with an empirical Split Conformal Prediction Interval calibrated on held-out data.
            We explicitly avoid arbitrary &ldquo;95% confidence&rdquo; marketing percentages on individual properties, communicating real regression uncertainty transparently.
          </p>
        </div>

        <div className="shrink-0 grid grid-cols-2 sm:flex sm:items-center gap-3">
          <div className="p-3.5 rounded-xl bg-white/80 border border-violet-100 text-center shadow-2xs min-w-[130px]">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Methodology</div>
            <div className="text-xs font-extrabold text-violet-700 mt-0.5">Conformal Prediction</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Split Calibration</div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/80 border border-emerald-100 text-center shadow-2xs min-w-[130px]">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Evaluation</div>
            <div className="text-xs font-extrabold text-emerald-700 mt-0.5 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>5-Fold CV</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Holdout Testing</div>
          </div>
        </div>
      </div>
    </div>
  );
}
