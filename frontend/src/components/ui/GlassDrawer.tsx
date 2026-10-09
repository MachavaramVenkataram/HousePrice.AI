"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export interface GlassDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export const GlassDrawer: React.FC<GlassDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = "md",
  className = "",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/15 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Drawer Slide-Over Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0.7 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.7 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className={`relative w-full ${sizeClasses[size]} h-full bg-white/95 backdrop-blur-2xl border-l border-white/80 shadow-2xl flex flex-col z-10 ${className}`}
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-white/60">
              <div className="space-y-1">
                {typeof title === "string" ? (
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
                ) : (
                  title
                )}
                {subtitle && (
                  <div className="text-xs text-slate-500 font-medium">{subtitle}</div>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close drawer"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
