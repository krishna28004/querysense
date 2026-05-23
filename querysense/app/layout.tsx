import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "QuerySense — AI-Powered Database Query Optimizer",
  description:
    "Paste your SQL query and get instant performance intelligence. Detect bottlenecks, optimize queries, and understand performance impacts with AI-powered analysis.",
  keywords: [
    "SQL",
    "query optimizer",
    "database performance",
    "AI",
    "PostgreSQL",
  ],
  authors: [{ name: "QuerySense" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} dark`}
    >
      <body className="min-h-screen bg-[var(--qs-bg-primary)] text-[var(--qs-text-primary)] font-[family-name:var(--font-geist-sans)] antialiased">
        <div className="flex min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
