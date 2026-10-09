"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeAccent =
  | "violet"
  | "cyan"
  | "mint"
  | "coral"
  | "amber"
  | "rose"
  | "lavender";

export interface AccentColorConfig {
  name: string;
  primary: string;
  light: string;
  subtle: string;
  border: string;
  ring: string;
  text: string;
  gradient: string;
}

export const ACCENT_CONFIGS: Record<ThemeAccent, AccentColorConfig> = {
  violet: {
    name: "Electric Violet",
    primary: "#7c3aed",
    light: "#8b5cf6",
    subtle: "rgba(124, 58, 237, 0.08)",
    border: "rgba(124, 58, 237, 0.25)",
    ring: "rgba(124, 58, 237, 0.35)",
    text: "text-violet-700",
    gradient: "from-violet-600 via-indigo-600 to-violet-500",
  },
  cyan: {
    name: "Soft Cyan",
    primary: "#0891b2",
    light: "#06b6d4",
    subtle: "rgba(8, 145, 178, 0.08)",
    border: "rgba(8, 145, 178, 0.25)",
    ring: "rgba(8, 145, 178, 0.35)",
    text: "text-cyan-700",
    gradient: "from-cyan-600 via-teal-600 to-cyan-500",
  },
  mint: {
    name: "Aqua Mint",
    primary: "#059669",
    light: "#10b981",
    subtle: "rgba(5, 150, 105, 0.08)",
    border: "rgba(5, 150, 105, 0.25)",
    ring: "rgba(5, 150, 105, 0.35)",
    text: "text-emerald-700",
    gradient: "from-emerald-600 via-teal-600 to-emerald-500",
  },
  coral: {
    name: "Soft Coral",
    primary: "#e11d48",
    light: "#f43f5e",
    subtle: "rgba(225, 29, 72, 0.08)",
    border: "rgba(225, 29, 72, 0.25)",
    ring: "rgba(225, 29, 72, 0.35)",
    text: "text-rose-700",
    gradient: "from-rose-600 via-pink-600 to-rose-500",
  },
  amber: {
    name: "Champagne Amber",
    primary: "#d97706",
    light: "#f59e0b",
    subtle: "rgba(217, 119, 6, 0.08)",
    border: "rgba(217, 119, 6, 0.25)",
    ring: "rgba(217, 119, 6, 0.35)",
    text: "text-amber-700",
    gradient: "from-amber-600 via-orange-600 to-amber-500",
  },
  rose: {
    name: "Velvet Rose",
    primary: "#be123c",
    light: "#e11d48",
    subtle: "rgba(190, 18, 60, 0.08)",
    border: "rgba(190, 18, 60, 0.25)",
    ring: "rgba(190, 18, 60, 0.35)",
    text: "text-rose-700",
    gradient: "from-rose-600 via-fuchsia-600 to-rose-500",
  },
  lavender: {
    name: "Orchid Lavender",
    primary: "#6d28d9",
    light: "#8b5cf6",
    subtle: "rgba(109, 40, 217, 0.08)",
    border: "rgba(109, 40, 217, 0.25)",
    ring: "rgba(109, 40, 217, 0.35)",
    text: "text-purple-700",
    gradient: "from-purple-600 via-violet-600 to-purple-500",
  },
};

interface ThemeAccentContextType {
  accent: ThemeAccent;
  setAccent: (accent: ThemeAccent) => void;
  config: AccentColorConfig;
}

const ThemeAccentContext = createContext<ThemeAccentContextType>({
  accent: "violet",
  setAccent: () => {},
  config: ACCENT_CONFIGS.violet,
});

export function ThemeAccentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [accent, setAccentState] = useState<ThemeAccent>("violet");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("houseprice_theme_accent") as ThemeAccent;
      if (saved && ACCENT_CONFIGS[saved]) {
        setAccentState(saved);
        applyAccentCssVars(saved);
      } else {
        applyAccentCssVars("violet");
      }
    } catch {
      // LocalStorage fallback
      applyAccentCssVars("violet");
    }
  }, []);

  const setAccent = (newAccent: ThemeAccent) => {
    setAccentState(newAccent);
    try {
      localStorage.setItem("houseprice_theme_accent", newAccent);
    } catch {}
    applyAccentCssVars(newAccent);
  };

  const applyAccentCssVars = (targetAccent: ThemeAccent) => {
    const cfg = ACCENT_CONFIGS[targetAccent];
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.style.setProperty("--theme-accent", cfg.primary);
      root.style.setProperty("--theme-accent-light", cfg.light);
      root.style.setProperty("--theme-accent-subtle", cfg.subtle);
    }
  };

  return (
    <ThemeAccentContext.Provider
      value={{
        accent,
        setAccent,
        config: ACCENT_CONFIGS[accent],
      }}
    >
      {children}
    </ThemeAccentContext.Provider>
  );
}

export function useThemeAccent() {
  return useContext(ThemeAccentContext);
}
