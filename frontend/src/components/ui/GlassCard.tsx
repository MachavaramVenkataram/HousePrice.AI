"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "subtle" | "interactive";
  lightBeam?: boolean;
  reflection?: boolean;
  accentBorder?: boolean;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      variant = "default",
      lightBeam = false,
      reflection = false,
      accentBorder = false,
      padding = "md",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const paddingClasses = {
      none: "p-0",
      sm: "p-3 sm:p-4",
      md: "p-4 sm:p-6",
      lg: "p-6 sm:p-8",
      xl: "p-8 sm:p-10",
    };

    const variantClasses = {
      default:
        "bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm shadow-slate-200/50 rounded-2xl",
      elevated:
        "bg-white/88 backdrop-blur-2xl border border-white/95 shadow-md shadow-violet-200/30 rounded-3xl",
      subtle:
        "bg-white/60 backdrop-blur-md border border-white/80 shadow-2xs shadow-slate-100 rounded-xl",
      interactive:
        "bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm shadow-slate-200/50 rounded-2xl hover:-translate-y-0.5 hover:border-violet-300/70 hover:shadow-md hover:shadow-violet-200/40 transition-all duration-200 cursor-pointer",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden",
          variantClasses[variant],
          paddingClasses[padding],
          lightBeam && "light-beam-active",
          reflection && "glass-reflection",
          accentBorder && "border-violet-200/80 ring-1 ring-violet-400/20",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";
