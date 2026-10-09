"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface GlassTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function GlassTabs({
  tabs,
  activeTab,
  onChange,
  className,
}: GlassTabsProps) {
  return (
    <div
      className={cn(
        "inline-flex p-1 rounded-2xl bg-slate-100/80 backdrop-blur-md border border-white/80 shadow-2xs gap-1",
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors duration-150 flex items-center gap-2 z-10 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
              isActive
                ? "text-violet-900"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            )}
          >
            {/* Sliding Liquid Glass Pill Background Indicator */}
            {isActive && (
              <motion.div
                layoutId="activeGlassTab"
                className="absolute inset-0 bg-white rounded-xl shadow-xs border border-violet-200/80 -z-10"
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 32,
                }}
              />
            )}

            {tab.icon && (
              <span
                className={cn(
                  "transition-colors",
                  isActive ? "text-violet-600" : "text-slate-400"
                )}
              >
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>

            {tab.badge !== undefined && (
              <span
                className={cn(
                  "text-[10px] font-bold px-1.5 py-0.2 rounded-full",
                  isActive
                    ? "bg-violet-100 text-violet-700"
                    : "bg-slate-200/70 text-slate-500"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
