"use client";

import Editor, { loader } from "@monaco-editor/react";

// Configure monaco loading CDN if needed, but default is fine.
loader.config({ paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.43.0/min/vs" } });

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SQLEditor({ value, onChange, placeholder }: SQLEditorProps) {
  const handleEditorChange = (val: string | undefined) => {
    onChange(val || "");
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    // Define custom theme for our premium dark design
    monaco.editor.defineTheme("querysense-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "f43f5e", fontStyle: "bold" }, // Rose accent for key SQL keywords
        { token: "string", foreground: "10b981" }, // Emerald for strings
        { token: "number", foreground: "f59e0b" }, // Amber for numbers
        { token: "comment", foreground: "6b7280", fontStyle: "italic" }, // Slate for comments
        { token: "identifier", foreground: "e2e8f0" }, // Light text for identifiers
      ],
      colors: {
        "editor.background": "#0b0f19", // Deep space dark background matching our premium palette
        "editor.foreground": "#e2e8f0",
        "editor.lineHighlightBackground": "#1e293b50",
        "editorLineNumber.foreground": "#475569",
        "editorLineNumber.activeForeground": "#f43f5e",
        "editor.selectionBackground": "#33415580",
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
          <div className="flex flex-col items-center justify-center h-[220px] bg-[#0b0f19] text-xs text-[var(--qs-text-muted)] font-mono gap-3">
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
