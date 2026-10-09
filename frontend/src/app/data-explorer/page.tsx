"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import {
  PageTransition,
  GlassCard,
  AnimatedNumber,
} from "@/components/ui";
import {
  Database,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileText,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
} from "lucide-react";

export default function DataExplorerPage() {
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [neighborhood, setNeighborhood] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("SalePrice");
  const [sortDesc, setSortDesc] = useState<boolean>(true);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  // Fetch dataset profile
  const { data: profile } = useQuery({
    queryKey: ["dataset-profile"],
    queryFn: () => api.getDatasetProfile(),
  });

  // Fetch server-side paginated rows
  const { data: rowsData, isLoading: rowsLoading } = useQuery({
    queryKey: [
      "dataset-rows",
      page,
      pageSize,
      searchTerm,
      neighborhood,
      minPrice,
      maxPrice,
      sortBy,
      sortDesc,
    ],
    queryFn: () =>
      api.getDatasetRows({
        page,
        pageSize,
        search: searchTerm || undefined,
        neighborhood: neighborhood || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sortBy,
        sortDesc,
      }),
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(column);
      setSortDesc(true);
    }
  };

  const toggleRowExpand = (id: number) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  return (
    <PageTransition className="space-y-10 max-w-7xl mx-auto">
      {/* Header (Section 34) */}
      <div className="border-b border-slate-200/60 pb-7">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-violet-50/80 text-violet-700 border border-violet-200/60 shadow-2xs mb-3">
          <Database className="w-3.5 h-3.5" />
          <span>Server-Side Paginated Ames Housing Explorer</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          DATASET INTELLIGENCE
        </h1>
        <p className="text-sm text-slate-500 mt-1.5 max-w-3xl font-medium">
          Inspect the official Ames Housing dataset across 1,460 residential properties, featuring real-time server-side filtering, column sorting, expandable property records, and an automated data quality scorecard.
        </p>
      </div>

      {/* DATA QUALITY PROFILE (Section 36) */}
      {profile && (
        <section className="glass-panel-elevated p-6 sm:p-7 space-y-6 rounded-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/50 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                DATA QUALITY PROFILE
              </h2>
              <p className="text-xs text-slate-500">
                Methodology: {profile.data_quality_methodology}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Quality Score:</span>
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-2xs">
                {profile.data_quality_score} / 100
              </span>
            </div>
          </div>

          {/* Diagnostic Cards with Indicators (Section 34 & 36) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 text-xs">
            <div className="glass-panel p-4 rounded-2xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Rows</span>
              <div className="text-base font-black text-slate-900 font-mono mt-0.5">{profile.rows.toLocaleString()}</div>
              <div className="w-full bg-slate-100 rounded-full h-1 mt-2 overflow-hidden">
                <div className="bg-violet-600 h-full rounded-full" style={{ width: "100%" }} />
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Features</span>
              <div className="text-base font-black text-slate-900 font-mono mt-0.5">{profile.total_columns}</div>
              <div className="w-full bg-slate-100 rounded-full h-1 mt-2 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: "81%" }} />
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Numerical</span>
              <div className="text-base font-black text-slate-900 font-mono mt-0.5">{profile.numeric_features_count}</div>
              <div className="w-full bg-slate-100 rounded-full h-1 mt-2 overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full" style={{ width: "47%" }} />
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Categorical</span>
              <div className="text-base font-black text-slate-900 font-mono mt-0.5">{profile.categorical_features_count}</div>
              <div className="w-full bg-slate-100 rounded-full h-1 mt-2 overflow-hidden">
                <div className="bg-sky-500 h-full rounded-full" style={{ width: "53%" }} />
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Duplicates</span>
              <div className="text-base font-black text-emerald-700 font-mono mt-0.5">{profile.duplicates_count} (0%)</div>
              <div className="w-full bg-slate-100 rounded-full h-1 mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "100%" }} />
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target Skew</span>
              <div className="text-base font-black text-slate-900 font-mono mt-0.5">{profile.target_distribution.skewness.toFixed(2)}</div>
              <div className="w-full bg-slate-100 rounded-full h-1 mt-2 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: "65%" }} />
              </div>
            </div>
          </div>

          {/* Missing values highlight */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-900 flex items-start gap-2.5 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Missing Value Profile:</strong> Columns such as PoolQC (99.5%), MiscFeature (96.3%),
              Alley (93.8%), and Fence (80.8%) represent absence of amenity (&ldquo;None&rdquo;) rather than data corruption.
              Median imputer and constant &ldquo;Missing&rdquo; imputation are applied systematically in the scikit-learn pipeline without data leakage.
            </div>
          </div>
        </section>
      )}

      {/* Filter and Search Bar & Data Table (Section 34 & 35) */}
      <div className="glass-panel-elevated p-6 sm:p-7 space-y-6 rounded-3xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID or style..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Neighborhood filter */}
          <div>
            <select
              value={neighborhood}
              onChange={(e) => {
                setNeighborhood(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
            >
              <option value="">All Neighborhoods</option>
              {profile?.unique_neighborhoods.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Min Price */}
          <div>
            <input
              type="number"
              placeholder="Min Price ($)"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Max Price */}
          <div>
            <input
              type="number"
              placeholder="Max Price ($)"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Page size */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 shrink-0 font-medium">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="w-full py-2 px-3 rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
            >
              <option value={10}>10 per page</option>
              <option value={15}>15 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>

        {/* Server Data Table (Section 35) */}
        <div className="overflow-x-auto border border-slate-200/70 rounded-2xl glass-panel">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-white/60 border-b border-slate-200/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider font-sans sticky top-0">
                <th
                  onClick={() => handleSort("Id")}
                  className="py-3 px-3.5 cursor-pointer hover:text-slate-800"
                >
                  <span className="flex items-center gap-1">
                    ID <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("SalePrice")}
                  className="py-3 px-3.5 cursor-pointer hover:text-slate-800"
                >
                  <span className="flex items-center gap-1">
                    SalePrice <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("GrLivArea")}
                  className="py-3 px-3.5 cursor-pointer hover:text-slate-800"
                >
                  <span className="flex items-center gap-1">
                    Living Area <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("OverallQual")}
                  className="py-3 px-3.5 cursor-pointer hover:text-slate-800"
                >
                  <span className="flex items-center gap-1">
                    Quality <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("YearBuilt")}
                  className="py-3 px-3.5 cursor-pointer hover:text-slate-800"
                >
                  <span className="flex items-center gap-1">
                    Year Built <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </span>
                </th>
                <th className="py-3 px-3.5 font-sans">Neighborhood</th>
                <th className="py-3 px-3.5 font-sans">Beds / Baths</th>
                <th className="py-3 px-3.5 font-sans">Basement SF</th>
                <th className="py-3 px-3.5 font-sans">Garage</th>
                <th className="py-3 px-3.5 font-sans text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rowsLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-sans">
                    Loading records from Ames database...
                  </td>
                </tr>
              ) : rowsData?.rows?.length > 0 ? (
                rowsData.rows.map((r: any) => (
                  <React.Fragment key={r.Id}>
                    <tr
                      onClick={() => toggleRowExpand(r.Id)}
                      className={`hover:bg-violet-50/20 transition-colors cursor-pointer ${
                        expandedRowId === r.Id ? "bg-violet-50/30" : ""
                      }`}
                    >
                      <td className="py-3 px-3.5 font-bold text-slate-800">#{r.Id}</td>
                      <td className="py-3 px-3.5 font-black text-violet-900">
                        ${r.SalePrice ? Math.round(r.SalePrice).toLocaleString() : "N/A"}
                      </td>
                      <td className="py-3 px-3.5 text-slate-700">{r.GrLivArea} sqft</td>
                      <td className="py-3 px-3.5 font-bold text-slate-800">{r.OverallQual} / 10</td>
                      <td className="py-3 px-3.5 text-slate-600">{r.YearBuilt}</td>
                      <td className="py-3 px-3.5 font-sans text-slate-700">{r.Neighborhood}</td>
                      <td className="py-3 px-3.5 text-slate-600">
                        {r.BedroomAbvGr} beds / {r.FullBath} baths
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">{r.TotalBsmtSF} sqft</td>
                      <td className="py-3 px-3.5 text-slate-600">{r.GarageCars} cars</td>
                      <td className="py-3 px-3.5 text-center">
                        <button
                          type="button"
                          className="p-1 text-slate-400 hover:text-violet-600 rounded"
                        >
                          {expandedRowId === r.Id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Row Details (Section 35) */}
                    {expandedRowId === r.Id && (
                      <tr className="bg-violet-50/20 font-sans">
                        <td colSpan={10} className="p-4 border-b border-violet-100">
                          <div className="p-4 rounded-xl glass-panel space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                              <span>Property #{r.Id} Detailed Attributes</span>
                              <span className="text-violet-700 font-mono">
                                SalePrice: ${Math.round(r.SalePrice).toLocaleString()}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-semibold">Lot Area:</span>
                                <div className="font-mono text-slate-900">{r.LotArea?.toLocaleString() || "N/A"} sq ft</div>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-semibold">House Style:</span>
                                <div className="text-slate-900">{r.HouseStyle || "1Story"}</div>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-semibold">Overall Condition:</span>
                                <div className="text-slate-900">{r.OverallCond || 5} / 10</div>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-semibold">Remodel Year:</span>
                                <div className="text-slate-900">{r.YearRemodAdd || r.YearBuilt}</div>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-semibold">Fireplaces:</span>
                                <div className="text-slate-900">{r.Fireplaces || 0}</div>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-semibold">Garage Area:</span>
                                <div className="font-mono text-slate-900">{r.GarageArea || 0} sq ft</div>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-semibold">Wood Deck SF:</span>
                                <div className="font-mono text-slate-900">{r.WoodDeckSF || 0} sq ft</div>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-semibold">Open Porch SF:</span>
                                <div className="font-mono text-slate-900">{r.OpenPorchSF || 0} sq ft</div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-sans">
                    No matching properties found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls (Section 35) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
          <div className="text-slate-500 font-medium">
            Showing{" "}
            <strong className="text-slate-800">
              {rowsData ? (page - 1) * pageSize + 1 : 0} —{" "}
              {rowsData ? Math.min(page * pageSize, rowsData.total) : 0}
            </strong>{" "}
            of <strong className="text-slate-800">{rowsData?.total?.toLocaleString() || 0}</strong> records
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-xl glass-panel text-slate-700 hover:text-slate-900 disabled:opacity-40 flex items-center gap-1 font-bold cursor-pointer transition-all shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="font-mono text-slate-600 font-bold px-2">
              Page {page} of {rowsData?.total_pages || 1}
            </span>
            <button
              onClick={() => setPage(Math.min(rowsData?.total_pages || 1, page + 1))}
              disabled={page >= (rowsData?.total_pages || 1)}
              className="px-3 py-1.5 rounded-xl glass-panel text-slate-700 hover:text-slate-900 disabled:opacity-40 flex items-center gap-1 font-bold cursor-pointer transition-all shadow-2xs"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
