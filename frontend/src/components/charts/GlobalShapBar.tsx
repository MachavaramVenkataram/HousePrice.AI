"use client";

import React from "react";
import ReactECharts from "echarts-for-react";

interface GlobalShapBarProps {
  data: Array<{ feature: string; importance: number }>;
  height?: number;
}

export function GlobalShapBar({ data, height = 400 }: GlobalShapBarProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
        No global SHAP data available
      </div>
    );
  }

  // Top 12 features reversed for horizontal bar
  const top12 = data.slice(0, 12).reverse();
  const categories = top12.map((d) => d.feature);
  const values = top12.map((d) => Number(d.importance.toFixed(4)));

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: any) => {
        const item = params[0];
        return `
          <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
            <div style="font-weight: 600; color: #4338ca;">${item.name}</div>
            <div>Mean |SHAP|: <strong>${item.value}</strong></div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              TreeExplainer log-scale impact on price
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
      name: "Mean Absolute SHAP Value",
      nameLocation: "middle",
      nameGap: 24,
      axisLabel: { color: "#64748b", fontSize: 10 },
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
        name: "Feature Importance",
        type: "bar",
        data: values,
        itemStyle: {
          color: "#8b5cf6", // violet
          borderRadius: [0, 4, 4, 0],
        },
        label: {
          show: true,
          position: "right",
          formatter: "{c}",
          fontSize: 10,
          color: "#64748b",
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} />;
}
