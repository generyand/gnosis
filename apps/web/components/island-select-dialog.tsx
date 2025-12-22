"use client";

import { motion, AnimatePresence } from "motion/react";
import { Map, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IslandMatch } from "@/lib/mock-data";

interface IslandSelectDialogProps {
  isOpen: boolean;
  topic: string;
  matches: IslandMatch[];
  onSelectIsland: (rootId: string) => void;
  onNewIsland: () => void;
  onCancel: () => void;
}

export function IslandSelectDialog({
  isOpen,
  topic,
  matches,
  onSelectIsland,
  onNewIsland,
  onCancel,
}: IslandSelectDialogProps) {
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
            <div className="relative rounded-xl border border-slate-700/50 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl">
              {/* Close button */}
              <button
                onClick={onCancel}
                className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Header */}
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20">
                  <Map className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">
                    Choose Destination
                  </h2>
                  <p className="text-sm text-slate-400">
                    Where should &ldquo;{topic}&rdquo; go?
                  </p>
                </div>
              </div>

              {/* Island options */}
              <div className="mb-4 space-y-2">
                {matches.map((match, index) => {
                  const scorePercent = Math.round(match.score * 100);
                  const isTopMatch = index === 0;

                  return (
                    <motion.button
                      key={match.rootId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => onSelectIsland(match.rootId)}
                      className={`group w-full rounded-lg border px-4 py-3 text-left transition-all ${
                        isTopMatch
                          ? "border-primary/50 bg-primary/10 hover:border-primary hover:bg-primary/20"
                          : "border-slate-700/30 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-700/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {isTopMatch ? "🎯" : "📍"}
                          </span>
                          <div>
                            <span
                              className={`font-medium ${
                                isTopMatch ? "text-primary" : "text-slate-200"
                              }`}
                            >
                              {match.rootLabel}
                            </span>
                            {isTopMatch && (
                              <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
                                Best match
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            scorePercent >= 70
                              ? "text-green-400"
                              : scorePercent >= 40
                                ? "text-amber-400"
                                : "text-slate-400"
                          }`}
                        >
                          {scorePercent}%
                        </span>
                      </div>
                      {match.closestMatch && (
                        <p className="mt-1 text-xs text-slate-500">
                          Closest: {match.closestMatch}
                        </p>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* New island option */}
              <Button
                onClick={onNewIsland}
                variant="outline"
                className="w-full gap-2 border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
              >
                <Sparkles className="h-4 w-4" />
                Start New Island
              </Button>

              {/* Hint */}
              <p className="mt-4 text-center text-xs text-slate-500">
                Topics are routed based on semantic similarity
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
