"use client";

export default function SkeletonLoader() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Score section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score ring skeleton */}
        <div className="flex items-center justify-center p-6">
          <div className="w-40 h-40 rounded-full bg-[var(--qs-bg-card)] border-4 border-[var(--qs-border)]" />
        </div>
        {/* Explanation skeleton */}
        <div className="md:col-span-2 space-y-3 p-4">
          <div className="h-4 bg-[var(--qs-bg-card)] rounded w-3/4" />
          <div className="h-3 bg-[var(--qs-bg-card)] rounded w-full" />
          <div className="h-3 bg-[var(--qs-bg-card)] rounded w-5/6" />
          <div className="h-3 bg-[var(--qs-bg-card)] rounded w-2/3" />
        </div>
      </div>
      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 rounded-[var(--qs-radius-lg)] border border-[var(--qs-border)] bg-[var(--qs-bg-card)] space-y-3"
          >
            <div className="h-3 bg-[var(--qs-bg-elevated)] rounded w-1/2" />
            <div className="h-8 bg-[var(--qs-bg-elevated)] rounded w-2/3" />
            <div className="h-1.5 bg-[var(--qs-bg-elevated)] rounded w-full" />
          </div>
        ))}
      </div>
      {/* Issues skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 rounded-[var(--qs-radius-lg)] border border-[var(--qs-border)] bg-[var(--qs-bg-card)] space-y-2"
          >
            <div className="flex justify-between">
              <div className="h-4 bg-[var(--qs-bg-elevated)] rounded w-1/3" />
              <div className="h-5 bg-[var(--qs-bg-elevated)] rounded-full w-16" />
            </div>
            <div className="h-3 bg-[var(--qs-bg-elevated)] rounded w-full" />
            <div className="h-3 bg-[var(--qs-bg-elevated)] rounded w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
