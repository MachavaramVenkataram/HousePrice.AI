"use client";

import React, { useState } from "react";
import ReactECharts from "echarts-for-react";
import { ScatterPoint } from "@/types";

interface ResidualChartProps {
  scatterData: ScatterPoint[];
  height?: number;
}

export function ResidualChart({ scatterData, height = 360 }: ResidualChartProps) {
  const [view, setView] = useState<"residuals_vs_fitted" | "histogram">("residuals_vs_fitted");

  if (!scatterData || scatterData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
        No residual data available
      </div>
    );
  }

  // View 1: Residuals vs Fitted
  const fittedVsResidual = scatterData.map((d) => [d.predicted, d.actual - d.predicted, d.neighborhood]);
  const maxFitted = Math.max(...scatterData.map((d) => d.predicted));
  const minFitted = Math.min(...scatterData.map((d) => d.predicted));

  const optionFitted = {
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        if (!params.data) return "";
        const [fitted, resid, neigh] = params.data;
        return `
          <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
            <div style="font-weight: 600; color: #4338ca;">${neigh || "Property"}</div>
            <div>Fitted Price: <strong>$${fitted?.toLocaleString()}</strong></div>
            <div>Residual (Actual - Pred): <strong style="color: ${resid >= 0 ? "#059669" : "#e11d48"}">${resid >= 0 ? "+" : ""}$${resid?.toLocaleString()}</strong></div>
          </div>
        `;
      },
    },
    grid: {
      left: "8%",
      right: "6%",
      bottom: "12%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      name: "Fitted (Predicted) Price ($)",
      nameLocation: "middle",
      nameGap: 30,
      axisLabel: {
        formatter: (v: number) => `$${(v / 1000).toFixed(0)}k`,
        color: "#64748b",
      },
      splitLine: { lineStyle: { color: "#f1f5f9" } },
    },
    yAxis: {
      type: "value",
      name: "Residual ($)",
      nameLocation: "middle",
      nameGap: 40,
      axisLabel: {
        formatter: (v: number) => `$${(v / 1000).toFixed(0)}k`,
        color: "#64748b",
      },
      splitLine: { lineStyle: { color: "#f1f5f9" } },
    },
    series: [
      {
        name: "Zero Line",
        type: "line",
        data: [
          [minFitted, 0],
          [maxFitted, 0],
        ],
        lineStyle: { color: "#f43f5e", width: 1.5, type: "dashed" },
        symbol: "none",
        silent: true,
      },
      {
        name: "Residuals",
        type: "scatter",
        data: fittedVsResidual,
        symbolSize: 6,
        itemStyle: {
          color: "#8b5cf6",
          opacity: 0.65,
        },
      },
    ],
  };

  // View 2: Histogram of residuals
  const residuals = scatterData.map((d) => d.actual - d.predicted);
  const binCount = 20;
  const minRes = Math.min(...residuals);
  const maxRes = Math.max(...residuals);
  const binWidth = (maxRes - minRes) / binCount;

  const bins = Array.from({ length: binCount }, () => 0);
  residuals.forEach((r) => {
    const idx = Math.min(Math.floor((r - minRes) / binWidth), binCount - 1);
    bins[idx]++;
  });

  const binLabels = Array.from({ length: binCount }, (_, i) => {
    const center = minRes + (i + 0.5) * binWidth;
    return `$${(center / 1000).toFixed(0)}k`;
  });

  const optionHist = {
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const item = params[0];
        return `Residual Range Center: ${item.name}<br/>Count: <strong>${item.value}</strong> homes`;
      },
    },
    grid: {
      left: "6%",
      right: "6%",
      bottom: "14%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: binLabels,
      axisLabel: { rotate: 35, color: "#64748b", fontSize: 10 },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      name: "Frequency",
      axisLabel: { color: "#64748b" },
      splitLine: { lineStyle: { color: "#f1f5f9" } },
    },
    series: [
      {
        name: "Residuals Count",
        type: "bar",
        data: bins,
        itemStyle: {
          color: "#a78bfa",
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-semibold text-slate-700">
          {view === "residuals_vs_fitted" ? "Residuals vs. Fitted Values" : "Residual Error Distribution"}
        </span>
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => setView("residuals_vs_fitted")}
            className={`px-2.5 py-1 text-[11px] rounded font-medium transition-all ${
              view === "residuals_vs_fitted" ? "bg-white text-violet-700 shadow-2xs font-semibold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Fitted vs Residuals
          </button>
          <button
            onClick={() => setView("histogram")}
            className={`px-2.5 py-1 text-[11px] rounded font-medium transition-all ${
              view === "histogram" ? "bg-white text-violet-700 shadow-2xs font-semibold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Histogram
          </button>
        </div>
      </div>
      <ReactECharts
        option={view === "residuals_vs_fitted" ? optionFitted : optionHist}
        style={{ height: `${height}px`, width: "100%" }}
      />
    </div>
  );
}
