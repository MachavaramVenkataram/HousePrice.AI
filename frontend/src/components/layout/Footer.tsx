import React from "react";
import Link from "next/link";
import { ShieldCheck, Cpu, Database, CheckCircle2, Sparkles, BookOpen } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-200/60 bg-gradient-to-b from-white/60 via-slate-50/50 to-white text-slate-600 text-xs relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-3.5">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1">
                HOUSEPRICE<span className="text-violet-600">.AI</span>
                <span className="relative flex h-2 w-2 ml-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                </span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200/80">
                Production
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              AI-powered property price intelligence platform combining 5-fold cross-validated
              regression ensembles, Split Conformal Prediction intervals, and Tree SHAP local feature attribution.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero fabricated predictions • 1,460-home benchmark</span>
            </div>
          </div>

          {/* ML Architecture */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs tracking-wider uppercase mb-3.5 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-violet-600" />
              ML Architecture
            </h4>
            <ul className="space-y-2 text-slate-500 text-xs">
              <li className="hover:text-slate-900 transition-colors">Voting Regressor (XGB + Cat + LGBM)</li>
              <li className="hover:text-slate-900 transition-colors">Split Conformal (90% & 95% Coverage)</li>
              <li className="hover:text-slate-900 transition-colors">TreeExplainer Local Attribution</li>
              <li className="hover:text-slate-900 transition-colors">Optuna Bayesian Hyperband Tuning</li>
              <li className="hover:text-slate-900 transition-colors">KS-Test Feature Drift Telemetry</li>
            </ul>
          </div>

          {/* Data & Standards */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs tracking-wider uppercase mb-3.5 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-violet-600" />
              Data & Standards
            </h4>
            <ul className="space-y-2 text-slate-500 text-xs">
              <li>
                <Link href="/data-explorer" className="hover:text-violet-600 transition-colors">
                  Ames Housing Data Corpus (1,460 Homes)
                </Link>
              </li>
              <li>
                <Link href="/model-lab" className="hover:text-violet-600 transition-colors">
                  5-Fold Cross Validation Benchmark
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="hover:text-violet-600 transition-colors">
                  Spatial Neighborhood Rankings
                </Link>
              </li>
              <li>
                <Link href="/monitoring" className="hover:text-violet-600 transition-colors">
                  Production Telemetry & Drift
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Methodology */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs tracking-wider uppercase mb-3.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-violet-600" />
              Resources & Methodology
            </h4>
            <ul className="space-y-2 text-slate-500 text-xs">
              <li>
                <Link href="/how-it-works" className="hover:text-violet-600 transition-colors">
                  Methodology & Limitations
                </Link>
              </li>
              <li>
                <Link href="/predict" className="hover:text-violet-600 transition-colors">
                  Interactive Valuation Workspace
                </Link>
              </li>
              <li>
                <Link href="/what-if" className="hover:text-violet-600 transition-colors">
                  What-If Counterfactual Simulator
                </Link>
              </li>
              <li>
                <Link href="/batch" className="hover:text-violet-600 transition-colors">
                  Batch Portfolio CSV Upload
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Responsible AI Disclaimer Banner */}
        <div className="pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-2.5 max-w-3xl">
            <ShieldCheck className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-500 leading-normal">
              <strong>Responsible AI Statement:</strong> Model outputs are statistical property price estimates with
              associated Split Conformal Prediction intervals (approx. 90% empirical coverage on calibration split).
              They do not constitute certified real estate appraisals, home inspections, or guaranteed market valuations.
              Historical housing data reflects residential transactions in Ames, Iowa and does not represent macroeconomic guarantees.
            </p>
          </div>
          <div className="text-[11px] text-slate-400 font-mono shrink-0">
            © 2026 HOUSEPRICE AI • All Models Empirically Validated
          </div>
        </div>
      </div>
    </footer>
  );
}
