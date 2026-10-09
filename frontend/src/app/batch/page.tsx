"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  FileSpreadsheet,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FileText,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  Sparkles,
  Zap,
  Clock,
  Building,
} from "lucide-react";
import { normalizeModelInfo } from "@/types";
import {
  PageTransition,
  GlassCard,
  GlassButton,
  GlassBadge,
  AnimatedNumber,
  StatusIndicator,
} from "@/components/ui";

const PROCESSING_STAGES = [
  "VALIDATING SCHEMA",
  "CHECKING FEATURES",
  "RUNNING INFERENCE",
  "CALCULATING INTERVALS",
  "GENERATING RESULTS",
];

export default function BatchPage() {
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeStageIdx, setActiveStageIdx] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const batchMutation = useMutation({
    mutationFn: async (uploadFile: File) => {
      setErrorMsg(null);
      setActiveStageIdx(0);

      // Simulate sequential progress stages for feedback
      const interval = setInterval(() => {
        setActiveStageIdx((prev) => (prev < 4 ? prev + 1 : prev));
      }, 700);

      try {
        const formData = new FormData();
        formData.append("file", uploadFile);

        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001/api/v1";
        const res = await fetch(`${API_BASE}/predict/batch`, {
          method: "POST",
          body: formData,
        });

        clearInterval(interval);
        setActiveStageIdx(4);

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ detail: res.statusText }));
          throw new Error(errorData.detail || "Batch processing failed.");
        }

        return res.json();
      } catch (e) {
        clearInterval(interval);
        throw e;
      }
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "An unexpected error occurred during batch inference.");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile);
        setErrorMsg(null);
      } else {
        setErrorMsg("Please upload a valid CSV file (.csv).");
      }
    }
  };

  const handleDownloadSampleCsv = () => {
    const csvContent =
      "GrLivArea,TotalBsmtSF,1stFlrSF,2ndFlrSF,YearBuilt,YearRemodAdd,OverallQual,OverallCond,FullBath,HalfBath,BsmtFullBath,BedroomAbvGr,TotRmsAbvGrd,Fireplaces,GarageCars,GarageArea,LotArea,LotFrontage,WoodDeckSF,OpenPorchSF,MoSold,YrSold,Neighborhood,BldgType,HouseStyle,MSZoning,KitchenQual,BsmtQual,HeatingQC,CentralAir,GarageType,SaleCondition\n" +
      "1710,856,856,854,2003,2003,7,5,2,1,1,3,8,0,2,548,8450,65,0,61,2,2008,CollgCr,1Fam,2Story,RL,Gd,Gd,Ex,Y,Attchd,Normal\n" +
      "1262,1262,1262,0,1976,1976,6,8,2,0,0,3,6,1,2,460,9600,80,298,0,5,2007,Veenker,1Fam,1Story,RL,TA,Gd,Ex,Y,Attchd,Normal\n" +
      "1786,920,920,866,2001,2002,7,5,2,1,1,3,6,1,2,608,11250,68,0,42,9,2008,CollgCr,1Fam,2Story,RL,Gd,Gd,Ex,Y,Attchd,Normal";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ames_housing_batch_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const batchData = batchMutation.data;

  const handleDownloadEnrichedCsv = () => {
    if (!batchData?.results) return;

    const items = batchData.results;
    const headers = [
      "row_index",
      "predicted_price",
      "conformal_lower_bound",
      "conformal_upper_bound",
      "model_version",
      "GrLivArea",
      "OverallQual",
      "YearBuilt",
      "Neighborhood",
    ];

    const rows = items.map((r: any) => [
      r.row_index,
      Math.round(r.predicted_price),
      Math.round(r.lower_bound),
      Math.round(r.upper_bound),
      r.model_version,
      r.features.GrLivArea || "",
      r.features.OverallQual || "",
      r.features.YearBuilt || "",
      r.features.Neighborhood || "",
    ]);

    const csvStr = [headers.join(","), ...rows.map((row: any[]) => row.join(","))].join("\n");
    const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `enriched_estimates_batch_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute portfolio summary metrics
  const portfolioAvg = batchData?.results?.length
    ? Math.round(
        batchData.results.reduce((acc: number, curr: any) => acc + curr.predicted_price, 0) /
          batchData.results.length
      )
    : 0;

  return (
    <PageTransition>
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
        {/* Header with Violet + Sky Accent */}
        <div className="border-b border-slate-200/60 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-sky-50/80 text-sky-700 border border-sky-200/60 shadow-2xs mb-2">
              <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600" />
              <span>High-Throughput Portfolio Inference</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              BATCH ESTIMATION
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl font-medium">
              Upload multi-property CSV datasets to execute batch machine-learning inference,
              calculate conformal prediction intervals (90% coverage), and download enriched outputs.
            </p>
          </div>

          <GlassButton
            variant="outline"
            size="sm"
            onClick={handleDownloadSampleCsv}
            icon={<FileText className="w-4 h-4 text-sky-600" />}
          >
            Download CSV Template
          </GlassButton>
        </div>

        {/* Large Liquid Glass Upload Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`relative p-8 sm:p-14 text-center rounded-3xl transition-all duration-300 overflow-hidden ${
            isDragOver
              ? "bg-sky-50/50 border-2 border-sky-500 shadow-xl shadow-sky-500/10 scale-[1.005]"
              : "glass-panel-elevated border-2 border-slate-200/80 hover:border-sky-300/80"
          }`}
        >
          {/* Subtle scanning corners when drag over */}
          {isDragOver && (
            <>
              <span className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-sky-500 rounded-tl-md" />
              <span className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-sky-500 rounded-tr-md" />
              <span className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-sky-500 rounded-bl-md" />
              <span className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-sky-500 rounded-br-md" />
            </>
          )}

          {/* Animated Upload Icon */}
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto border border-sky-200/70 shadow-xs mb-4">
            <Upload className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-1.5 max-w-lg mx-auto">
            <h2 className="text-lg font-bold text-slate-900">UPLOAD PROPERTY PORTFOLIO CSV</h2>
            <p className="text-xs text-slate-500 font-medium">
              Drag & drop your property portfolio spreadsheet here, or select a file from your device.
              Columns will be validated against the Ames housing schema automatically.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 pt-6">
            <input
              type="file"
              accept=".csv"
              id="csv-upload"
              onChange={handleFileChange}
              className="hidden"
            />

            {!file ? (
              <label
                htmlFor="csv-upload"
                className="px-6 py-3 rounded-xl bg-white/80 border border-slate-200 hover:border-sky-400 text-xs font-bold text-slate-800 hover:text-sky-700 cursor-pointer shadow-xs hover:shadow-md transition-all inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Select CSV File</span>
              </label>
            ) : (
              /* Selected File Card */
              <div className="w-full max-w-md p-4 rounded-2xl bg-white/90 border border-sky-200/80 shadow-md flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-900 truncate">{file.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {(file.size / 1024).toFixed(1)} KB • CSV Format
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setFile(null);
                      setErrorMsg(null);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <GlassButton
                    variant="primary"
                    size="sm"
                    onClick={() => batchMutation.mutate(file)}
                    isLoading={batchMutation.isPending}
                    icon={<Sparkles className="w-3.5 h-3.5" />}
                  >
                    Run Batch Inference
                  </GlassButton>
                </div>
              </div>
            )}
          </div>

          {/* Sequential Pipeline Execution Stages */}
          {batchMutation.isPending && (
            <div className="pt-8 max-w-2xl mx-auto space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-sky-700 flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Automated Batch Pipeline Execution</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {PROCESSING_STAGES.map((stage, idx) => (
                  <div
                    key={stage}
                    className={`p-2.5 rounded-xl text-[10px] font-bold text-center border transition-all ${
                      idx < activeStageIdx
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : idx === activeStageIdx
                        ? "bg-sky-600 text-white border-sky-600 shadow-md animate-pulse"
                        : "bg-white/60 text-slate-400 border-slate-200/60"
                    }`}
                  >
                    <div className="truncate">{stage}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mt-6 p-4 rounded-2xl bg-rose-50/80 border border-rose-200 text-xs text-rose-800 max-w-md mx-auto flex items-start gap-2.5 text-left shadow-2xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>Schema Validation Notice:</strong> {errorMsg}
              </div>
            </div>
          )}
        </div>

        {/* Batch Results Surface */}
        {batchData && (
          <GlassCard variant="elevated" className="p-6 sm:p-8 space-y-6">
            {/* Completion Banner & Metrics */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Batch Estimation Complete</span>
                  <GlassBadge variant="mint" size="sm">
                    {batchData.total_processed} Properties
                  </GlassBadge>
                </h3>
                {(() => {
                  const modelInfo = normalizeModelInfo(batchData.model, "Voting Ensemble", "v1.0.0");
                  return (
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Model: {modelInfo.name}
                      {modelInfo.version && ` (${modelInfo.version})`} • Execution Time:{" "}
                      {batchData.execution_time_sec ? batchData.execution_time_sec.toFixed(2) : "0.00"}s
                    </p>
                  );
                })()}
              </div>

              <GlassButton
                variant="mint"
                size="md"
                onClick={handleDownloadEnrichedCsv}
                icon={<Download className="w-4 h-4" />}
              >
                Download Enriched CSV
              </GlassButton>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/70">
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Evaluated</div>
                <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                  <AnimatedNumber value={batchData.total_processed} /> Properties
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/70">
                <div className="text-[10px] uppercase font-bold text-slate-400">Mean Portfolio Estimate</div>
                <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                  $<AnimatedNumber value={portfolioAvg} />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/70">
                <div className="text-[10px] uppercase font-bold text-slate-400">Execution Speed</div>
                <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                  {batchData.execution_time_sec ? batchData.execution_time_sec.toFixed(2) : "0.00"}s
                </div>
              </div>
            </div>

            {/* Preview Data Grid */}
            <div className="overflow-x-auto border border-slate-200/70 rounded-2xl glass-panel">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-white/60 border-b border-slate-200/70 text-slate-400 font-bold uppercase text-[10px] tracking-wider font-sans">
                    <th className="py-3 px-3.5">Row #</th>
                    <th className="py-3 px-3.5">Estimated Property Value</th>
                    <th className="py-3 px-3.5">Model Prediction Interval</th>
                    <th className="py-3 px-3.5">Living Area</th>
                    <th className="py-3 px-3.5">Quality</th>
                    <th className="py-3 px-3.5">Year Built</th>
                    <th className="py-3 px-3.5 font-sans">Neighborhood</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batchData.results.slice(0, 15).map((r: any) => (
                    <tr key={r.row_index} className="hover:bg-sky-50/20 transition-colors">
                      <td className="py-3 px-3.5 font-bold text-slate-700">#{r.row_index}</td>
                      <td className="py-3 px-3.5 font-black text-sky-950">
                        ${Math.round(r.predicted_price).toLocaleString()}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">
                        ${Math.round(r.lower_bound).toLocaleString()} — ${Math.round(r.upper_bound).toLocaleString()}
                      </td>
                      <td className="py-3 px-3.5 text-slate-700">{r.features.GrLivArea || "—"} sqft</td>
                      <td className="py-3 px-3.5 text-slate-700">{r.features.OverallQual || "—"}/10</td>
                      <td className="py-3 px-3.5 text-slate-700">{r.features.YearBuilt || "—"}</td>
                      <td className="py-3 px-3.5 font-sans text-slate-700">{r.features.Neighborhood || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Statistical Notice */}
            <div className="p-4 rounded-2xl glass-panel text-[11px] text-slate-500 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <strong>Statistical Notice:</strong> These outputs are statistical machine learning estimates derived from historical Ames housing distributions.
                They do not constitute professional real estate appraisals or guaranteed closing prices.
              </span>
            </div>
          </GlassCard>
        )}
      </div>
    </PageTransition>
  );
}
