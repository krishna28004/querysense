"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

interface ToastProps {
  message: string;
  show: boolean;
  onClose: () => void;
}

export default function Toast({ message, show, onClose }: ToastProps) {
  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      onClose();
    }, 2000);

    return () => clearTimeout(timer);
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[var(--qs-bg-elevated)] border border-[var(--qs-border)] rounded-[var(--qs-radius-md)] px-4 py-3 shadow-lg backdrop-blur-md"
          initial={{ opacity: 0, y: 20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20, x: 20 }}
        >
          <Check size={16} className="text-emerald-400" />
          <span className="text-sm text-[var(--qs-text-primary)]">
            {message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
