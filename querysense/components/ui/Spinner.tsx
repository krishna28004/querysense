"use client";

import { motion } from "framer-motion";

type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}

const sizeMap: Record<SpinnerSize, { ring: number; stroke: number }> = {
  sm: { ring: 16, stroke: 2 },
  md: { ring: 24, stroke: 2.5 },
  lg: { ring: 36, stroke: 3 },
};

const textSizes: Record<SpinnerSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export default function Spinner({
  size = "md",
  className = "",
  label,
}: SpinnerProps) {
  const { ring, stroke } = sizeMap[size];
  const radius = (ring - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <motion.svg
        width={ring}
        height={ring}
        viewBox={`0 0 ${ring} ${ring}`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <circle
          cx={ring / 2}
          cy={ring / 2}
          r={radius}
          fill="none"
          stroke="var(--qs-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={ring / 2}
          cy={ring / 2}
          r={radius}
          fill="none"
          stroke="var(--qs-accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.7}
        />
      </motion.svg>
      {label && (
        <span
          className={`text-[var(--qs-text-muted)] ${textSizes[size]}`}
        >
          {label}
        </span>
      )}
    </div>
  );
}
