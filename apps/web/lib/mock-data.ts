import type { GraphNode, GraphEdge } from "@/lib/api/schemas";

/**
 * Generate a unique ID for nodes
 */
function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Topic clusters for similarity detection
 */
const TOPIC_CLUSTERS: Record<string, string[]> = {
  tech: [
    "ai",
    "artificial intelligence",
    "machine learning",
    "deep learning",
    "neural network",
    "computer",
    "software",
    "data",
    "algorithm",
    "programming",
    "code",
    "developer",
    "technology",
    "digital",
    "automation",
    "robotics",
    "nlp",
    "natural language",
    "computer vision",
    "transformer",
    "gpt",
    "llm",
  ],
  food: [
    "hotdog",
    "pizza",
    "burger",
    "cooking",
    "recipe",
    "ingredient",
    "restaurant",
    "chef",
    "kitchen",
    "bun",
    "mustard",
    "ketchup",
    "food",
    "meal",
    "dish",
    "cuisine",
    "breakfast",
    "lunch",
    "dinner",
    "snack",
    "sausage",
    "bread",
  ],
  science: [
    "physics",
    "chemistry",
    "biology",
    "experiment",
    "research",
    "lab",
    "scientist",
    "hypothesis",
    "theory",
    "molecule",
    "atom",
    "quantum",
    "astronomy",
    "space",
  ],
  arts: [
    "music",
    "painting",
    "sculpture",
    "dance",
    "theater",
    "literature",
    "poetry",
    "art",
    "creative",
    "artist",
    "gallery",
    "museum",
  ],
  sports: [
    "football",
    "basketball",
    "soccer",
    "tennis",
    "golf",
    "swimming",
    "running",
    "marathon",
    "athlete",
    "team",
    "game",
    "sport",
  ],
  nature: [
    "forest",
    "ocean",
    "mountain",
    "river",
    "wildlife",
    "animal",
    "plant",
    "tree",
    "flower",
    "environment",
    "ecology",
    "nature",
  ],
  business: [
    "startup",
    "company",
    "entrepreneur",
    "investment",
    "market",
    "finance",
    "economy",
    "stock",
    "business",
    "corporate",
    "management",
  ],
};

/**
 * Mock expansions for demo mode
 */
const MOCK_EXPANSIONS: Record<string, string[]> = {
  // Tech topics
  "artificial intelligence": [
    "Machine Learning",
    "Neural Networks",
    "Natural Language Processing",
    "Computer Vision",
    "Expert Systems",
  ],
  ai: [
    "Machine Learning",
    "Deep Learning",
    "Neural Networks",
    "Robotics",
    "Automation",
  ],
  "machine learning": [
    "Supervised Learning",
    "Unsupervised Learning",
    "Reinforcement Learning",
    "Feature Engineering",
    "Model Training",
  ],
  "neural networks": [
    "Transformers",
    "CNNs",
    "RNNs",
    "Attention Mechanism",
    "Backpropagation",
  ],
  "deep learning": [
    "Transformers",
    "GANs",
    "Autoencoders",
    "Transfer Learning",
    "Fine-tuning",
  ],

  // Food topics
  hotdog: ["Bun", "Mustard", "Ketchup", "Sausage", "Relish"],
  pizza: ["Cheese", "Tomato Sauce", "Crust", "Toppings", "Oven"],
  burger: ["Patty", "Bun", "Lettuce", "Cheese", "Sauce"],
  bun: ["Bread", "Sesame Seeds", "Dough", "Bakery", "Wheat"],
  cooking: ["Recipe", "Ingredients", "Kitchen", "Chef", "Techniques"],

  // Default fallback
  default: [
    "Related Concept 1",
    "Related Concept 2",
    "Related Concept 3",
    "Connected Idea",
    "Associated Topic",
  ],
};

/**
 * Generate mock seed response
 */
export function generateMockSeed(topic: string): {
  node: GraphNode;
  reasoning: string;
} {
  const node: GraphNode = {
    id: generateId(),
    label: topic,
    type: "root",
    reason: `Starting exploration of "${topic}" - this is your knowledge graph root.`,
  };

  const reasoning = `Created root node for "${topic}". This will be the center of your knowledge exploration. Click on this node or type related topics to expand your graph.`;

  return { node, reasoning };
}

/**
 * Generate mock expansion response
 */
export function generateMockExpansion(
  nodeLabel: string,
  sourceNodeId: string
): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  reasoning: string;
} {
  const labelLower = nodeLabel.toLowerCase();
  const expansions =
    MOCK_EXPANSIONS[labelLower] ??
    MOCK_EXPANSIONS["default"] ?? [
      "Related Concept 1",
      "Related Concept 2",
      "Related Concept 3",
    ];

  const nodes: GraphNode[] = expansions.map((label) => ({
    id: generateId(),
    label,
    type: "generated" as const,
    reason: `Related to "${nodeLabel}" through semantic connection.`,
  }));

  const edges: GraphEdge[] = nodes.map((node) => ({
    source: sourceNodeId,
    target: node.id,
  }));

  const reasoning = `Expanded "${nodeLabel}" with ${nodes.length} related concepts. These represent semantic connections in the knowledge space.`;

  return { nodes, edges, reasoning };
}

/**
 * Demo graph for showcase
 */
