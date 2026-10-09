"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import { FeatureContribution } from "@/types";

interface WaterfallChartProps {
  explanations: FeatureContribution[];
  height?: number;
}

export function WaterfallChart({ explanations, height = 360 }: WaterfallChartProps) {
  if (!explanations || explanations.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
        No local SHAP explanations available
      </div>
    );
  }

  // Display top 10 impactful features sorted from highest impact to lowest
  const displayFeatures = explanations.slice(0, 10).reverse();

  const categories = displayFeatures.map((f) => f.label || f.feature);
  const values = displayFeatures.map((f) => Math.round(f.impact));

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: any) => {
        const item = params[0];
        const feat = displayFeatures[item.dataIndex];
        const isPos = item.value >= 0;
        return `
          <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
            <div style="font-weight: 600; color: #1e293b;">${feat.label || feat.feature}</div>
            <div>Model Contribution: <strong style="color: ${isPos ? "#059669" : "#e11d48"}">${isPos ? "+" : ""}$${item.value?.toLocaleString()}</strong></div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              ${isPos ? "↑ Pushes model estimate above baseline" : "↓ Drags model estimate below baseline"}
            </div>
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
      name: "SHAP Impact ($)",
      nameLocation: "middle",
      nameGap: 24,
      axisLabel: {
        formatter: (v: number) => `$${(v / 1000).toFixed(0)}k`,
        color: "#64748b",
      },
      splitLine: { lineStyle: { color: "#f1f5f9" } },
    },
    yAxis: {
      type: "category",
      data: categories,
      axisLabel: {
        color: "#334155",
        fontWeight: "500",
        fontSize: 11,
      },
      splitLine: { show: false },
    },
    series: [
      {
        name: "SHAP Value",
        type: "bar",
        data: values.map((val) => ({
          value: val,
          itemStyle: {
            color: val >= 0 ? "#10b981" : "#f43f5e", // emerald for positive, rose for negative
            borderRadius: val >= 0 ? [0, 4, 4, 0] : [4, 0, 0, 4],
          },
        })),
        label: {
          show: true,
          position: "right",
          formatter: (params: any) => `${params.value >= 0 ? "+" : ""}$${(params.value / 1000).toFixed(1)}k`,
          fontSize: 10,
          color: "#475569",
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} />;
}
