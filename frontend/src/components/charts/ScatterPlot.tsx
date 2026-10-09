"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import { ScatterPoint } from "@/types";

interface ScatterPlotProps {
  data: ScatterPoint[];
  title?: string;
  height?: number;
}

export function ScatterPlot({ data, title = "Predicted vs. Actual Sale Price", height = 400 }: ScatterPlotProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
        No scatter data available
      </div>
    );
  }

  // Calculate min & max for 45-degree diagonal
  const maxVal = Math.max(...data.map((d) => Math.max(d.actual, d.predicted)));
  const minVal = Math.min(...data.map((d) => Math.min(d.actual, d.predicted)));

  const seriesData = data.map((d) => [
    d.actual,
    d.predicted,
    d.abs_error_pct,
    d.neighborhood,
    d.gr_liv_area,
  ]);

  const option = {
    title: {
      text: title,
      left: "center",
      textStyle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1e293b",
      },
    },
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        if (!params.data) return "";
        const [actual, pred, errPct, neigh, sf] = params.data;
        return `
          <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
            <div style="font-weight: 600; margin-bottom: 4px; color: #4338ca;">${neigh || "Property"} (${sf} sq ft)</div>
            <div>Actual Price: <strong>$${actual?.toLocaleString()}</strong></div>
            <div>Predicted Price: <strong>$${pred?.toLocaleString()}</strong></div>
            <div>Error: <strong style="color: ${pred > actual ? "#e11d48" : "#059669"}">${pred - actual > 0 ? "+" : ""}$${(pred - actual)?.toLocaleString()} (${errPct?.toFixed(1)}%)</strong></div>
          </div>
        `;
      },
    },
    grid: {
      left: "8%",
      right: "6%",
      bottom: "12%",
      top: "14%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      name: "Actual Price ($)",
      nameLocation: "middle",
      nameGap: 30,
      min: Math.floor(minVal / 50000) * 50000,
      max: Math.ceil(maxVal / 50000) * 50000,
      axisLabel: {
        formatter: (v: number) => `$${(v / 1000).toFixed(0)}k`,
        color: "#64748b",
      },
      splitLine: { lineStyle: { color: "#f1f5f9" } },
    },
    yAxis: {
      type: "value",
      name: "Predicted Price ($)",
      nameLocation: "middle",
      nameGap: 45,
      min: Math.floor(minVal / 50000) * 50000,
      max: Math.ceil(maxVal / 50000) * 50000,
      axisLabel: {
        formatter: (v: number) => `$${(v / 1000).toFixed(0)}k`,
        color: "#64748b",
      },
      splitLine: { lineStyle: { color: "#f1f5f9" } },
    },
    series: [
      {
        name: "Diagonal (Ideal)",
        type: "line",
        data: [
          [minVal, minVal],
          [maxVal, maxVal],
        ],
        lineStyle: {
          color: "#94a3b8",
          type: "dashed",
          width: 1.5,
        },
        symbol: "none",
        silent: true,
      },
      {
        name: "Test Predictions",
        type: "scatter",
        data: seriesData,
        symbolSize: 7,
        itemStyle: {
          color: (params: any) => {
            const err = params.data[2];
            if (err > 20) return "#f43f5e"; // rose for high error
            if (err > 10) return "#fbbf24"; // amber for moderate
            return "#8b5cf6"; // violet for accurate
          },
          opacity: 0.75,
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} />;
}
