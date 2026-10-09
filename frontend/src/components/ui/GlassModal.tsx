"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "lg",
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", damping: 25, stiffness: 320 }}
            className={`relative w-full ${maxWidthMap[maxWidth]} bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl rounded-3xl overflow-hidden z-10 ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || subtitle) && (
              <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-white/50">
                <div className="space-y-0.5">
                  {typeof title === "string" ? (
                    <h3 className="text-base font-black text-slate-900 tracking-tight">{title}</h3>
                  ) : (
                    title
                  )}
                  {subtitle && (
                    <div className="text-xs text-slate-500 font-medium">{subtitle}</div>
                  )}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close modal"
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
