"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "violet"
    | "cyan"
    | "mint"
    | "amber"
    | "coral"
    | "rose"
    | "lavender"
    | "slate"
    | "subtle";
  size?: "xs" | "sm" | "md";
  dot?: boolean;
  pulse?: boolean;
}

export function GlassBadge({
  variant = "violet",
  size = "sm",
  dot = false,
  pulse = false,
  className,
  children,
  ...props
}: GlassBadgeProps) {
  const sizeClasses = {
    xs: "px-2 py-0.5 text-[10px] gap-1",
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3 py-1.5 text-xs font-semibold gap-2",
  };

  const variantClasses = {
    violet:
      "bg-violet-50/80 text-violet-700 border-violet-200/70 shadow-2xs shadow-violet-100/50",
    cyan: "bg-cyan-50/80 text-cyan-700 border-cyan-200/70 shadow-2xs shadow-cyan-100/50",
    mint: "bg-emerald-50/80 text-emerald-700 border-emerald-200/70 shadow-2xs shadow-emerald-100/50",
    amber:
      "bg-amber-50/80 text-amber-700 border-amber-200/70 shadow-2xs shadow-amber-100/50",
    coral:
      "bg-rose-50/80 text-rose-700 border-rose-200/70 shadow-2xs shadow-rose-100/50",
    rose: "bg-pink-50/80 text-pink-700 border-pink-200/70 shadow-2xs shadow-pink-100/50",
    lavender:
      "bg-purple-50/80 text-purple-700 border-purple-200/70 shadow-2xs shadow-purple-100/50",
    slate:
      "bg-slate-50/80 text-slate-700 border-slate-200/70 shadow-2xs shadow-slate-100/50",
    subtle:
      "bg-slate-100/70 text-slate-700 border-slate-200/60 shadow-2xs shadow-slate-100/30",
  };

  const dotColors = {
    violet: "bg-violet-500",
    cyan: "bg-cyan-500",
    mint: "bg-emerald-500",
    amber: "bg-amber-500",
    coral: "bg-rose-500",
    rose: "bg-pink-500",
    lavender: "bg-purple-500",
    slate: "bg-slate-400",
    subtle: "bg-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border backdrop-blur-md select-none",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                dotColors[variant]
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex rounded-full h-1.5 w-1.5",
              dotColors[variant]
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}