export const DEMO_GRAPH: { nodes: GraphNode[]; edges: GraphEdge[] } = {
  nodes: [
    {
      id: "root-ai",
      label: "Artificial Intelligence",
      type: "root",
      reason: "Central concept of the knowledge graph",
    },
    {
      id: "ml",
      label: "Machine Learning",
      type: "generated",
      reason: "Core AI technique for learning from data",
    },
    {
      id: "dl",
      label: "Deep Learning",
      type: "generated",
      reason: "Advanced neural network architectures",
    },
    {
      id: "nlp",
      label: "Natural Language Processing",
      type: "generated",
      reason: "AI for understanding human language",
    },
    {
      id: "cv",
      label: "Computer Vision",
      type: "generated",
      reason: "AI for visual understanding",
    },
    {
      id: "nn",
      label: "Neural Networks",
      type: "generated",
      reason: "Brain-inspired computing models",
    },
    {
      id: "transformer",
      label: "Transformers",
      type: "generated",
      reason: "Attention-based architecture",
    },
    {
      id: "llm",
      label: "Large Language Models",
      type: "generated",
      reason: "Massive pre-trained language models",
    },
    {
      id: "gpt",
      label: "GPT",
      type: "generated",
      reason: "Generative Pre-trained Transformer",
    },
  ],
  edges: [
    { source: "root-ai", target: "ml" },
    { source: "root-ai", target: "dl" },
    { source: "root-ai", target: "nlp" },
    { source: "root-ai", target: "cv" },
    { source: "ml", target: "nn" },
    { source: "dl", target: "transformer" },
    { source: "nlp", target: "llm" },
    { source: "transformer", target: "gpt" },
    { source: "llm", target: "gpt" },
  ],
};

/**
 * Check similarity of a topic against context using keyword clustering
 */
export function checkMockSimilarity(
  topic: string,
  context: string[]
): {
  isRelated: boolean;
  closestMatch: string | null;
  score: number;
} {
  const topicLower = topic.toLowerCase();
  const contextLower = context.map((c) => c.toLowerCase());

  // Find which cluster the topic belongs to
  let topicCluster: string | null = null;
  let topicScore = 0;

  for (const [cluster, keywords] of Object.entries(TOPIC_CLUSTERS)) {
    for (const kw of keywords) {
      if (topicLower.includes(kw) || kw.includes(topicLower)) {
        topicCluster = cluster;
        topicScore = topicLower === kw ? 1 : 0.8;
        break;
      }
    }
    if (topicCluster) break;
  }

  // Find which cluster the context belongs to (use the most common)
  const contextClusters: Record<string, number> = {};
  let closestMatch: string | null = null;
  let highestMatchScore = 0;

  for (const ctx of contextLower) {
    for (const [cluster, keywords] of Object.entries(TOPIC_CLUSTERS)) {
      for (const kw of keywords) {
        if (ctx.includes(kw) || kw.includes(ctx)) {
          contextClusters[cluster] = (contextClusters[cluster] || 0) + 1;

          // Track closest matching context item
          const matchScore = ctx === kw ? 1 : 0.8;
          if (cluster === topicCluster && matchScore > highestMatchScore) {
            highestMatchScore = matchScore;
            closestMatch = context[contextLower.indexOf(ctx)] ?? null;
          }
          break;
        }
      }
    }
  }

  // Find dominant context cluster
  let contextCluster: string | null = null;
  let maxCount = 0;
  for (const [cluster, count] of Object.entries(contextClusters)) {
    if (count > maxCount) {
      maxCount = count;
      contextCluster = cluster;
    }
  }

  // Determine similarity
  const isRelated =
    topicCluster !== null &&
    contextCluster !== null &&
    topicCluster === contextCluster;

  // Calculate a mock similarity score
  const score = isRelated
    ? Math.min(0.7 + highestMatchScore * 0.2, 0.9)
    : 0.15;

  return {
    isRelated,
    closestMatch: isRelated ? closestMatch : null,
    score,
  };
}

/**
 * Result for a single island's similarity check
 */
export interface IslandMatch {
  rootId: string;
  rootLabel: string;
  score: number;
  closestMatch: string | null;
}

/**
 * Result of checking similarity against multiple islands
 */
export interface IslandSimilarityResult {
  isRelatedToAny: boolean;
  bestMatch: IslandMatch | null;
  allMatches: IslandMatch[];
}

/**
 * Check similarity of a topic against each island separately.
 * Returns which island (if any) the topic best belongs to.
 */
export function checkSimilarityPerIsland(
  topic: string,
  islands: Map<string, string[]>
): IslandSimilarityResult {
  const results: IslandMatch[] = [];
  const SIMILARITY_THRESHOLD = 0.3;

  for (const [rootId, labels] of islands) {
    const rootLabel = labels[0];
    if (!rootLabel) continue;

    // Check similarity against this island's nodes
    const sim = checkMockSimilarity(topic, labels);

    results.push({
      rootId,
      rootLabel,
      score: sim.score,
      closestMatch: sim.closestMatch,
    });
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  const bestMatch = results[0];
  const isRelatedToAny =
    bestMatch !== undefined && bestMatch.score >= SIMILARITY_THRESHOLD;

  return {
    isRelatedToAny,
    bestMatch: isRelatedToAny ? bestMatch : null,
    allMatches: results,
  };
}
