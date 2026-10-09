"use client";

import React, { useState } from "react";
import {
  Database,
  Cpu,
  Layers,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  SlidersHorizontal,
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Brain,
  Sparkles,
  BarChart3,
  Scale,
  LineChart,
  BookOpen,
} from "lucide-react";
import { EducationalUncertaintyPanel } from "@/components/uncertainty/EducationalUncertaintyPanel";
import { PageTransition, GlassCard, GlassBadge } from "@/components/ui";

interface TimelineStep {
  number: number;
  icon: any;
  title: string;
  summary: string;
  details: React.ReactNode;
}

export default function HowItWorksPage() {
  const [expandedSteps, setExpandedSteps] = useState<{ [key: number]: boolean }>({
    1: true,
    6: true,
    9: true,
  });

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  const steps: TimelineStep[] = [
    {
      number: 1,
      icon: Database,
      title: "1. Data Acquisition & Integrity",
      summary: "1,460 residential properties from the Ames, Iowa Housing Dataset evaluated across 81 structural and spatial attributes.",
      details: (
        <div className="space-y-2 text-xs text-slate-600">
          <p>
            The training foundation is the Ames Housing Dataset compiled by Dean De Cock. It features genuine real estate transactions between 2006 and 2010.
          </p>
          <div className="p-3.5 rounded-xl bg-white/70 border border-slate-200/60 font-mono text-[11px] space-y-1">
            <div>• Sample Size: 1,460 residential single-family and townhome transactions</div>
            <div>• Dimensionality: 81 features (38 continuous/discrete numeric, 43 categorical)</div>
            <div>• Target Variable: SalePrice (untransformed mean: $180,921, std: $79,442)</div>
            <div>• Integrity: Zero synthetic generation; 0 duplicate entries verified</div>
          </div>
        </div>
      ),
    },
    {
      number: 2,
      icon: Sparkles,
      title: "2. Domain-Specific Feature Engineering",
      summary: "Synthesizing composite domain features including TotalSF, TotalBath, HouseAge, RemodelAge, and OverallScore.",
      details: (
        <div className="space-y-2 text-xs text-slate-600">
          <p>
            Raw real estate columns are enriched through valuation domain transformations to capture holistic property scale:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-[11px]">
            <div className="p-3 rounded-xl bg-white/70 border border-slate-200/60">
              <span className="font-bold font-sans text-violet-700">TotalSF:</span>
              <div className="text-slate-600">GrLivArea + TotalBsmtSF</div>
            </div>
            <div className="p-3 rounded-xl bg-white/70 border border-slate-200/60">
              <span className="font-bold font-sans text-violet-700">TotalBath:</span>
              <div className="text-slate-600">FullBath + 0.5×HalfBath + BsmtFullBath + 0.5×BsmtHalfBath</div>
            </div>
            <div className="p-3 rounded-xl bg-white/70 border border-slate-200/60">
              <span className="font-bold font-sans text-violet-700">PropertyAge:</span>
              <div className="text-slate-600">YrSold - YearBuilt</div>
            </div>
            <div className="p-3 rounded-xl bg-white/70 border border-slate-200/60">
              <span className="font-bold font-sans text-violet-700">OverallScore:</span>
              <div className="text-slate-600">OverallQual × OverallCond</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      number: 3,
      icon: Layers,
      title: "3. Preprocessing & Leakage Elimination",
      summary: "Scikit-learn ColumnTransformer strictly fitted inside training folds with log1p target transformation.",
      details: (
        <div className="space-y-2 text-xs text-slate-600">
          <p>
            To prevent test set contamination and target leakage:
          </p>
          <ul className="space-y-1.5 list-disc pl-5 leading-relaxed">
            <li><strong>Numerical Imputation:</strong> Median imputer fitted strictly on training splits.</li>
            <li><strong>Categorical Encoding:</strong> One-Hot Encoding with <code className="bg-white/80 px-1 py-0.5 rounded font-mono border">handle_unknown=&apos;ignore&apos;</code> for rare categories.</li>
            <li><strong>Target Normalization:</strong> Raw price skewness of +1.88 is stabilized using <code className="bg-white/80 px-1 py-0.5 rounded font-mono border">np.log1p</code> during optimization, inverted via <code className="bg-white/80 px-1 py-0.5 rounded font-mono border">np.expm1</code>.</li>
          </ul>
        </div>
      ),
    },
    {
      number: 4,
      icon: Brain,
      title: "4. Multi-Model Cross-Validation",
      summary: "Benchmarking 10 diverse regression models using 5-fold cross validation on identical training folds.",
      details: (
        <div className="space-y-2 text-xs text-slate-600">
          <p>
            Every candidate model is evaluated on identical 5-fold cross-validation splits:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
            <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/60">Linear Regression</div>
            <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/60">Ridge & Lasso</div>
            <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/60">ElasticNet</div>
            <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/60">Random Forest</div>
            <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/60">XGBoost & LightGBM</div>
            <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/60">CatBoost & Ensemble</div>
          </div>
        </div>
      ),
    },
    {
      number: 5,
      icon: Scale,
      title: "5. Empirical Model Selection Criterion",
      summary: "Voting Ensemble selected based on lowest 5-fold cross-validation RMSE ($27,210.21) vs. Linear Regression baseline.",
      details: (
        <div className="space-y-2 text-xs text-slate-600">
          <p>
            The production candidate was selected using a predefined quantitative selection rule:
          </p>
          <div className="p-3.5 rounded-xl bg-violet-50/60 border border-violet-200/60 text-slate-700 leading-relaxed">
            <strong>Selection Rule:</strong> Lowest validation RMSE across held-out folds. Voting Ensemble achieved $27,210.21 ± $4,642.64, significantly outperforming the academic Linear Regression baseline ($53,885.44) and standard tree models.
          </div>
        </div>
      ),
    },
    {
      number: 6,
      icon: ShieldCheck,
      title: "6. Split Conformal Uncertainty Estimation",
      summary: "Distribution-free prediction intervals calibrated on held-out data with finite-sample empirical coverage guarantee.",
      details: (
        <div className="space-y-4 text-xs text-slate-600">
          <p>
            Rather than fabricating arbitrary percentage ranges, HOUSEPRICE AI uses Inductive Split Conformal Prediction:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white/70 border border-slate-200/60 rounded-xl">
              <div className="font-bold text-violet-700">1. Train Split (60%)</div>
              <div className="text-[11px] text-slate-500 mt-1">876 properties used exclusively for model parameter fitting.</div>
            </div>
            <div className="p-3 bg-white/70 border border-slate-200/60 rounded-xl">
              <div className="font-bold text-cyan-700">2. Calibration Split (20%)</div>
              <div className="text-[11px] text-slate-500 mt-1">292 held-out properties used solely to calculate nonconformity scores: s_i = |y_i - ŷ_i|.</div>
            </div>
            <div className="p-3 bg-white/70 border border-slate-200/60 rounded-xl">
              <div className="font-bold text-emerald-700">3. Test Split (20%)</div>
              <div className="text-[11px] text-slate-500 mt-1">292 evaluation properties used to measure empirical test coverage.</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-200/70 font-mono text-[11px] space-y-1 text-cyan-950">
            <div>Nonconformity score: s_i = | y_i - ŷ_i |</div>
            <div>Calibrated quantile index: p = min(1.0, ceil((n + 1) * (1 - α)) / n)</div>
            <div>Prediction margin: q_(1-α) = Quantile(p, &#123;s_1, ..., s_n&#125;)</div>
            <div>Prediction interval: C(X) = [ max(0, ŷ - q_(1-α)), ŷ + q_(1-α) ]</div>
          </div>

          {/* Integrated Educational Accordion */}
          <div className="pt-2">
            <EducationalUncertaintyPanel />
          </div>
        </div>
      ),
    },
    {
      number: 7,
      icon: Cpu,
      title: "7. Explainability via Tree SHAP",
      summary: "Decomposing model predictions into individual feature contributions grounded in cooperative game theory.",
      details: (
        <div className="space-y-2 text-xs text-slate-600">
          <p>
            For every prediction, we generate Shapley Additive Explanations (SHAP) decomposing the output into additive feature shifts relative to the expected base value:
          </p>
          <div className="p-3.5 rounded-xl bg-white/70 border border-slate-200/60 leading-relaxed">
            <strong>Causality Disclaimer:</strong> SHAP values explain how the algorithm computed its estimate across historical statistical associations. They do not constitute economic causation or guarantee that modifying a property will recoup an exact dollar amount.
          </div>
        </div>
      ),
    },
    {
      number: 8,
      icon: Activity,
      title: "8. Continuous Drift & Telemetry Monitoring",
      summary: "Live inference volume tracking, latency profiling, and Kolmogorov-Smirnov 2-sample feature drift tests.",
      details: (
        <div className="space-y-2 text-xs text-slate-600">
          <p>
            MLOps observability continuously records inference latency, user feedback sentiment, and continuous feature stability:
          </p>
          <div className="p-3.5 rounded-xl bg-white/70 border border-slate-200/60 leading-relaxed font-mono text-[11px]">
            <div>• Automated 2-sample Kolmogorov-Smirnov tests across continuous features</div>
            <div>• Real-time logging to SQLite with log ID traceability</div>
            <div>• Latency threshold alerts & zero synthetic ground-truth fabrication policy</div>
          </div>
        </div>
      ),
    },
    {
      number: 9,
      icon: AlertTriangle,
      title: "9. Responsible AI & Explicit Model Limitations",
      summary: "Transparent documentation of geographical boundaries, unmeasured factors, and non-appraisal disclaimer.",
      details: (
        <div className="space-y-3 text-xs text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-white/80 rounded-xl border border-slate-200/60 space-y-1">
              <strong className="text-violet-900 font-bold">1. Prediction Uncertainty</strong>
              <p className="text-[11px] text-slate-600">
                Machine learning models output statistical approximations. Realized property transactions may fall outside point estimates due to unobserved factors.
              </p>
            </div>
            <div className="p-3.5 bg-white/80 rounded-xl border border-slate-200/60 space-y-1">
              <strong className="text-violet-900 font-bold">2. Dataset Limitations</strong>
              <p className="text-[11px] text-slate-600">
                Trained exclusively on 2006–2010 Ames, Iowa transactions. Not generalizable to high-density coastal metro markets without local fine-tuning.
              </p>
            </div>
            <div className="p-3.5 bg-white/80 rounded-xl border border-slate-200/60 space-y-1">
              <strong className="text-violet-900 font-bold">3. Distribution Shift</strong>
              <p className="text-[11px] text-slate-600">
                Extreme luxury properties or non-standard architectures can produce out-of-distribution inputs that widen prediction uncertainty.
              </p>
            </div>
            <div className="p-3.5 bg-white/80 rounded-xl border border-slate-200/60 space-y-1">
              <strong className="text-violet-900 font-bold">4. Market Differences & Macroeconomics</strong>
              <p className="text-[11px] text-slate-600">
                Historical sale price distributions do not automatically incorporate sudden Federal Reserve mortgage interest rate shifts or inflation spikes.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-violet-50/80 border border-violet-200/60 text-violet-950 text-xs leading-relaxed shadow-2xs">
            <strong>Statutory Disclaimer:</strong> This platform is an educational and decision-support analytical product.
            Estimates provided by HOUSEPRICE AI do not constitute certified professional property appraisals under Uniform Standards of Professional Appraisal Practice (USPAP) or binding financial guarantees.
          </div>
        </div>
      ),
    },
  ];

  return (
    <PageTransition className="space-y-10 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="border-b border-slate-200/60 pb-7">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-violet-100/70 text-violet-800 border border-violet-200/60 shadow-2xs mb-2">
          <BookOpen className="w-3.5 h-3.5 text-violet-600" />
          <span>System Architecture & Theoretical Foundations</span>
        </div>
        <h1 className="text-2xl sm:text-3.5xl font-extrabold text-slate-900 tracking-tight">
          How the System Works
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-2xl font-medium">
          A step-by-step &ldquo;ML Story&rdquo; tracing the data science lifecycle from raw Ames housing records to split conformal uncertainty calibration and responsible AI governance.
        </p>
      </div>

      {/* Visual Vertical Timeline (Req 47) */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-violet-200/70 space-y-8">
        {steps.map((step) => {
          const Icon = step.icon;
          const isExpanded = !!expandedSteps[step.number];

          return (
            <div key={step.number} className="relative group">
              {/* Timeline marker */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-violet-500 text-violet-700 flex items-center justify-center font-bold text-xs shadow-md shadow-violet-500/10">
                {step.number}
              </div>

              {/* Step Card */}
              <GlassCard
                variant="elevated"
                padding="md"
                className="space-y-3 transition-all rounded-3xl bg-white/90"
              >
                <button
                  type="button"
                  onClick={() => toggleStep(step.number)}
                  className="w-full flex items-start justify-between text-left cursor-pointer"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-violet-50/80 text-violet-600 flex items-center justify-center border border-violet-200/60 shrink-0 shadow-2xs mt-0.5">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">{step.title}</h2>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.summary}</p>
                    </div>
                  </div>

                  <div className="text-slate-400 p-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="pt-3 border-t border-slate-200/50">
                    {step.details}
                  </div>
                )}
              </GlassCard>
            </div>
          );
        })}
      </div>
    </PageTransition>
  );
}
