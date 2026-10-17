"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ScoreGaugeProps {
  score: number;
  severity: "critical" | "warning" | "info" | "good";
}

export default function ScoreGauge({ score, severity }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Animate the score number smoothly over 1.2s
    const start = 0;
    const end = score;
    if (start === end) {
      const t = setTimeout(() => setAnimatedScore(end), 0);
      return () => clearTimeout(t);
    }
    const duration = 1200;
    const range = end - start;
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    const timer = setInterval(() => {
      current += increment;
      setAnimatedScore(current);
      if (current === end) {
        clearInterval(timer);
      }
    }, Math.max(stepTime, 8));

    return () => clearInterval(timer);
  }, [score]);

  // Color mapping based on severity using CSS variables
  const severityColors = {
    critical: {
      text: "text-[var(--qs-error)]",
      stroke: "stroke-[var(--qs-error)]",
      bg: "bg-[var(--qs-error-bg)]",
      label: "Critical",
    },
    warning: {
      text: "text-[var(--qs-warning)]",
      stroke: "stroke-[var(--qs-warning)]",
      bg: "bg-[var(--qs-warning-bg)]",
      label: "Warning",
    },
    info: {
      text: "text-[var(--qs-info)]",
      stroke: "stroke-[var(--qs-info)]",
      bg: "bg-[var(--qs-info-bg)]",
      label: "Healthy",
    },
    good: {
      text: "text-[var(--qs-success)]",
      stroke: "stroke-[var(--qs-success)]",
      bg: "bg-[var(--qs-success-bg)]",
      label: "Optimal",
    },
  };

  const colors = severityColors[severity] || severityColors.info;

  // SVG Circle parameters for radial gauge
  const radius = 80;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Subtle background circle */}
        <div className={`absolute inset-4 rounded-full ${colors.bg} transition-all duration-700`} />

        {/* SVG Circle Gauge */}
        <svg className="w-full h-full transform -rotate-90 z-10" viewBox="0 0 200 200">
          {/* Background Track Circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            className="stroke-[var(--qs-border)]"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Foreground Animated Gauge Circle */}
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            className={`${colors.stroke} transition-colors duration-700`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>

        {/* Inner Text Value display */}
        <div className="absolute flex flex-col items-center justify-center z-20">
          <motion.span
            className="text-5xl font-extrabold tracking-tight font-mono text-[var(--qs-text-primary)]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            {animatedScore}
          </motion.span>
          <span className="text-[10px] text-[var(--qs-text-muted)] font-medium uppercase tracking-widest mt-1">
            Performance
          </span>
        </div>
      </div>

      {/* Health Badge */}
      <motion.div
        className="flex flex-col items-center space-y-1.5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <span className={`text-sm font-bold tracking-wide uppercase ${colors.text} transition-colors duration-700`}>
          {colors.label} Health
        </span>
        <p className="text-xs text-[var(--qs-text-muted)] max-w-[200px]">
          {score < 40
            ? "Urgent optimizations are required to prevent DB scaling failure."
            : score < 75
            ? "Performance can be significantly improved with standard index optimizations."
            : score < 95
            ? "Query is well-written with minor, optional optimization opportunities."
            : "Query is optimal and exhibits minimal scaling risks!"}
        </p>
      </motion.div>
    </div>
  );
}
