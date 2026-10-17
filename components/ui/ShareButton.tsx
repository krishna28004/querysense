"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";
import { AnalysisResponse } from "@/lib/analyzer/types";
import Toast from "./Toast";
import Spinner from "./Spinner";

interface ShareButtonProps {
  analysisResult: AnalysisResponse;
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

export default function ShareButton({ analysisResult }: ShareButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  const handleClick = async () => {
    if (slug) {
      await navigator.clipboard.writeText(`${baseUrl}/share/${slug}`);
      setToastMessage("Link copied!");
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_query: analysisResult.original_query,
          optimized_query: analysisResult.optimized_query,
          score: analysisResult.score,
          severity: analysisResult.severity,
          issues: analysisResult.issues,
          metrics: analysisResult.metrics,
          explanation: analysisResult.explanation,
        }),
      });

      if (!res.ok) throw new Error("Failed to create share link");

      const data = await res.json();
      setSlug(data.slug);
      await navigator.clipboard.writeText(`${baseUrl}/share/${data.slug}`);
      setToastMessage("Link copied!");
      setShowToast(true);
    } catch {
      setToastMessage("Failed to create share link");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 rounded-[var(--qs-radius-md)] text-xs font-medium text-[var(--qs-text-secondary)] hover:text-[var(--qs-text-primary)] hover:bg-[var(--qs-bg-elevated)] transition-colors duration-200 border border-[var(--qs-border)]"
      >
        {loading ? (
          <Spinner size="sm" />
        ) : (
          <>
            <Share2 size={14} />
            <span>Share</span>
          </>
        )}
      </button>
      <Toast
        message={toastMessage}
        show={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  );
}
