"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { useThemeAccent } from "./ThemeAccentContext";

interface AmbientPalette {
  orb1: string; // Top left
  orb2: string; // Top right
  orb3: string; // Bottom left
  orb4: string; // Bottom right
  orb5: string; // Center / floating
}

// Route-specific ambient color tuning (Req 50 & 51)
const ROUTE_PALETTES: Record<string, AmbientPalette> = {
  "/": {
    // Overview: Violet + Cyan
    orb1: "rgba(192, 132, 252, 0.18)", // Violet / Lavender
    orb2: "rgba(34, 211, 238, 0.14)",  // Soft Cyan
    orb3: "rgba(167, 139, 250, 0.12)", // Lavender
    orb4: "rgba(56, 189, 248, 0.10)",  // Sky
    orb5: "rgba(224, 231, 255, 0.12)", // Periwinkle
  },
  "/predict": {
    // Estimate: Violet + Mint
    orb1: "rgba(168, 85, 247, 0.18)", // Violet
    orb2: "rgba(52, 211, 153, 0.15)",  // Mint
    orb3: "rgba(110, 231, 183, 0.13)", // Aqua Mint
    orb4: "rgba(192, 132, 252, 0.12)", // Lavender
    orb5: "rgba(167, 243, 208, 0.10)", // Soft Emerald
  },
  "/what-if": {
    // What-If: Lavender + Peach
    orb1: "rgba(196, 181, 253, 0.18)", // Lavender
    orb2: "rgba(253, 186, 116, 0.15)", // Peach
    orb3: "rgba(254, 215, 170, 0.12)", // Champagne
    orb4: "rgba(167, 139, 250, 0.12)", // Violet
    orb5: "rgba(254, 240, 138, 0.08)", // Warm Amber
  },
  "/model-lab": {
    // Model Lab: Violet + Cyan
    orb1: "rgba(147, 51, 234, 0.17)", // Violet
    orb2: "rgba(6, 182, 212, 0.14)",  // Cyan
    orb3: "rgba(129, 140, 248, 0.13)", // Indigo
    orb4: "rgba(103, 232, 249, 0.11)", // Soft Aqua
    orb5: "rgba(237, 233, 254, 0.12)", // Lavender
  },
  "/data-explorer": {
    // Data: Mint + Cyan
    orb1: "rgba(52, 211, 153, 0.16)", // Mint
    orb2: "rgba(34, 211, 238, 0.14)", // Cyan
    orb3: "rgba(110, 231, 183, 0.12)", // Aqua
    orb4: "rgba(186, 230, 253, 0.12)", // Ice Sky
    orb5: "rgba(209, 250, 229, 0.10)", // Mist Mint
  },
  "/analytics": {
    // Analytics: Lavender + Coral
    orb1: "rgba(196, 181, 253, 0.17)", // Lavender
    orb2: "rgba(251, 113, 133, 0.14)", // Coral
    orb3: "rgba(253, 164, 175, 0.12)", // Rose
    orb4: "rgba(167, 139, 250, 0.12)", // Violet
    orb5: "rgba(254, 205, 211, 0.10)", // Soft Blush
  },
  "/monitoring": {
    // Monitoring: Mint + Cyan
    orb1: "rgba(16, 185, 129, 0.16)", // Mint
    orb2: "rgba(6, 182, 212, 0.13)",  // Cyan
    orb3: "rgba(52, 211, 153, 0.12)", // Aqua
    orb4: "rgba(147, 197, 253, 0.11)", // Soft Blue
    orb5: "rgba(209, 250, 229, 0.10)", // Emerald subtle
  },
  "/history": {
    // History: Rose + Lavender
    orb1: "rgba(244, 63, 94, 0.15)",  // Rose
    orb2: "rgba(192, 132, 252, 0.16)", // Lavender
    orb3: "rgba(251, 113, 133, 0.12)", // Soft Coral
    orb4: "rgba(224, 231, 255, 0.12)", // Periwinkle
    orb5: "rgba(254, 226, 226, 0.10)", // Soft Blush
  },
  "/batch": {
    // Batch: Violet + Sky
    orb1: "rgba(147, 51, 234, 0.16)", // Violet
    orb2: "rgba(56, 189, 248, 0.14)", // Sky
    orb3: "rgba(196, 181, 253, 0.12)", // Lavender
    orb4: "rgba(125, 211, 252, 0.11)", // Soft Sky
    orb5: "rgba(224, 231, 255, 0.10)", // Periwinkle
  },
  "/how-it-works": {
    // Methodology: Lavender + Pearl
    orb1: "rgba(196, 181, 253, 0.18)", // Lavender
    orb2: "rgba(224, 231, 255, 0.14)", // Periwinkle
    orb3: "rgba(243, 232, 255, 0.14)", // Orchid Mist
    orb4: "rgba(207, 250, 254, 0.10)", // Cyan Pearl
    orb5: "rgba(245, 243, 255, 0.12)", // Light Lavender
  },
};

