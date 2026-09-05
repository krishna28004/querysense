import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuerySense — Lighthouse for your database",
  description:
    "Paste SQL. Get instant performance intelligence. No database connection required.",
  openGraph: {
    title: "QuerySense — Lighthouse for your database",
    description: "Paste SQL. Get instant performance intelligence. No database connection required.",
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
    <html
      lang="en"
      className="dark"
      suppressHydrationWarning
    >
      <body className="min-h-screen w-full overflow-x-hidden bg-[var(--qs-bg-primary)] text-[var(--qs-text-primary)] antialiased font-sans">
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          <div className="flex min-h-screen">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
