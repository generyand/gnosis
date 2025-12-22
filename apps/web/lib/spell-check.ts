/**
 * Spell checking utilities for Gnosis
 * Focused on common typos in tech/knowledge domain
 */

/**
 * Dictionary of common typos and their corrections
 */
const COMMON_TYPOS: Record<string, string> = {
  // Common keyboard mistakes
  teh: "the",
  adn: "and",
  taht: "that",
  wiht: "with",
  hte: "the",
  fo: "of",
  si: "is",
  ti: "it",
  ot: "to",

  // Tech domain typos
  machne: "machine",
  machin: "machine",
  machene: "machine",
  machien: "machine",
  learnign: "learning",
  learinng: "learning",
  lerning: "learning",
  learing: "learning",
  artifical: "artificial",
  artifcial: "artificial",
  inteligence: "intelligence",
  intellegence: "intelligence",
  intelligance: "intelligence",
  nueral: "neural",
  nural: "neural",
  netowrk: "network",
  netwrok: "network",
  algortihm: "algorithm",
  algorithim: "algorithm",
  algorythm: "algorithm",
  compuer: "computer",
  computre: "computer",
  databse: "database",
  datbase: "database",
  progamming: "programming",
  programing: "programming",
  langauge: "language",
  languege: "language",
  develoment: "development",
  developement: "development",
  framwork: "framework",
  frameowrk: "framework",
  sceince: "science",
  scince: "science",
  reserach: "research",
  reasearch: "research",
  anaylsis: "analysis",
  anlysis: "analysis",
  visualzation: "visualization",
  visulaization: "visualization",
  statisitcs: "statistics",
  statitics: "statistics",
  probablity: "probability",
  probabilty: "probability",

  // Double letter mistakes
  occured: "occurred",
  recieve: "receive",
  beleive: "believe",
  seperate: "separate",
  definately: "definitely",
  occassion: "occasion",
  accomodate: "accommodate",
  neccessary: "necessary",

  // Common swaps
  becuase: "because",
  beacuse: "because",
  freind: "friend",
  wierd: "weird",
  untill: "until",
  thier: "their",

  // More tech terms
  pyhton: "python",
  pytohn: "python",
  javscript: "javascript",
  javascirpt: "javascript",
  typescipt: "typescript",
  typscript: "typescript",
  recat: "react",
  raect: "react",
  enigne: "engine",
  engien: "engine",
  modle: "model",
  modl: "model",
  traning: "training",
  trianing: "training",
  inferance: "inference",
  infernece: "inference",
  embeding: "embedding",
  embdding: "embedding",
  vecotr: "vector",
  vecor: "vector",
  graident: "gradient",
  gradiant: "gradient",
  backpropigation: "backpropagation",
  backpropogation: "backpropagation",
};

export interface SpellCheckResult {
  original: string;
  corrected: string;
  corrections: Array<{
    word: string;
    suggestion: string;
    position: number;
  }>;
  hasErrors: boolean;
}

/**
 * Match the case pattern of the original word to the suggestion
 */
function matchCase(original: string, suggestion: string): string {
  if (original.length === 0) return suggestion;

  const firstChar = original.charAt(0);

  // All uppercase
  if (original === original.toUpperCase()) {
    return suggestion.toUpperCase();
  }

  // Title case (first letter uppercase)
  if (
    firstChar === firstChar.toUpperCase() &&
    original.slice(1) === original.slice(1).toLowerCase()
  ) {
    return suggestion.charAt(0).toUpperCase() + suggestion.slice(1);
  }

  // Default to lowercase
  return suggestion.toLowerCase();
}

/**
 * Check text for common typos
 * @returns Result with original, corrected text, and list of corrections
 */
export function checkSpelling(text: string): SpellCheckResult {
  const words = text.split(/(\s+)/); // Split but keep whitespace
  const corrections: SpellCheckResult["corrections"] = [];
  let position = 0;

  for (const segment of words) {
    // Skip whitespace segments
    if (/^\s+$/.test(segment)) {
      position += segment.length;
      continue;
    }

    const wordLower = segment.toLowerCase();
    if (COMMON_TYPOS[wordLower]) {
      corrections.push({
        word: segment,
        suggestion: COMMON_TYPOS[wordLower],
        position,
      });
    }
    position += segment.length;
  }

  // Build corrected string
  let corrected = text;
  // Apply corrections in reverse order to preserve positions
  for (const correction of [...corrections].reverse()) {
    const before = corrected.slice(0, correction.position);
    const after = corrected.slice(correction.position + correction.word.length);
    const fixedWord = matchCase(correction.word, correction.suggestion);
    corrected = before + fixedWord + after;
  }

  return {
    original: text,
    corrected,
    corrections,
    hasErrors: corrections.length > 0,
  };
}

/**
 * Get the typos dictionary (for testing/debugging)
 */
export function getTyposDictionary(): Record<string, string> {
  return { ...COMMON_TYPOS };
}
