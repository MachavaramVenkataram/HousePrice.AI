"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "mint";
  size?: "xs" | "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  icon?: React.ReactNode;
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      icon,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      xs: "px-2.5 py-1 text-[11px] font-semibold rounded-lg gap-1.5",
      sm: "px-3.5 py-1.5 text-xs font-semibold rounded-xl gap-1.5",
      md: "px-5 py-2.5 text-sm font-semibold rounded-xl gap-2",
      lg: "px-6 py-3.5 text-base font-bold rounded-2xl gap-2.5",
    };

    const variantClasses = {
      primary:
        "bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-500 text-white border border-white/25 shadow-sm shadow-violet-300/40 hover:-translate-y-0.5 hover:shadow-md hover:shadow-violet-400/30 active:translate-y-0 active:scale-[0.99] transition-all duration-200",
      secondary:
        "bg-white/85 text-slate-800 border border-slate-200/80 shadow-2xs hover:bg-white hover:border-violet-300 hover:text-violet-700 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200",
      outline:
        "bg-transparent text-slate-700 border border-slate-200/90 hover:bg-violet-50/60 hover:border-violet-300 hover:text-violet-800 transition-all duration-200",
      ghost:
        "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200/60 transition-all duration-150",
      mint:
        "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-white/25 shadow-sm shadow-emerald-200/40 hover:-translate-y-0.5 hover:shadow-md hover:shadow-emerald-300/30 active:translate-y-0 transition-all duration-200",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-current" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {(leftIcon || icon) && <span className="shrink-0">{leftIcon || icon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

GlassButton.displayName = "GlassButton";
