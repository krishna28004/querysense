"use client";

import ReactDiffViewer from "react-diff-viewer-continued";

interface DiffViewerProps {
  oldValue: string;
  newValue: string;
  splitView?: boolean;
}

export default function DiffViewer({ oldValue, newValue, splitView = true }: DiffViewerProps) {
  const customStyles = {
    variables: {
      dark: {
        diffViewerBackground: "#0b0f19",
        diffViewerColor: "#e2e8f0",
        addedBackground: "#065f4640",
        addedColor: "#34d399",
        addedGutterBackground: "#065f4650",
        removedBackground: "#991b1b40",
        removedColor: "#f87171",
        removedGutterBackground: "#991b1b50",
        wordAddedBackground: "#05966960",
        wordRemovedBackground: "#dc262660",
        emptyLineBackground: "#0b0f19",
        gutterBackground: "#0b0f19",
        gutterColor: "#475569",
        gutterHeaderBackground: "#1e293b",
        gutterHeaderColor: "#94a3b8",
        gutterHeaderBorderColor: "#334155",
      },
    },
    line: {
      padding: "8px 12px",
      fontSize: "13px",
      lineHeight: "1.6",
      fontFamily: "Geist Mono, JetBrains Mono, monospace",
    },
    gutter: {
      padding: "8px 8px",
      fontSize: "11px",
      fontFamily: "Geist Mono, JetBrains Mono, monospace",
      borderRight: "1px solid #1e293b",
    },
    titleBlock: {
      background: "#111827",
      color: "#94a3b8",
      padding: "10px 16px",
      fontSize: "12px",
      fontFamily: "var(--font-geist-mono)",
      borderBottom: "1px solid #1e293b",
      fontWeight: "600",
    },
  };

  return (
    <div className="w-full rounded-[var(--qs-radius-lg)] overflow-hidden border border-[var(--qs-border)] bg-[#0b0f19]">
      <ReactDiffViewer
        oldValue={oldValue}
        newValue={newValue}
        splitView={splitView}
        useDarkTheme
        styles={customStyles}
        leftTitle="Original Query"
        rightTitle="Optimized Query"
        showDiffOnly={false}
      />
    </div>
  );
}
