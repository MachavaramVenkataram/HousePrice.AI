"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

interface AnimatedLogoProps {
  showTagline?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function AnimatedLogo({
  showTagline = true,
  className = "",
  size = "md",
}: AnimatedLogoProps) {
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 group shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-xl ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="HousePrice AI — Return to Overview"
    >
      {/* Visual Logo Container with Liquid Glass Border & Ambient Glow */}
      <motion.div
        className={`relative ${iconSizes[size]} rounded-2xl bg-gradient-to-br from-white/95 via-violet-50/80 to-purple-100/60 p-1.5 flex items-center justify-center border border-white/90 shadow-xs shadow-violet-200/50 backdrop-blur-md overflow-visible`}
        animate={
          shouldReduceMotion
            ? {}
            : {
                scale: isHovered ? 1.04 : 1,
                boxShadow: isHovered
                  ? "0 4px 20px -2px rgba(124, 58, 237, 0.25), 0 0 12px 1px rgba(34, 211, 238, 0.2)"
                  : "0 2px 8px -1px rgba(124, 58, 237, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.9)",
              }
        }
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Ambient Halo Behind Logo */}
        <motion.div
          className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-tr from-violet-400/20 via-cyan-400/20 to-purple-400/20 blur-md pointer-events-none"
          animate={
            shouldReduceMotion
              ? {}
              : {
                  opacity: isHovered ? 0.9 : 0.45,
                  scale: isHovered ? 1.15 : 1,
                }
          }
          transition={{ duration: 0.4 }}
        />

