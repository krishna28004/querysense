"use client";

import { AnimatePresence, motion } from "framer-motion";

interface SuccessCelebrationProps {
  show: boolean;
  score: number;
}

export default function SuccessCelebration({ show, score }: SuccessCelebrationProps) {
  const strong = score >= 80;

  return (
    <AnimatePresence>
      {show && strong && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="rounded-[var(--qs-radius-lg)] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, -15, 10, 0] }}
              transition={{ duration: 0.7, repeat: 1 }}
              className="text-emerald-300"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>
            <p className="text-sm text-emerald-300 font-semibold">
              Optimization complete - high impact improvements detected.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
