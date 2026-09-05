"use client";

import Editor, { loader, OnMount } from "@monaco-editor/react";

// Configure monaco loading CDN if needed, but default is fine.
loader.config({ paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.43.0/min/vs" } });

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SQLEditor({ value, onChange }: SQLEditorProps) {
  const handleEditorChange = (val: string | undefined) => {
    onChange(val || "");
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    // Define custom theme for our premium dark design
    monaco.editor.defineTheme("querysense-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "1677FF", fontStyle: "bold" },
        { token: "string", foreground: "F3B84B" },
        { token: "number", foreground: "A78BFA" },
        { token: "comment", foreground: "71839A", fontStyle: "italic" },
        { token: "identifier", foreground: "E2E8F0" },
        { token: "predefined", foreground: "28C7E8" }
      ],
      colors: {
        "editor.background": "#0B1421",
        "editor.foreground": "#E2E8F0",
        "editor.lineHighlightBackground": "#1e293b50",
        "editorLineNumber.foreground": "#71839A",
        "editorLineNumber.activeForeground": "#F4F7FB",
        "editor.selectionBackground": "#1677FF40",
      },
    });

    // Set active theme
    monaco.editor.setTheme("querysense-dark");
  };

  return (
    <div className="w-full h-full min-h-[220px]">
      <Editor
        height="220px"
        defaultLanguage="sql"
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        loading={
          <div className="flex flex-col items-center justify-center h-[220px] bg-[#0B1421] text-xs text-[var(--qs-text-muted)] font-mono gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-[var(--qs-accent)] border-t-transparent animate-spin" />
            Initializing Monaco SQL Engine...
          </div>
        }
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "Geist Mono, JetBrains Mono, monospace",
          lineNumbers: "on",
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: false,
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          contextmenu: false,
        }}
      />
    </div>
  );
}