        {/* Custom SVG Architecture + Ascending Data Signal + AI Spark */}
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Violet Architecture Gradient */}
            <linearGradient id="hp-roof-grad" x1="4" y1="6" x2="36" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor="#7C3AED" />
              <stop offset="0.5" stopColor="#8B5CF6" />
              <stop offset="1" stopColor="#6366F1" />
            </linearGradient>

            {/* Cyan Data Bar Gradient */}
            <linearGradient id="hp-data-grad" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#22D3EE" />
              <stop offset="1" stopColor="#0891B2" />
            </linearGradient>

            {/* Spark Lavender Glow Gradient */}
            <linearGradient id="hp-spark-grad" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#E9D5FF" />
              <stop offset="0.5" stopColor="#A855F7" />
              <stop offset="1" stopColor="#67E8F9" />
            </linearGradient>

            {/* Moving Light Sweep Filter */}
            <linearGradient id="hp-light-sweep" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.7" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* 1. Architectural House Contour */}
          {/* Path: Baseline at y=33, Left wall x=7, Roof pitch apex at (20, 11), Right wall x=33 */}
          <motion.path
            d="M 8 33 L 8 18 L 20 9 L 32 18 L 32 33 Z"
            stroke="url(#hp-roof-grad)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="rgba(139, 92, 246, 0.04)"
            initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          {/* Precision Architectural Ground Foundation Line */}
          <motion.line
            x1="5"
            y1="33"
            x2="35"
            y2="33"
            stroke="url(#hp-roof-grad)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />

          {/* 2. Three Ascending Predictive Data Signal Bars */}
          {/* Bar 1: x=12..15, y=25..31 (Height 6) */}
          <motion.rect
            x="12"
            y="25"
            width="3.2"
            height="6"
            rx="1.2"
            fill="url(#hp-data-grad)"
            initial={shouldReduceMotion ? { opacity: 1, scaleY: 1 } : { opacity: 0, scaleY: 0 }}
            animate={
              shouldReduceMotion
                ? { opacity: 1 }
                : {
                    opacity: isHovered ? 1 : [0.75, 1, 0.75],
                    scaleY: isHovered ? 1.15 : 1,
                  }
            }
            transition={
              isHovered
                ? { duration: 0.2 }
                : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
            }
            style={{ transformOrigin: "13.6px 31px" }}
          />

          {/* Bar 2: x=18.4..21.6, y=20..31 (Height 11) */}
          <motion.rect
            x="18.4"
            y="20"
            width="3.2"
            height="11"
            rx="1.2"
            fill="url(#hp-data-grad)"
            initial={shouldReduceMotion ? { opacity: 1, scaleY: 1 } : { opacity: 0, scaleY: 0 }}
            animate={
              shouldReduceMotion
                ? { opacity: 1 }
                : {
                    opacity: isHovered ? 1 : [0.85, 1, 0.85],
                    scaleY: isHovered ? 1.2 : 1,
                  }
            }
            transition={
              isHovered
                ? { duration: 0.2, delay: 0.05 }
                : { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }
            }
            style={{ transformOrigin: "20px 31px" }}
          />

          {/* Bar 3: x=24.8..28, y=16..31 (Height 15) */}
          <motion.rect
            x="24.8"
            y="16"
            width="3.2"
            height="15"
            rx="1.2"
            fill="url(#hp-data-grad)"
            initial={shouldReduceMotion ? { opacity: 1, scaleY: 1 } : { opacity: 0, scaleY: 0 }}
            animate={
              shouldReduceMotion
                ? { opacity: 1 }
                : {
                    opacity: isHovered ? 1 : [0.75, 1, 0.75],
                    scaleY: isHovered ? 1.15 : 1,
                  }
            }
            transition={
              isHovered
                ? { duration: 0.2, delay: 0.1 }
                : { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }
            }
            style={{ transformOrigin: "26.4px 31px" }}
          />

          {/* Trendline connecting data signal tops (subtle curve) */}
          <motion.path
            d="M 13.6 24.5 Q 20 18.5 26.4 15.5"
            stroke="#22D3EE"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeDasharray="1.5 2"
            fill="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 0.95 : 0.6 }}
            transition={{ duration: 0.3 }}
          />

          {/* 3. AI Intelligence Spark above Roof Apex */}
          {/* Apex of roof is at (20, 9). Spark center at (20, 5) */}
          <motion.g
            initial={shouldReduceMotion ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            animate={
              shouldReduceMotion
                ? { scale: 1, opacity: 1 }
                : {
                    scale: isHovered ? [1.2, 1.35, 1.25] : [0.95, 1.15, 0.95],
                    opacity: isHovered ? 1 : [0.75, 1, 0.75],
                  }
            }
            transition={
              isHovered
                ? { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
                : { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }
            style={{ transformOrigin: "20px 5px" }}
          >
            {/* 4-Point AI Intelligence Star Diamond */}
            <path
              d="M 20 1.5 C 20.3 3.5 21.8 5 23.8 5.3 C 21.8 5.6 20.3 7.1 20 9.1 C 19.7 7.1 18.2 5.6 16.2 5.3 C 18.2 5 19.7 3.5 20 1.5 Z"
              fill="url(#hp-spark-grad)"
            />
            {/* Tiny Core Luminous Center */}
            <circle cx="20" cy="5.3" r="0.9" fill="#FFFFFF" />
          </motion.g>

          {/* Tiny Satellite Micro-Spark on right roof angle */}
          <motion.circle
            cx="29"
            cy="11"
            r="1"
            fill="#67E8F9"
            animate={
              shouldReduceMotion
                ? { opacity: 0.8 }
                : {
                    opacity: isHovered ? [0.4, 1, 0.4] : [0.2, 0.7, 0.2],
                    scale: isHovered ? [0.8, 1.2, 0.8] : [0.8, 1, 0.8],
                  }
            }
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          />
        </svg>
      </motion.div>

      {/* Brand Typography & Tagline */}
      <div className="flex flex-col">
        <motion.div
          className="flex items-center gap-1.5 leading-none"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <span className="font-extrabold text-[15px] tracking-tight text-slate-900 group-hover:text-violet-700 transition-colors">
            HOUSEPRICE
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent ml-0.5">
              .AI
            </span>
          </span>

          {/* Production Status Glass Badge */}
          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-violet-100/80 text-violet-700 border border-violet-200/60 shadow-2xs">
            PROD
          </span>
        </motion.div>

        {showTagline && (
          <motion.p
            className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5 hidden sm:block"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.45 }}
          >
            Property Price Intelligence
          </motion.p>
        )}
      </div>
    </Link>
  );
}
