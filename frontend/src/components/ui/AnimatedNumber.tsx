"use client";

import React, { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  formatter?: (val: number) => string;
  className?: string;
}

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1.2,
  formatter,
  className = "",
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(0);
  const prevValue = useRef<number>(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }

    if (!isInView) {
      return;
    }

    const startVal = prevValue.current;
    const endVal = value;
    const startTime = performance.now();
    const durationMs = duration * 1000;

    let animId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      // Smooth easeOutExpo curve
      const easedProgress =
        progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      const current = startVal + (endVal - startVal) * easedProgress;
      setDisplayValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(tick);
      } else {
        setDisplayValue(endVal);
        prevValue.current = endVal;
      }
    };

    animId = requestAnimationFrame(tick);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [value, isInView, duration, shouldReduceMotion]);

  const formattedNumber = formatter
    ? formatter(displayValue)
    : decimals > 0
    ? displayValue.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : Math.round(displayValue).toLocaleString("en-US");

  return (
    <span ref={ref} className={`font-tabular inline-block ${className}`}>
      {prefix}
      {formattedNumber}
      {suffix}
    </span>
  );
}