export function AmbientBackground() {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const { accent } = useThemeAccent();

  const [mousePos, setMousePos] = useState({ x: -500, y: -500 });
  const [isDesktop, setIsDesktop] = useState(false);
  const targetPos = useRef({ x: -500, y: -500 });
  const currentPos = useRef({ x: -500, y: -500 });
  const animFrameId = useRef<number | null>(null);

  // Active palette resolved by pathname, falling back to overview
  const activePalette = ROUTE_PALETTES[pathname] || ROUTE_PALETTES["/"];

  useEffect(() => {
    // Detect desktop device with mouse pointer capability
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    setIsDesktop(finePointer);

    if (!finePointer || shouldReduceMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
    };

    // Smooth Lerp animation for delayed cursor follow
    const lerpCursor = () => {
      const dx = targetPos.current.x - currentPos.current.x;
      const dy = targetPos.current.y - currentPos.current.y;

      // Small ease factor for subtle delay
      currentPos.current.x += dx * 0.08;
      currentPos.current.y += dy * 0.08;

      setMousePos({
        x: Math.round(currentPos.current.x),
        y: Math.round(currentPos.current.y),
      });

      animFrameId.current = requestAnimationFrame(lerpCursor);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    animFrameId.current = requestAnimationFrame(lerpCursor);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [shouldReduceMotion]);

  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* LAYER 1: Base Warm Ivory Foundation */}
      <div className="absolute inset-0 bg-[#faf9f6]" />

      {/* LAYER 2: Subtle Ambient Radial Diffused Lighting */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: `
            radial-gradient(1200px 800px at 50% -10%, rgba(245, 243, 255, 0.8) 0%, transparent 80%),
            radial-gradient(1000px 700px at 90% 40%, rgba(236, 254, 255, 0.5) 0%, transparent 70%),
            radial-gradient(1000px 800px at 10% 90%, rgba(240, 253, 244, 0.45) 0%, transparent 70%)
          `,
        }}
      />

      {/* LAYER 3: Extremely Subtle Technical Grid (Masked, Soft Lavender/Gray) */}
      <div className="technical-grid-bg opacity-75" />

      {/* LAYER 4: Soft Liquid Light Blobs (5 Orbs with Route-Specific Color Interpolation) */}
      <div className="liquid-bg-layer">
        {/* Orb 1: Top Left */}
        <div
          className="liquid-orb liquid-orb-1"
          style={{
            background: `radial-gradient(circle, ${activePalette.orb1} 0%, rgba(255, 255, 255, 0) 70%)`,
            transition: "background 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />

        {/* Orb 2: Top Right */}
        <div
          className="liquid-orb liquid-orb-2"
          style={{
            background: `radial-gradient(circle, ${activePalette.orb2} 0%, rgba(255, 255, 255, 0) 70%)`,
            transition: "background 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />

        {/* Orb 3: Bottom Left */}
        <div
          className="liquid-orb liquid-orb-3"
          style={{
            background: `radial-gradient(circle, ${activePalette.orb3} 0%, rgba(255, 255, 255, 0) 70%)`,
            transition: "background 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />

        {/* Orb 4: Bottom Right */}
        <div
          className="liquid-orb liquid-orb-4"
          style={{
            background: `radial-gradient(circle, ${activePalette.orb4} 0%, rgba(255, 255, 255, 0) 70%)`,
            transition: "background 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />

        {/* Orb 5: Center Floating Field */}
        <div
          className="liquid-orb liquid-orb-5"
          style={{
            background: `radial-gradient(circle, ${activePalette.orb5} 0%, rgba(255, 255, 255, 0) 70%)`,
            transition: "background 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>

      {/* LAYER 4.5: Desktop Cursor-Reactive Ambient Glow (Subtle delayed follower) */}
      {isDesktop && !shouldReduceMotion && mousePos.x >= 0 && (
        <div
          className="cursor-ambient-glow"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            background: `radial-gradient(circle, ${
              accent === "cyan"
                ? "rgba(34, 211, 238, 0.07)"
                : accent === "mint"
                ? "rgba(52, 211, 153, 0.07)"
                : accent === "coral"
                ? "rgba(251, 113, 133, 0.07)"
                : "rgba(167, 139, 250, 0.08)"
            } 0%, rgba(255, 255, 255, 0) 70%)`,
          }}
        />
      )}
    </div>
  );
}
