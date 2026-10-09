"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { NeighborhoodChart } from "@/components/charts/NeighborhoodChart";
import ReactECharts from "echarts-for-react";
import {
  PageTransition,
  GlassCard,
  GlassTabs,
  AnimatedNumber,
} from "@/components/ui";
import {
  BarChart3,
  MapPin,
  TrendingUp,
  Layers,
  PieChart,
  SlidersHorizontal,
  Info,
  Award,
  Home,
  CheckCircle2,
} from "lucide-react";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<string>("location");

  const { data: locations } = useQuery({
    queryKey: ["locations"],
    queryFn: () => api.getLocationAnalytics(),
  });

  const { data: profile } = useQuery({
    queryKey: ["dataset-profile"],
    queryFn: () => api.getDatasetProfile(),
  });

  const { data: scatter } = useQuery({
    queryKey: ["scatter"],
    queryFn: () => api.getScatter(),
  });

  // Top 4 ranked neighborhoods for section 39
  const topNeighborhoods = locations
    ? [...locations].sort((a, b) => b.median_price - a.median_price).slice(0, 4)
    : [];

  // Target Distribution (SalePrice histogram)
  const targetOption = {
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const item = params[0];
        return `
          <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
            <div style="font-weight: 700; color: #7c3aed;">Price Bracket: ${item.name}</div>
            <div style="color: #475569; margin-top: 2px;">Count: <strong>${item.value} homes</strong></div>
          </div>
        `;
      },
    },
    grid: {
      left: "4%",
      right: "4%",
      bottom: "10%",
      top: "8%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: ["<$100k", "$100k-150k", "$150k-200k", "$200k-250k", "$250k-300k", "$300k-400k", "$400k+"],
      axisLabel: { color: "#64748b", fontSize: 11 },
      axisLine: { lineStyle: { color: "#e2e8f0" } },
    },
    yAxis: {
      type: "value",
      name: "Frequency",
      axisLabel: { color: "#64748b", fontSize: 11 },
      splitLine: { lineStyle: { color: "rgba(226, 232, 240, 0.6)" } },
    },
    series: [
      {
        name: "Sale Price Distribution",
        type: "bar",
        data: [123, 497, 439, 198, 97, 79, 27],
        itemStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "#8b5cf6" },
              { offset: 1, color: "#a78bfa" },
            ],
          },
          borderRadius: [6, 6, 0, 0],
        },
      },
    ],
  };

  // Living Area vs Price Scatter Option
  const livAreaScatterOption = {
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        const [sf, price, neigh] = params.data;
        return `
          <div style="font-size: 12px; font-family: sans-serif; padding: 4px;">
            <div style="font-weight: 700; color: #0284c7;">${neigh}</div>
            <div>Living Area: <strong>${sf} sq ft</strong></div>
            <div>Sale Price: <strong>$${price?.toLocaleString()}</strong></div>
          </div>
        `;
      },
    },
    grid: {
      left: "4%",
      right: "4%",
      bottom: "10%",
      top: "8%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      name: "Above-Grade Living Area (sq ft)",
      nameLocation: "middle",
      nameGap: 30,
      axisLabel: { color: "#64748b", fontSize: 11 },
      splitLine: { lineStyle: { color: "rgba(226, 232, 240, 0.6)" } },
    },
    yAxis: {
      type: "value",
      name: "Sale Price ($)",
      nameLocation: "middle",
      nameGap: 45,
      axisLabel: {
        formatter: (v: number) => `$${(v / 1000).toFixed(0)}k`,
        color: "#64748b",
        fontSize: 11,
      },
      splitLine: { lineStyle: { color: "rgba(226, 232, 240, 0.6)" } },
    },
    series: [
      {
        name: "Properties",
        type: "scatter",
        data: scatter?.map((s) => [s.gr_liv_area, s.actual, s.neighborhood]) || [],
        symbolSize: 6,
        itemStyle: {
          color: "#06b6d4",
          opacity: 0.75,
        },
      },
    ],
  };

  return (
    <PageTransition className="space-y-10 max-w-7xl mx-auto">
      {/* Header (Requirement 41: Property Market Insights) */}
      <div className="border-b border-slate-200/60 pb-7">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-violet-100/70 text-violet-800 border border-violet-200/60 shadow-2xs mb-2">
          <BarChart3 className="w-3.5 h-3.5 text-violet-600" />
          <span>Spatial & Valuation Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3.5xl font-extrabold text-slate-900 tracking-tight">
          Property Market Insights
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl font-medium">
          Explore spatial price disparities across 25 Ames neighborhoods, inspect the log-normal price target distribution, and analyze square footage correlation patterns.
        </p>
      </div>

      {/* Tabs with Animated Spring Indicator (Req 39 & 41) */}
      <GlassTabs
        tabs={[
          { id: "location", label: "Neighborhood Rankings" },
          { id: "target_dist", label: "Price Distribution & Skew" },
          { id: "qual_vs_price", label: "Living Area vs. Price" },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId)}
      />

      {/* Tab 1: Location Analytics (Sections 38 & 39) */}
      {activeTab === "location" && (
        <div className="space-y-6">
          {/* Section 39: Top Ranked Neighborhoods Visual Cards */}
          {topNeighborhoods.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {topNeighborhoods.map((loc, idx) => (
                <div key={loc.neighborhood} className="glass-panel p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50/90 border border-violet-200/60 px-2 py-0.5 rounded-full shadow-2xs">
                      Rank #{idx + 1}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">{loc.count} homes</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 truncate">{loc.neighborhood}</div>
                  <div className="space-y-0.5 font-mono text-xs pt-1">
                    <div className="flex justify-between text-slate-500">
                      <span>Median:</span>
                      <strong className="text-violet-900 font-bold">${loc.median_price.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Mean:</span>
                      <strong className="text-slate-700">${loc.mean_price.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="glass-panel-elevated p-6 sm:p-7 space-y-5 rounded-3xl">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-violet-600" />
                Spatial Pricing Disparities by Ames Neighborhood
              </h2>
              <p className="text-xs text-slate-500">
                Rankings of all 25 residential sectors in Ames, Iowa by median price, mean price, and transaction sample size.
              </p>
            </div>

            {locations && (
              <div className="p-4 rounded-2xl glass-panel">
                <NeighborhoodChart locations={locations} height={460} />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200/50 text-xs">
              <div className="p-4 rounded-2xl bg-violet-50/60 border border-violet-200/60 space-y-1 shadow-2xs">
                <span className="font-bold text-violet-950">Highest Median Neighborhood</span>
                <div className="text-base font-black text-violet-700">Northridge Heights ($315,000)</div>
                <p className="text-[11px] text-slate-600">Modern master-planned estates with high square footage</p>
              </div>
              <div className="p-4 rounded-2xl glass-panel space-y-1 shadow-2xs">
                <span className="font-bold text-slate-900">Highest Transaction Volume</span>
                <div className="text-base font-black text-slate-700">North Ames (225 homes)</div>
                <p className="text-[11px] text-slate-600">Broad representative suburban market baseline</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 space-y-1 shadow-2xs">
                <span className="font-bold text-emerald-950">Starter Price Neighborhood</span>
                <div className="text-base font-black text-emerald-700">Meadow Village ($88,000)</div>
                <p className="text-[11px] text-slate-600">Compact multi-family and townhome developments</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Target Distribution */}
      {activeTab === "target_dist" && (
        <div className="glass-panel-elevated p-6 sm:p-7 space-y-6 rounded-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Target Variable Distribution (SalePrice)
              </h2>
              <p className="text-xs text-slate-500">
                Analyzing skewness and justifying log1p target transformation in the training pipeline.
              </p>
            </div>
            {profile && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Raw Skewness:</span>
                <span className="font-bold text-xs text-rose-600 bg-rose-50/80 px-2.5 py-0.5 rounded-full border border-rose-200">
                  +{profile.target_distribution.skewness.toFixed(2)} (Right-skewed)
                </span>
                <span className="text-xs text-slate-500 font-medium ml-2">Log Skewness:</span>
                <span className="font-bold text-xs text-emerald-600 bg-emerald-50/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {profile.target_distribution.log_skewness.toFixed(2)} (Near-Gaussian)
                </span>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl glass-panel">
            <ReactECharts option={targetOption} style={{ height: "360px", width: "100%" }} />
          </div>

          <div className="p-4.5 rounded-2xl glass-panel text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-800">Target Transformation Justification:</div>
            <p className="leading-relaxed text-[11px]">
              Real estate pricing distributions exhibit natural positive skewness due to luxury tail transactions.
              Fitting regression models directly on raw prices severely destabilizes linear coefficients and penalizes percentage errors unevenly.
              Our pipeline applies <code className="bg-white/80 px-1.5 py-0.5 rounded-md font-mono border border-slate-200">np.log1p</code> during cross-validation training
              and computes exact <code className="bg-white/80 px-1.5 py-0.5 rounded-md font-mono border border-slate-200">np.expm1</code> inversion during production inference.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Living Area vs Sale Price */}
      {activeTab === "qual_vs_price" && (
        <div className="glass-panel-elevated p-6 sm:p-7 space-y-5 rounded-3xl">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Above-Grade Living Area vs. Transaction Price
            </h2>
            <p className="text-xs text-slate-500">
              Demonstrating the strong positive correlation between square footage and transactional value across test homes.
            </p>
          </div>

          <div className="p-4 rounded-2xl glass-panel">
            <ReactECharts option={livAreaScatterOption} style={{ height: "420px", width: "100%" }} />
          </div>
        </div>
      )}
    </PageTransition>
  );
}
