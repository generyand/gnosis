"use client";

import { useMemo, useState, useEffect } from "react";
import { findFuzzyMatches, type FuzzyMatch } from "@/lib/fuzzy-match";
import { checkSpelling, type SpellCheckResult } from "@/lib/spell-check";
import type { GraphNode } from "@/lib/api/schemas";

export type { FuzzyMatch } from "@/lib/fuzzy-match";
export type { SpellCheckResult } from "@/lib/spell-check";

interface UseFuzzySearchOptions {
  /** List of nodes to search against */
  nodes: GraphNode[];
  /** Debounce delay in ms. Default: 300 */
  debounceMs?: number;
  /** Minimum input length to trigger search. Default: 2 */
  minLength?: number;
  /** Similarity threshold (0-1). Default: 0.6 */
  threshold?: number;
}

interface UseFuzzySearchResult {
  /** Matching nodes sorted by similarity */
  matches: FuzzyMatch[];
  /** Spell check result (null if input too short) */
  spellCheck: SpellCheckResult | null;
  /** Whether search is in progress (during debounce) */
  isSearching: boolean;
  /** Whether an exact match exists in nodes */
  hasExactMatch: boolean;
}

/**
 * Hook for fuzzy searching against graph nodes with spell checking
 * Debounces input to avoid excessive computation
 */
export function useFuzzySearch(
  input: string,
  options: UseFuzzySearchOptions
): UseFuzzySearchResult {
  const { nodes, debounceMs = 300, minLength = 2, threshold = 0.6 } = options;

  const [debouncedInput, setDebouncedInput] = useState(input);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce the input
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedInput(input);
      setIsSearching(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [input, debounceMs]);

  // Find fuzzy matches against node labels
  const matches = useMemo(() => {
    if (debouncedInput.trim().length < minLength) return [];
    return findFuzzyMatches(debouncedInput, nodes, { threshold });
  }, [debouncedInput, nodes, threshold, minLength]);

  // Check for spelling errors
  const spellCheck = useMemo(() => {
    if (debouncedInput.trim().length < minLength) return null;
    return checkSpelling(debouncedInput);
  }, [debouncedInput, minLength]);

  // Check if exact match exists (case-insensitive)
  const hasExactMatch = useMemo(() => {
    const inputLower = debouncedInput.toLowerCase().trim();
    if (inputLower.length === 0) return false;
    return nodes.some((n) => n.label.toLowerCase() === inputLower);
  }, [debouncedInput, nodes]);

  return {
    matches,
    spellCheck,
    isSearching,
    hasExactMatch,
  };
}
