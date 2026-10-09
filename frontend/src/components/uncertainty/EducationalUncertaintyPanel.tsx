"use client";

import React, { useState } from "react";
import { BookOpen, HelpCircle, Check, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

export function EducationalUncertaintyPanel() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-2xl glass-panel overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4.5 flex items-center justify-between text-left hover:bg-white/40 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-50/80 text-violet-600 flex items-center justify-center border border-violet-200/60 shadow-2xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              PREDICTION INTERVAL VS. CONFIDENCE INTERVAL
            </div>
            <div className="text-[11px] text-slate-500">
              Understanding statistical uncertainty in property price estimation
            </div>
          </div>
        </div>
        <div className="text-slate-400">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-5 sm:p-6 border-t border-slate-200/50 space-y-4 text-xs text-slate-600 bg-white/40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prediction Interval Column */}
            <div className="p-4.5 rounded-2xl bg-cyan-50/60 border border-cyan-200/70 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-900 text-xs flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-cyan-600" />
                  Prediction Interval (What We Use)
                </span>
                <span
                  className="cursor-help text-cyan-500 hover:text-cyan-700"
                  title="This range communicates uncertainty around this individual model prediction. It is not a guaranteed selling price."
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-[11px] text-cyan-800/90 leading-relaxed">
                A <strong>prediction interval</strong> models uncertainty around an <em>individual future observation</em>.
                In housing, it indicates a range where this specific home&apos;s actual sale outcome is expected to fall with the configured empirical coverage.
              </p>
              <div className="text-[10px] text-cyan-700 pt-1.5 border-t border-cyan-200/60">
                <strong>Key distinction:</strong> Accounts for both estimation error in the model and the natural variation in individual property sales.
              </div>
            </div>

            {/* Confidence Interval Column */}
            <div className="p-4.5 rounded-2xl glass-panel space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                  Confidence Interval (Not Interchangeable)
                </span>
                <span
                  className="cursor-help text-slate-400 hover:text-slate-600"
                  title="A confidence interval generally describes uncertainty around an estimated parameter or quantity, rather than serving as a direct guaranteed range for an individual property's future price."
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                A <strong>confidence interval</strong> typically describes uncertainty around an <em>estimated population parameter</em> (such as the average price of all homes in an entire city), not the price of a single specific house.
              </p>
              <div className="text-[10px] text-slate-500 pt-1.5 border-t border-slate-200/60">
                <strong>Why it matters:</strong> A confidence interval around a mean is substantially narrower and would dangerously underestimate the uncertainty of an individual property sale.
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-panel text-[11px] text-slate-600 leading-relaxed space-y-1">
            <div className="font-semibold text-slate-800">Our Statistical Principle:</div>
            <p>
              HousePrice AI uses distribution-free <strong>Conformal Prediction</strong> calibrated on held-out historical sales data. We report a point estimate alongside a calibrated prediction interval—never an arbitrary &quot;95% confidence&quot; badge that creates false certainty.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
