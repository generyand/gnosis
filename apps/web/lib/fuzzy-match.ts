/**
 * Fuzzy string matching utilities for Gnosis
 * Uses Levenshtein distance for similarity scoring
 */

/**
 * Calculate Levenshtein distance between two strings
 * @returns Number of single-character edits needed to transform a into b
 */
export function levenshteinDistance(a: string, b: string): number {
  // Edge cases
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Create matrix with proper initialization
  const rows = b.length + 1;
  const cols = a.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => 0)
  );

  // Initialize first column
  for (let i = 0; i <= b.length; i++) {
    matrix[i]![0] = i;
  }

  // Initialize first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0]![j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const row = matrix[i]!;
      const prevRow = matrix[i - 1]!;

      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        row[j] = prevRow[j - 1]!;
      } else {
        row[j] = Math.min(
          prevRow[j - 1]! + 1, // substitution
          row[j - 1]! + 1, // insertion
          prevRow[j]! + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length]![a.length]!;
}

/**
 * Calculate similarity score (0-1) between two strings
 * 1 = identical, 0 = completely different
 */
export function similarityScore(a: string, b: string): number {
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  const maxLength = Math.max(a.length, b.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

export interface FuzzyMatch {
  label: string;
  nodeId: string;
  score: number;
}

export interface FindFuzzyMatchesOptions {
  /** Minimum similarity score (0-1) to include. Default: 0.6 */
  threshold?: number;
  /** Maximum number of matches to return. Default: 5 */
  maxResults?: number;
}

/**
 * Find fuzzy matches for input against existing node labels
 */
export function findFuzzyMatches(
  input: string,
  nodes: Array<{ id: string; label: string }>,
  options: FindFuzzyMatchesOptions = {}
): FuzzyMatch[] {
  const { threshold = 0.6, maxResults = 5 } = options;
  const inputLower = input.toLowerCase().trim();

  // Skip very short inputs
  if (inputLower.length < 2) return [];

  const matches: FuzzyMatch[] = [];

  for (const node of nodes) {
    const labelLower = node.label.toLowerCase();
    const score = similarityScore(inputLower, labelLower);

    // Check for substring matches (partial matching)
    const isSubstring =
      labelLower.includes(inputLower) || inputLower.includes(labelLower);

    if (score >= threshold || isSubstring) {
      matches.push({
        label: node.label,
        nodeId: node.id,
        // Boost substring matches to ensure they appear
        score: isSubstring ? Math.max(score, 0.8) : score,
      });
    }
  }

  // Sort by score descending, then alphabetically for ties
  return matches
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .slice(0, maxResults);
}
