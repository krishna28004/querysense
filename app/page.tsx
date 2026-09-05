"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { CheckCircle, Zap, Shield, Clock, TrendingUp, AlertTriangle, ArrowRight, Database } from "lucide-react";

export default function LandingPage() {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
      },
    },
  };

  return (
    <div className="min-h-screen bg-[var(--qs-bg-primary)] text-[var(--qs-text-primary)]">
      {/* Background elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 qs-bg-grid"></div>
        <div className="absolute inset-0 qs-bg-radial"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation */}
        <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between border-b border-[var(--qs-border)] bg-[var(--qs-bg-primary)]/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[var(--qs-text-secondary)]" />
            <span className="text-lg font-semibold tracking-tight text-[var(--qs-text-primary)]">QuerySense</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/editor?sample=kitchen-sink"
              className="text-sm font-medium text-[var(--qs-text-secondary)] hover:text-[var(--qs-text-primary)] transition-colors"
            >
              Analyze
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-grow">
          {/* Hero Section */}
          <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 text-center">
            <motion.div
              initial={shouldReduceMotion ? "visible" : "hidden"}
              animate="visible"
              variants={containerVariants}
              className="max-w-4xl mx-auto flex flex-col items-center"
            >
              <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                A Lighthouse for Your Database.
              </motion.h1>
              
              <motion.p variants={itemVariants} className="text-lg md:text-xl text-[var(--qs-text-secondary)] mb-10 max-w-2xl">
                Analyze, optimize, and score your SQL queries instantly. Professional diagnostic tooling for software engineers.
              </motion.p>
              
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4">
                <Link href="/editor?sample=kitchen-sink">
                  <Button size="lg" className="font-semibold px-8">
                    Start Analysis
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>

              <motion.div variants={itemVariants} className="mt-16 w-full max-w-4xl border border-[var(--qs-border)] bg-[var(--qs-bg-elevated)] rounded-[var(--qs-radius-lg)] shadow-[var(--qs-shadow-lg)] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--qs-border)] bg-[var(--qs-bg-card)]">
                  <div className="w-3 h-3 rounded-full bg-[var(--qs-border)]"></div>
                  <div className="w-3 h-3 rounded-full bg-[var(--qs-border)]"></div>
                  <div className="w-3 h-3 rounded-full bg-[var(--qs-border)]"></div>
                  <span className="ml-4 text-xs font-mono text-[var(--qs-text-muted)]">query_analysis.sql</span>
                </div>
                <div className="p-6 text-left bg-[var(--qs-bg-card)] font-mono text-sm text-[var(--qs-text-secondary)]">
                  <div><span className="text-[var(--qs-accent)]">SELECT</span> *</div>
                  <div><span className="text-[var(--qs-accent)]">FROM</span> orders o</div>
                  <div><span className="text-[var(--qs-accent)]">JOIN</span> customers c <span className="text-[var(--qs-accent)]">ON</span> o.customer_id = c.id</div>
                  <div><span className="text-[var(--qs-error)]">-- Missing WHERE clause</span></div>
                  <div><span className="text-[var(--qs-error)]">-- Potential Cartesian product explosion</span></div>
                </div>
              </motion.div>
            </motion.div>
          </section>

          {/* Value Proposition */}
          <section className="border-y border-[var(--qs-border)] bg-[var(--qs-bg-secondary)] mt-12">
            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="flex flex-col">
                  <div className="w-10 h-10 rounded border border-[var(--qs-border)] bg-[var(--qs-bg-card)] flex items-center justify-center mb-4">
                    <Zap className="w-5 h-5 text-[var(--qs-text-primary)]" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">Deterministic Analysis</h3>
                  <p className="text-sm text-[var(--qs-text-secondary)]">Structural AST parsing identifies Cartesian joins, missing limits, and index opportunities mathematically.</p>
                </div>
                <div className="flex flex-col">
                  <div className="w-10 h-10 rounded border border-[var(--qs-border)] bg-[var(--qs-bg-card)] flex items-center justify-center mb-4">
                    <Shield className="w-5 h-5 text-[var(--qs-text-primary)]" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">AI-Assisted Rewrites</h3>
                  <p className="text-sm text-[var(--qs-text-secondary)]">Semantic SQL rewrites generated contextually while constrained by deterministic rules to prevent hallucination.</p>
                </div>
                <div className="flex flex-col">
                  <div className="w-10 h-10 rounded border border-[var(--qs-border)] bg-[var(--qs-bg-card)] flex items-center justify-center mb-4">
                    <TrendingUp className="w-5 h-5 text-[var(--qs-text-primary)]" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">Pre-deployment Scoring</h3>
                  <p className="text-sm text-[var(--qs-text-secondary)]">Standardized 0-100 health scoring and severity grading for every query before it hits production.</p>
                </div>
              </div>
            </div>
          </section>

        </main>

        {/* Footer */}
        <footer className="border-t border-[var(--qs-border)] bg-[var(--qs-bg-card)] mt-auto">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[var(--qs-text-secondary)] text-sm">
              <Database className="w-4 h-4" />
              <span className="font-semibold text-[var(--qs-text-primary)]">QuerySense</span>
              <span className="border-l border-[var(--qs-border)] pl-2 ml-1">Lighthouse for your database.</span>
            </div>
            
            <a 
              href="https://github.com/krishna28004/querysense" 
              target="_blank" 
              rel="noreferrer"
              className="text-[var(--qs-text-secondary)] hover:text-[var(--qs-text-primary)] flex items-center gap-2 text-sm transition-colors"
            >
              GitHub
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
