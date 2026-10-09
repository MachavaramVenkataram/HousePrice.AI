"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/services/api";
import { useUserMode } from "../mode-context";
import { AnimatedLogo } from "../ui/AnimatedLogo";
import {
  useThemeAccent,
  ACCENT_CONFIGS,
  type ThemeAccent,
} from "../ui/ThemeAccentContext";
import {
  Sparkles,
  SlidersHorizontal,
  BarChart3,
  Database,
  Activity,
  History,
  FileSpreadsheet,
  BookOpen,
  FlaskConical,
  Menu,
  X,
  Layers,
  Search,
  Palette,
  Target,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { mode, toggleMode, isExpert } = useUserMode();
  const { accent, setAccent } = useThemeAccent();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const { data: health } = useQuery({
    queryKey: ["api-health"],
    queryFn: () => api.checkHealth(),
    refetchInterval: 30000,
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Overview", icon: Layers },
    { href: "/predict", label: "Estimate", icon: Sparkles, highlight: true },
    { href: "/target-price", label: "Target Price", icon: Target },
    { href: "/what-if", label: "What-If", icon: SlidersHorizontal },
    { href: "/model-lab", label: "Model Lab", icon: FlaskConical },
    { href: "/data-explorer", label: "Data", icon: Database },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/monitoring", label: "Monitoring", icon: Activity },
    { href: "/history", label: "History", icon: History },
    { href: "/batch", label: "Batch", icon: FileSpreadsheet },
    { href: "/how-it-works", label: "Methodology", icon: BookOpen },
  ];

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  };

  const accentList: ThemeAccent[] = [
    "violet",
    "cyan",
    "mint",
    "coral",
    "amber",
    "rose",
    "lavender",
  ];

  return (
    <header className="sticky top-3 z-40 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-all">
      <div
        className={`border transition-all duration-300 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 ${
          isScrolled
            ? "bg-white/92 backdrop-blur-2xl border-white/95 shadow-md shadow-slate-200/60 ring-1 ring-slate-100/80"
            : "bg-white/78 backdrop-blur-xl border-white/90 shadow-sm shadow-slate-200/40"
        }`}
      >
        {/* Brand Animated Logo with Custom House + Data + AI Spark */}
        <AnimatedLogo size="md" />

        {/* Desktop Nav - Floating Centered Glass Island with Spring Slide Indicator */}
        <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto py-0.5 relative">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors duration-150 flex items-center gap-1.5 z-10 ${
                  active
                    ? "text-violet-950 font-bold"
                    : link.highlight
                    ? "text-violet-700 hover:text-violet-900 hover:bg-violet-50/50"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/60"
                }`}
              >
                {/* Sliding Translucent Liquid-Glass Pill Active Indicator (Req 16) */}
                {active && (
                  <motion.div
                    layoutId="navTabIndicator"
                    className="absolute inset-0 bg-violet-100/70 border border-violet-200/80 rounded-xl shadow-2xs -z-10"
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 34,
                    }}
                  >
                    {/* Tiny bottom gradient line */}
                    <span className="absolute bottom-0 left-2.5 right-2.5 h-[2px] bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 rounded-full" />
                  </motion.div>
                )}

                <Icon
                  className={`w-3.5 h-3.5 transition-colors ${
                    active
                      ? "text-violet-700"
                      : link.highlight
                      ? "text-violet-500"
                      : "text-slate-400"
                  }`}
                />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Utility Group */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Search Ctrl+K trigger */}
          <button
            onClick={handleOpenSearch}
            className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100/70 hover:bg-violet-50/80 text-slate-500 hover:text-violet-700 text-xs font-medium border border-slate-200/60 transition-all cursor-pointer shadow-2xs"
            title="Search pages and actions (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-500 font-medium">Search</span>
            <kbd className="px-1 py-0.5 rounded bg-white text-[9px] font-mono text-slate-500 border border-slate-200 shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Accent Color Palette Selector (Req 73) */}
          <div className="relative">
            <button
              onClick={() => setPaletteOpen(!paletteOpen)}
              className="p-1.5 rounded-xl bg-white/80 hover:bg-slate-100/80 border border-slate-200/70 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
              title="Theme Accent Options"
              aria-label="Select accent theme"
            >
              <Palette className="w-3.5 h-3.5 text-slate-500" />
              <span
                className="w-2 h-2 rounded-full ml-1"
                style={{ backgroundColor: ACCENT_CONFIGS[accent].primary }}
              />
            </button>

            {paletteOpen && (
              <div className="absolute right-0 mt-2 p-2 w-44 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white shadow-xl shadow-slate-300/40 z-50 animate-in fade-in zoom-in-95 duration-150">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Accent Color
                </p>
                <div className="grid grid-cols-1 gap-1">
                  {accentList.map((a) => {
                    const cfg = ACCENT_CONFIGS[a];
                    const isSelected = accent === a;
                    return (
                      <button
                        key={a}
                        onClick={() => {
                          setAccent(a);
                          setPaletteOpen(false);
                        }}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-slate-100 text-slate-900 font-semibold"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: cfg.primary }}
                        />
                        <span className="truncate">{cfg.name}</span>
                        {isSelected && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Mode Switcher Pill */}
          <button
            onClick={toggleMode}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
              isExpert
                ? "bg-violet-600 text-white border-violet-500 shadow-violet-200"
                : "bg-white/90 text-slate-700 border-slate-200 hover:border-violet-300"
            }`}
            title={`Currently in ${mode.toUpperCase()} mode. Click to toggle.`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isExpert ? "bg-cyan-300 animate-pulse" : "bg-slate-400"
              }`}
            />
            <span>{isExpert ? "Expert" : "Simple"}</span>
          </button>

          {/* Live API Health Status */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70 text-[10px] font-semibold text-emerald-700 shadow-2xs"
            title="Live ML Inference API Online & Validated"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="hidden xl:inline">Live API</span>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden mt-2 p-3 bg-white/95 backdrop-blur-2xl border border-white shadow-xl rounded-2xl space-y-1"
          >
            <div className="px-2 py-1.5 mb-2 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Navigation
              </span>
              <button
                onClick={handleOpenSearch}
                className="text-xs font-semibold text-violet-600 flex items-center gap-1 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search (Ctrl+K)</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {navLinks.map((link) => {
                const active = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? "bg-violet-100 text-violet-900 border border-violet-200"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        active ? "text-violet-600" : "text-slate-400"
                      }`}
                    />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
