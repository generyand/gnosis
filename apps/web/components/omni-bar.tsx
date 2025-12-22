"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Trash2, Play } from "lucide-react";
import { SuggestionDropdown } from "@/components/suggestion-dropdown";
import {
  useFuzzySearch,
  type FuzzyMatch,
  type SpellCheckResult,
} from "@/hooks/use-fuzzy-search";
import type { GraphNode } from "@/lib/api/schemas";

interface OmniBarProps {
  onSubmit: (topic: string) => void;
  onClear: () => void;
  isLoading?: boolean;
  hasNodes?: boolean;
  placeholder?: string;
  /** Graph nodes for fuzzy matching suggestions */
  nodes?: GraphNode[];
  /** Called when a potential typo is detected before submit */
  onTypoDetected?: (spellCheck: SpellCheckResult) => void;
}

export function OmniBar({
  onSubmit,
  onClear,
  isLoading = false,
  hasNodes = false,
  placeholder = "Enter a topic to explore...",
  nodes = [],
  onTypoDetected,
}: OmniBarProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fuzzy search hook
  const { matches, spellCheck, hasExactMatch } = useFuzzySearch(value, {
    nodes,
    debounceMs: 300,
    threshold: 0.6,
  });

  // Show suggestions when there are matches and input is focused
  useEffect(() => {
    if (matches.length > 0 && isFocused && value.trim().length >= 2) {
      setShowSuggestions(true);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }
  }, [matches, isFocused, value]);

  // Keyboard shortcut: Cmd/Ctrl + K to focus
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Handle selecting a match
  const handleSelectMatch = useCallback((match: FuzzyMatch) => {
    setValue(match.label);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, []);

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && matches.length > 0) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, matches.length - 1));
          return;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          return;
        case "Tab":
          e.preventDefault();
          if (matches[selectedIndex]) {
            handleSelectMatch(matches[selectedIndex]);
          }
          return;
        case "Escape":
          e.preventDefault();
          setShowSuggestions(false);
          return;
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;

    // If suggestions are open and user pressed Enter, select the highlighted one
    if (showSuggestions && matches.length > 0 && matches[selectedIndex]) {
      handleSelectMatch(matches[selectedIndex]);
      return;
    }

    // Check for typos before submitting
    // Skip if: exact match exists, or no spell errors found
    if (spellCheck?.hasErrors && !hasExactMatch && onTypoDetected) {
      onTypoDetected(spellCheck);
      return;
    }

    // Submit normally
    onSubmit(trimmed);
    setValue("");
    setShowSuggestions(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    // Delay hiding to allow click on suggestions
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
    }, 150);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-1/2 z-50 w-full max-w-xl -translate-x-1/2 px-3 sm:bottom-8 sm:px-4"
    >
      <form onSubmit={handleSubmit}>
        <div className="relative">
          {/* Suggestion dropdown (positioned above input) */}
          <SuggestionDropdown
            matches={matches}
            isVisible={showSuggestions}
            onSelect={handleSelectMatch}
            selectedIndex={selectedIndex}
          />

          <motion.div
            animate={{
              boxShadow: isLoading
                ? "0 0 0 2px rgba(168, 85, 247, 0.5), 0 0 60px rgba(168, 85, 247, 0.3)"
                : isFocused
                  ? "0 0 0 2px rgba(139, 92, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.15)"
                  : "0 0 0 1px rgba(255, 255, 255, 0.1)",
            }}
            transition={{ duration: 0.3 }}
            className={`flex items-center gap-2 rounded-2xl border bg-card/80 p-2 backdrop-blur-xl ${
              isLoading ? "border-primary/50" : "border-border"
            }`}
          >
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={isLoading}
                className="border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                autoComplete="off"
              />
            </div>

            <AnimatePresence mode="wait">
              {hasNodes && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onClear}
                    disabled={isLoading}
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              animate={isLoading ? { scale: [1, 1.02, 1] } : {}}
              transition={
                isLoading
                  ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                  : {}
              }
            >
              <Button
                type="submit"
                disabled={!value.trim() || isLoading}
                className={`h-9 gap-1.5 rounded-xl px-3 text-primary-foreground sm:gap-2 sm:px-4 ${
                  isLoading
                    ? "bg-primary/80 shadow-lg shadow-primary/30"
                    : "bg-primary"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Expanding...</span>
                  </>
                ) : hasNodes ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Expand</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span className="hidden sm:inline">Start</span>
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        </div>

        <div className="mt-2 hidden text-center text-xs text-muted-foreground sm:block">
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>{" "}
          to focus
        </div>
      </form>
    </motion.div>
  );
}
