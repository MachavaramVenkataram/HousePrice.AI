"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type SystemStatusType = "healthy" | "warning" | "error" | "offline" | "idle";

interface StatusIndicatorProps {
  status: SystemStatusType;
  label?: string;
  showDot?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function StatusIndicator({
  status,
  label,
  showDot = true,
  size = "md",
  className,
}: StatusIndicatorProps) {
  const configs: Record<
    SystemStatusType,
    {
      bg: string;
      text: string;
      border: string;
      dot: string;
      pulse: boolean;
      defaultLabel: string;
    }
  > = {
    healthy: {
      bg: "bg-emerald-50/80",
      text: "text-emerald-700",
      border: "border-emerald-200/60",
      dot: "bg-emerald-500",
      pulse: true,
      defaultLabel: "Healthy",
    },
    warning: {
      bg: "bg-amber-50/80",
      text: "text-amber-700",
      border: "border-amber-200/60",
      dot: "bg-amber-500",
      pulse: true,
      defaultLabel: "Degraded",
    },
    error: {
      bg: "bg-rose-50/80",
      text: "text-rose-700",
      border: "border-rose-200/60",
      dot: "bg-rose-500",
      pulse: false,
      defaultLabel: "Unavailable",
    },
    offline: {
      bg: "bg-slate-100/80",
      text: "text-slate-600",
      border: "border-slate-200/60",
      dot: "bg-slate-400",
      pulse: false,
      defaultLabel: "Offline",
    },
    idle: {
      bg: "bg-violet-50/80",
      text: "text-violet-700",
      border: "border-violet-200/60",
      dot: "bg-violet-400",
      pulse: false,
      defaultLabel: "Standby",
    },
  };

  const cfg = configs[status];
  const displayLabel = label || cfg.defaultLabel;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border backdrop-blur-md font-semibold select-none",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        cfg.bg,
        cfg.text,
        cfg.border,
        className
      )}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          {cfg.pulse && (
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                cfg.dot
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              cfg.dot
            )}
          />
        </span>
      )}
      <span>{displayLabel}</span>
    </div>
  );
}
