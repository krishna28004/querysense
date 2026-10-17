import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/workbench/ThemeProvider";
import VelocityCursor from "@/components/workbench/VelocityCursor";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")),
  title: "QuerySense — Evidence-led PostgreSQL query diagnosis",
  description:
    "Inspect PostgreSQL SQL and JSON plans. Turn real query evidence into testable performance hypotheses.",
  openGraph: {
    title: "QuerySense — Evidence-led PostgreSQL query diagnosis",
    description: "Inspect PostgreSQL SQL and JSON plans. Turn real query evidence into testable performance hypotheses.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
  },
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
    <html lang="en" suppressHydrationWarning>
      <body><ThemeProvider><VelocityCursor/>{children}</ThemeProvider></body>
    </html>
  );
}
