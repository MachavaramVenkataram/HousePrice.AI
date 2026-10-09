"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  SlidersHorizontal,
  FlaskConical,
  Database,
  BarChart3,
  Activity,
  History,
  FileSpreadsheet,
  BookOpen,
  ArrowRight,
  Sliders,
  X,
  Layers,
  Target,
} from "lucide-react";
import { useUserMode } from "../mode-context";

interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Action";
  description: string;
  href?: string;
  icon: React.ElementType;
  action?: () => void;
  badge?: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { isExpert, toggleMode } = useUserMode();

  // Listen for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleCustomOpen);
    };
  }, [isOpen]);

  const items: CommandItem[] = [
    {
      id: "predict",
      title: "Estimate Property Value",
      category: "Navigation",
      description: "Run trained ensemble ML model with conformal prediction intervals & SHAP",
      href: "/predict",
      icon: Sparkles,
      badge: "Primary",
    },
    {
      id: "target-price",
      title: "Target Price Explorer",
      category: "Navigation",
      description: "Search feasible property feature combinations given a desired target budget",
      href: "/target-price",
      icon: Target,
      badge: "New",
    },
    {
      id: "what-if",
      title: "What-If Scenario Simulator",
      category: "Navigation",
      description: "Counterfactual simulation & 1D feature sensitivity evaluation",
      href: "/what-if",
      icon: SlidersHorizontal,
    },
    {
      id: "model-lab",
      title: "Model Evaluation Lab",
      category: "Navigation",
      description: "10-Model 5-Fold CV benchmark, Optuna curves, and residual diagnostics",
      href: "/model-lab",
      icon: FlaskConical,
    },
    {
      id: "data-explorer",
      title: "Dataset Intelligence",
      category: "Navigation",
      description: "Explore 1,460 Ames housing records, features, and quality checks",
      href: "/data-explorer",
      icon: Database,
    },
    {
      id: "analytics",
      title: "EDA & Location Analytics",
      category: "Navigation",
      description: "25 Ames neighborhoods, price skew distribution, and feature correlations",
      href: "/analytics",
      icon: BarChart3,
    },
    {
      id: "monitoring",
      title: "Model & Data Monitoring",
      category: "Navigation",
      description: "Telemetry, inference latency, feedback, and Kolmogorov-Smirnov drift",
      href: "/monitoring",
      icon: Activity,
    },
    {
      id: "history",
      title: "Prediction History",
      category: "Navigation",
      description: "Audit recent property valuations, intervals, and user feedback",
      href: "/history",
      icon: History,
    },
    {
      id: "batch",
      title: "Batch CSV Inference",
      category: "Navigation",
      description: "Upload portfolio CSV and download enriched valuations with bounds",
      href: "/batch",
      icon: FileSpreadsheet,
    },
    {
      id: "methodology",
      title: "ML Methodology & Limitations",
      category: "Navigation",
      description: "Split conformal prediction, Tree SHAP, responsible AI & limitations",
      href: "/how-it-works",
      icon: BookOpen,
    },
    {
      id: "overview",
      title: "Overview Dashboard",
      category: "Navigation",
      description: "Executive summary, KPI cards, and production model status",
      href: "/",
      icon: Layers,
    },
    {
      id: "toggle-mode",
      title: isExpert ? "Switch to Simple Mode" : "Switch to Expert Mode",
      category: "Action",
      description: isExpert
        ? "Hide advanced statistical metrics and show standard interface"
        : "Show candidate model selector, granular structural parameters, and technical metrics",
      icon: Sliders,
      action: () => toggleMode(),
      badge: isExpert ? "Current: Expert" : "Current: Simple",
    },
  ];

  const filtered = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (item: CommandItem) => {
    setIsOpen(false);
    setQuery("");
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle arrow keys
  useEffect(() => {
    if (!isOpen) return;
    const handleNav = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        handleSelect(filtered[selectedIndex]);
      }
    };
    window.addEventListener("keydown", handleNav);
    return () => window.removeEventListener("keydown", handleNav);
  }, [isOpen, selectedIndex, filtered]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-slate-900/15 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl overflow-hidden glass-panel-elevated bg-white/92 border border-white shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 bg-white/60">
          <Search className="w-5 h-5 text-violet-500 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Type a page name or action (e.g. Estimate, What-If, Benchmark)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-slate-50">
          {filtered.length > 0 ? (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-violet-50/80 text-violet-950 border border-violet-200/60"
                      : "hover:bg-slate-50 text-slate-700 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "bg-violet-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold flex items-center gap-2">
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-violet-100 text-violet-700">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? "text-violet-600 translate-x-1" : "text-slate-300"
                    }`}
                  />
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No matching pages or actions found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500 font-mono text-[10px] shadow-2xs">
                ↑
              </kbd>{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500 font-mono text-[10px] shadow-2xs">
                ↓
              </kbd>{" "}
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500 font-mono text-[10px] shadow-2xs">
                Enter
              </kbd>{" "}
              Select
            </span>
          </div>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500 font-mono text-[10px] shadow-2xs">
              ESC
            </kbd>{" "}
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
