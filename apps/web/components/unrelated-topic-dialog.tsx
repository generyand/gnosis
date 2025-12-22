"use client";

import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, Sparkles, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UnrelatedTopicDialogProps {
  isOpen: boolean;
  topic: string;
  closestMatch: string | null;
  similarityScore: number;
  onStartNewTopic: () => void;
  onConnectAnyway: () => void;
  onCancel: () => void;
}

export function UnrelatedTopicDialog({
  isOpen,
  topic,
  closestMatch,
  similarityScore,
  onStartNewTopic,
  onConnectAnyway,
  onCancel,
}: UnrelatedTopicDialogProps) {
  const scorePercent = Math.round(similarityScore * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4"
          >
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl">
              {/* Header */}
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">
                    New Topic Detected
                  </h2>
                  <p className="text-sm text-slate-400">
                    &ldquo;{topic}&rdquo; seems unrelated to your current graph
                  </p>
                </div>
              </div>

              {/* Similarity info */}
              {closestMatch && (
                <div className="mb-6 rounded-lg border border-slate-700/30 bg-slate-800/50 px-4 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Closest match:</span>
                    <span className="font-medium text-slate-300">
                      {closestMatch}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-slate-400">Similarity:</span>
                    <span
                      className={`font-medium ${
                        scorePercent < 30
                          ? "text-red-400"
                          : scorePercent < 50
                            ? "text-amber-400"
                            : "text-green-400"
                      }`}
                    >
                      {scorePercent}%
                    </span>
                  </div>
                  {/* Similarity bar */}
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${scorePercent}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className={`h-full ${
                        scorePercent < 30
                          ? "bg-red-500"
                          : scorePercent < 50
                            ? "bg-amber-500"
                            : "bg-green-500"
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={onStartNewTopic}
                  className="flex-1 gap-2 bg-primary hover:bg-primary/90"
                >
                  <Sparkles className="h-4 w-4" />
                  Start New Topic
                </Button>
                <Button
                  onClick={onConnectAnyway}
                  variant="outline"
                  className="flex-1 gap-2 border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
                >
                  <Link2 className="h-4 w-4" />
                  Connect Anyway
                </Button>
              </div>

              {/* Hint */}
              <p className="mt-4 text-center text-xs text-slate-500">
                Starting a new topic creates a separate island in your graph
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
