"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, X } from "lucide-react";
import type { SpellCheckResult } from "@/lib/spell-check";

interface TypoDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Spell check result containing original and corrected text */
  spellCheck: SpellCheckResult;
  /** Called when user accepts the correction */
  onAccept: (corrected: string) => void;
  /** Called when user rejects the correction (keeps original) */
  onReject: (original: string) => void;
  /** Called when dialog is cancelled (e.g., click outside) */
  onCancel: () => void;
}

export function TypoDialog({
  isOpen,
  spellCheck,
  onAccept,
  onReject,
  onCancel,
}: TypoDialogProps) {
  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    },
    [onCancel]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
        >
          {/* Header */}
          <div className="mb-4 flex items-start gap-3">
            <div className="rounded-full bg-amber-500/10 p-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Possible typo detected
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Did you mean to type:
              </p>
            </div>
          </div>

          {/* Comparison */}
          <div className="mb-6 space-y-3">
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="mb-1 text-xs text-muted-foreground">You typed:</p>
              <p className="font-mono text-sm text-muted-foreground line-through">
                {spellCheck.original}
              </p>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="mb-1 text-xs text-primary">Suggested:</p>
              <p className="font-mono text-sm text-foreground">
                {spellCheck.corrected}
              </p>
            </div>
          </div>

          {/* Typo details */}
          {spellCheck.corrections.length > 0 && (
            <div className="mb-6 rounded-lg bg-muted/20 p-3">
              <p className="mb-2 text-xs text-muted-foreground">
                Detected {spellCheck.corrections.length} potential{" "}
                {spellCheck.corrections.length === 1 ? "typo" : "typos"}:
              </p>
              <div className="flex flex-wrap gap-2">
                {spellCheck.corrections.map((c, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
                  >
                    <span className="text-muted-foreground line-through">
                      {c.word}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-foreground">{c.suggestion}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={() => onAccept(spellCheck.corrected)}
              className="flex-1 gap-2"
            >
              <Check className="h-4 w-4" />
              Use suggestion
            </Button>
            <Button
              variant="outline"
              onClick={() => onReject(spellCheck.original)}
              className="flex-1 gap-2"
            >
              <X className="h-4 w-4" />
              Keep original
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
