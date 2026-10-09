"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import { SensitivityPoint } from "@/types";

interface SensitivityChartProps {
  points: SensitivityPoint[];
  featureName: string;
  height?: number;
}

export function SensitivityChart({ points, featureName, height = 360 }: SensitivityChartProps) {
  if (!points || points.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
        No sensitivity curve generated
      </div>
    );
  }

  const xAxisData = points.map((p) => p.feature_value);
  const seriesData = points.map((p) => p.predicted_price);

  const option = {
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const item = params[0];
        return `
          <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
            <div style="font-weight: 600; color: #4338ca;">${featureName}: ${item.name}</div>
            <div>Model Estimate: <strong>$${item.value?.toLocaleString()}</strong></div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
              All other features held constant (ceteris paribus)
            </div>
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
      type: "category",
      data: xAxisData,
      name: featureName,
      nameLocation: "middle",
      nameGap: 30,
      axisLabel: { color: "#64748b", fontSize: 11 },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      name: "Estimated Price ($)",
      nameLocation: "middle",
      nameGap: 45,
      axisLabel: {
        formatter: (v: number) => `$${(v / 1000).toFixed(0)}k`,
        color: "#64748b",
      },
      splitLine: { lineStyle: { color: "#f1f5f9" } },
    },
    series: [
      {
        name: "Model Sensitivity",
        type: "line",
        smooth: true,
        data: seriesData,
        lineStyle: {
          color: "#7c3aed",
          width: 3,
        },
        itemStyle: {
          color: "#7c3aed",
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(124, 58, 237, 0.25)" },
              { offset: 1, color: "rgba(124, 58, 237, 0.0)" },
            ],
          },
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} />;
}
