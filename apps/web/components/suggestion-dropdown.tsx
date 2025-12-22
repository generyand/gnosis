"use client";

import { motion, AnimatePresence } from "motion/react";
import { Search } from "lucide-react";
import type { FuzzyMatch } from "@/lib/fuzzy-match";

interface SuggestionDropdownProps {
  /** List of fuzzy matches to display */
  matches: FuzzyMatch[];
  /** Whether the dropdown is visible */
  isVisible: boolean;
  /** Callback when a match is selected */
  onSelect: (match: FuzzyMatch) => void;
  /** Currently selected index for keyboard navigation */
  selectedIndex: number;
}

export function SuggestionDropdown({
  matches,
  isVisible,
  onSelect,
  selectedIndex,
}: SuggestionDropdownProps) {
  if (!isVisible || matches.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.15 }}
        className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-border bg-card/95 shadow-xl backdrop-blur-xl"
      >
        <div className="flex items-center gap-1.5 border-b border-border px-3 py-2 text-xs text-muted-foreground">
          <Search className="h-3 w-3" />
          <span>Similar topics in your graph</span>
        </div>

        <ul className="max-h-48 overflow-y-auto py-1">
          {matches.map((match, index) => (
            <li key={match.nodeId}>
              <button
                type="button"
                onClick={() => onSelect(match)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  index === selectedIndex
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted/50"
                }`}
              >
                <span className="truncate">{match.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {Math.round(match.score * 100)}%
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
          <kbd className="rounded bg-muted px-1 py-0.5 font-mono">↑↓</kbd> to
          navigate,{" "}
          <kbd className="rounded bg-muted px-1 py-0.5 font-mono">Tab</kbd> to
          select
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
