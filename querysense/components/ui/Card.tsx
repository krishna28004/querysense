"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

type CardVariant = "default" | "glass" | "gradient" | "interactive";

interface CardProps extends Omit<HTMLMotionProps<"div">, "ref" | "children"> {
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  children?: React.ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default:
    "bg-[var(--qs-bg-card)] border border-[var(--qs-border)]",
  glass:
    "qs-glass",
  gradient:
    "qs-border-gradient",
  interactive:
    "bg-[var(--qs-bg-card)] border border-[var(--qs-border)] hover:border-[var(--qs-border-hover)] hover:bg-[var(--qs-bg-card-hover)] cursor-pointer",
};

const paddingStyles: Record<string, string> = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-7",
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = "default",
      padding = "md",
      hover = false,
      children,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        whileHover={
          hover
            ? { y: -2, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }
            : undefined
        }
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`
          rounded-[var(--qs-radius-lg)]
          shadow-[var(--qs-shadow-sm)]
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${className}
        `}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = "Card";
export default Card;
