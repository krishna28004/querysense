"use client";

type BadgeVariant = "critical" | "warning" | "info" | "success" | "neutral";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  critical:
    "bg-[var(--qs-error-bg)] text-[var(--qs-error)] border-[var(--qs-error)]/20",
  warning:
    "bg-[var(--qs-warning-bg)] text-[var(--qs-warning)] border-[var(--qs-warning)]/20",
  info:
    "bg-[var(--qs-info-bg)] text-[var(--qs-info)] border-[var(--qs-info)]/20",
  success:
    "bg-[var(--qs-success-bg)] text-[var(--qs-success)] border-[var(--qs-success)]/20",
  neutral:
    "bg-[var(--qs-bg-elevated)] text-[var(--qs-text-secondary)] border-[var(--qs-border)]",
};

const dotColors: Record<BadgeVariant, string> = {
  critical: "bg-[var(--qs-error)]",
  warning: "bg-[var(--qs-warning)]",
  info: "bg-[var(--qs-info)]",
  success: "bg-[var(--qs-success)]",
  neutral: "bg-[var(--qs-text-muted)]",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
};

export default function Badge({
  variant = "neutral",
  size = "md",
  dot = false,
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium
        rounded-full border
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} animate-pulse`}
        />
      )}
      {children}
    </span>
  );
}
