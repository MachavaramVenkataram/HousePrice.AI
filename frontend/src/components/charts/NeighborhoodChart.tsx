"use client";

import React, { useState } from "react";
import ReactECharts from "echarts-for-react";
import { LocationSummary } from "@/types";

interface NeighborhoodChartProps {
  locations: LocationSummary[];
  height?: number;
}

export function NeighborhoodChart({ locations, height = 440 }: NeighborhoodChartProps) {
  const [metric, setMetric] = useState<"median_price" | "mean_price" | "count">("median_price");

  if (!locations || locations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
        No location analytics available
      </div>
    );
  }

  // Sort by selected metric descending
  const sorted = [...locations].sort((a, b) => (b[metric] as number) - (a[metric] as number));
  const categories = sorted.map((l) => l.neighborhood).reverse();
  const values = sorted.map((l) => l[metric]).reverse();

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: any) => {
        const item = params[0];
        const loc = sorted.find((l) => l.neighborhood === item.name);
        if (!loc) return "";
        return `
          <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
            <div style="font-weight: 600; color: #4338ca;">${loc.neighborhood}</div>
            <div>Homes Sampled: <strong>${loc.count}</strong></div>
            <div>Median Price: <strong>$${loc.median_price.toLocaleString()}</strong></div>
            <div>Mean Price: <strong>$${loc.mean_price.toLocaleString()}</strong></div>
            <div>Price Range: <strong>$${loc.min_price.toLocaleString()} — $${loc.max_price.toLocaleString()}</strong></div>
          </div>
        `;
      },
    },
    grid: {
      left: "4%",
      right: "8%",
      bottom: "6%",
      top: "4%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      axisLabel: {
        formatter: (v: number) => (metric === "count" ? `${v}` : `$${(v / 1000).toFixed(0)}k`),
        color: "#64748b",
      },
      splitLine: { lineStyle: { color: "#f1f5f9" } },
    },
    yAxis: {
      type: "category",
      data: categories,
      axisLabel: { color: "#334155", fontSize: 11 },
      splitLine: { show: false },
    },
    series: [
      {
        name: metric === "count" ? "Transactions" : "Price",
        type: "bar",
        data: values,
        itemStyle: {
          color: metric === "count" ? "#06b6d4" : "#8b5cf6",
          borderRadius: [0, 4, 4, 0],
        },
        label: {
          show: true,
          position: "right",
          formatter: (params: any) =>
            metric === "count" ? `${params.value}` : `$${(params.value / 1000).toFixed(0)}k`,
          fontSize: 10,
          color: "#64748b",
        },
      },
    ],
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-semibold text-slate-700">Ames Neighborhood Valuation Rankings</span>
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => setMetric("median_price")}
            className={`px-2.5 py-1 text-[11px] rounded font-medium transition-all ${
              metric === "median_price" ? "bg-white text-violet-700 shadow-2xs font-semibold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Median Price
          </button>
          <button
            onClick={() => setMetric("mean_price")}
            className={`px-2.5 py-1 text-[11px] rounded font-medium transition-all ${
              metric === "mean_price" ? "bg-white text-violet-700 shadow-2xs font-semibold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Mean Price
          </button>
          <button
            onClick={() => setMetric("count")}
            className={`px-2.5 py-1 text-[11px] rounded font-medium transition-all ${
              metric === "count" ? "bg-white text-violet-700 shadow-2xs font-semibold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Sample Size
          </button>
        </div>
      </div>
      <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} />
    </div>
  );
}
