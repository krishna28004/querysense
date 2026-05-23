"use client";

import { motion } from "framer-motion";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const detectionCategories = [
  { name: "SELECT *", severity: "warning" as const },
  { name: "Missing WHERE", severity: "critical" as const },
  { name: "Full Table Scan", severity: "warning" as const },
  { name: "Bad JOINs", severity: "critical" as const },
  { name: "N+1 Patterns", severity: "critical" as const },
  { name: "Missing LIMIT", severity: "info" as const },
  { name: "Nested Subqueries", severity: "warning" as const },
  { name: "Expensive Aggregation", severity: "warning" as const },
  { name: "Redundant ORDER BY", severity: "info" as const },
  { name: "Query Complexity", severity: "info" as const },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function AboutPage() {
  return (
    <>
      <Sidebar />
      <main className="flex-1 ml-[var(--qs-sidebar-width)] flex flex-col min-h-screen">
        <Header />

        <div className="flex-1 qs-bg-grid qs-bg-radial">
          <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-2"
            >
              <h1 className="text-2xl font-bold text-[var(--qs-text-primary)]">
                How <span className="qs-text-gradient">QuerySense</span> Works
              </h1>
              <p className="text-sm text-[var(--qs-text-secondary)] max-w-2xl">
                QuerySense combines deterministic rule-based analysis with AI-powered
                semantic reasoning to give you fast, accurate, and explainable
                SQL optimization.
              </p>
            </motion.div>

            {/* Pipeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card variant="default" padding="lg">
                <h2 className="text-base font-semibold text-[var(--qs-text-primary)] mb-4">
                  Analysis Pipeline
                </h2>
                <div className="flex flex-col md:flex-row items-stretch gap-3">
                  {[
                    { step: "1", title: "Parse", desc: "Normalize & tokenize SQL" },
                    { step: "2", title: "Rules", desc: "10 deterministic checks" },
                    { step: "3", title: "AI", desc: "GPT-4o-mini reasoning" },
                    { step: "4", title: "Score", desc: "Merge & rank results" },
                  ].map((item, i) => (
                    <div key={item.step} className="flex-1 flex items-center gap-3">
                      <div className="flex-1 bg-[var(--qs-bg-secondary)] rounded-[var(--qs-radius-md)] p-4 text-center">
                        <div className="text-lg font-bold qs-text-gradient mb-1">
                          {item.step}
                        </div>
                        <div className="text-sm font-semibold text-[var(--qs-text-primary)]">
                          {item.title}
                        </div>
                        <div className="text-xs text-[var(--qs-text-muted)] mt-0.5">
                          {item.desc}
                        </div>
                      </div>
                      {i < 3 && (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--qs-text-muted)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="flex-shrink-0 hidden md:block"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Detection Categories */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <h2 className="text-base font-semibold text-[var(--qs-text-primary)] mb-3">
                Detection Categories
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {detectionCategories.map((cat) => (
                  <motion.div key={cat.name} variants={itemVariants}>
                    <Card
                      variant="default"
                      padding="sm"
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="text-xs font-medium text-[var(--qs-text-primary)] truncate">
                        {cat.name}
                      </span>
                      <Badge variant={cat.severity} size="sm">
                        {cat.severity}
                      </Badge>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Tech Stack */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card variant="glass" padding="lg">
                <h2 className="text-base font-semibold text-[var(--qs-text-primary)] mb-3">
                  Built With
                </h2>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Next.js 15",
                    "TypeScript",
                    "Tailwind CSS v4",
                    "Framer Motion",
                    "Prisma",
                    "PostgreSQL",
                    "OpenAI GPT-4o-mini",
                    "Monaco Editor",
                    "Vercel",
                  ].map((tech) => (
                    <span
                      key={tech}
                      className="
                        px-3 py-1.5 text-xs font-medium
                        bg-[var(--qs-bg-elevated)]
                        text-[var(--qs-text-secondary)]
                        rounded-full
                        border border-[var(--qs-border)]
                      "
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}
