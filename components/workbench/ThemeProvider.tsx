"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <NextThemeProvider attribute="data-theme" defaultTheme="system" enableSystem storageKey="querysense-theme">{children}</NextThemeProvider>;
}
