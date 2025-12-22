"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GraphNode, GraphEdge } from "@/lib/api/schemas";

const STORAGE_KEY = "gnosis-state";
const MAX_CONTEXT_NODES = 10;
const STORAGE_DEBOUNCE_MS = 500;

export interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  topic: string;
  reasoning: string;
  nodeCount: number;
}

interface PersistedState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  logs: Array<{
    id: string;
    timestamp: string;
    topic: string;
    reasoning: string;
    nodeCount: number;
  }>;
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function loadFromStorage(): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  logs: LogEntry[];
} {
  if (typeof window === "undefined") {
    return { nodes: [], edges: [], logs: [] };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: PersistedState = JSON.parse(stored);
      return {
        nodes: parsed.nodes || [],
        edges: parsed.edges || [],
        logs: (parsed.logs || []).map((log) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        })),
      };
    }
  } catch (e) {
    console.error("Failed to load graph state:", e);
  }

  return { nodes: [], edges: [], logs: [] };
}

export function useGraphState() {
  const [state, setState] = useState(() => loadFromStorage());
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { nodes, edges, logs } = state;

  // Mark as loaded after initial render (for SSR hydration)
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Persist to localStorage on change (debounced)
  useEffect(() => {
    if (!isLoaded) return;

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce the save operation
    saveTimeoutRef.current = setTimeout(() => {
      try {
        const persistedState: PersistedState = {
          nodes,
          edges,
          logs: logs.map((log) => ({
            ...log,
            timestamp: log.timestamp.toISOString(),
          })),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
      } catch (e) {
        console.error("Failed to save graph state:", e);
      }
    }, STORAGE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [nodes, edges, logs, isLoaded]);

  const addNode = useCallback((node: GraphNode) => {
    setState((prev) => {
      if (prev.nodes.some((n) => n.id === node.id)) return prev;
      return { ...prev, nodes: [...prev.nodes, node] };
    });
  }, []);

  const addNodes = useCallback((newNodes: GraphNode[]) => {
    setState((prev) => {
      const existingIds = new Set(prev.nodes.map((n) => n.id));
      const uniqueNewNodes = newNodes.filter((n) => !existingIds.has(n.id));
      if (uniqueNewNodes.length === 0) return prev;
      return { ...prev, nodes: [...prev.nodes, ...uniqueNewNodes] };
    });
  }, []);

  const addNodesAndEdges = useCallback(
    (newNodes: GraphNode[], newEdges: GraphEdge[]) => {
      setState((prev) => {
        // Add nodes first
        const existingIds = new Set(prev.nodes.map((n) => n.id));
        const uniqueNewNodes = newNodes.filter((n) => !existingIds.has(n.id));
        const updatedNodes = [...prev.nodes, ...uniqueNewNodes];

        // Then validate and add edges using the updated node list
        const validNodeIds = new Set(updatedNodes.map((n) => n.id));
        const existingEdges = new Set(
          prev.edges.map((e) => `${e.source}->${e.target}`)
        );

        const uniqueNewEdges = newEdges.filter((e) => {
          const isUnique = !existingEdges.has(`${e.source}->${e.target}`);
          const hasValidSource = validNodeIds.has(e.source);
          const hasValidTarget = validNodeIds.has(e.target);

          if (!hasValidSource || !hasValidTarget) {
            console.warn(
              `Skipping edge ${e.source} -> ${e.target}: ` +
                `source exists: ${hasValidSource}, target exists: ${hasValidTarget}`
            );
            return false;
          }

          return isUnique;
        });

        return {
          ...prev,
          nodes: updatedNodes,
          edges: [...prev.edges, ...uniqueNewEdges],
        };
      });
    },
    []
  );

  const addEdge = useCallback((edge: GraphEdge) => {
    setState((prev) => {
      if (
        prev.edges.some(
          (e) => e.source === edge.source && e.target === edge.target
        )
      ) {
        return prev;
      }
      return { ...prev, edges: [...prev.edges, edge] };
    });
  }, []);

  const addEdges = useCallback((newEdges: GraphEdge[]) => {
    setState((prev) => {
      // Create a set of valid node IDs for validation
      const validNodeIds = new Set(prev.nodes.map((n) => n.id));

      const existingEdges = new Set(
        prev.edges.map((e) => `${e.source}->${e.target}`)
      );

      // Filter edges to ensure both source and target nodes exist
      const uniqueNewEdges = newEdges.filter((e) => {
        const isUnique = !existingEdges.has(`${e.source}->${e.target}`);
        const hasValidSource = validNodeIds.has(e.source);
        const hasValidTarget = validNodeIds.has(e.target);

        if (!hasValidSource || !hasValidTarget) {
          console.warn(
            `Skipping edge ${e.source} -> ${e.target}: ` +
            `source exists: ${hasValidSource}, target exists: ${hasValidTarget}`
          );
          return false;
        }

        return isUnique;
      });

      if (uniqueNewEdges.length === 0) return prev;
      return { ...prev, edges: [...prev.edges, ...uniqueNewEdges] };
    });
  }, []);

  const addLogEntry = useCallback(
    (topic: string, reasoning: string, nodeCount: number) => {
      const entry: LogEntry = {
        id: generateId(),
        timestamp: new Date(),
        topic,
        reasoning,
        nodeCount,
      };
      setState((prev) => ({ ...prev, logs: [entry, ...prev.logs] }));
    },
    []
  );

  const clearGraph = useCallback(() => {
    setState({ nodes: [], edges: [], logs: [] });
  }, []);

  const hasNodes = nodes.length > 0;

  // Get all root nodes (for multi-island support)
  const getRootNodes = useCallback((): GraphNode[] => {
    return nodes.filter((n) => n.type === "root");
  }, [nodes]);

  // Get all nodes belonging to a specific island (via edge traversal)
  const getIslandNodes = useCallback(
    (rootId: string): GraphNode[] => {
      const visited = new Set<string>();
      const queue = [rootId];
      const islandNodes: GraphNode[] = [];

      while (queue.length > 0) {
        const nodeId = queue.shift()!;
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);

        const node = nodes.find((n) => n.id === nodeId);
        if (node) islandNodes.push(node);

        // Find connected nodes via edges (both directions)
        edges.forEach((e) => {
          if (e.source === nodeId && !visited.has(e.target)) {
            queue.push(e.target);
          }
          if (e.target === nodeId && !visited.has(e.source)) {
            queue.push(e.source);
          }
        });
      }
      return islandNodes;
    },
    [nodes, edges]
  );

  // Get nodes grouped by island (rootId -> nodes[])
  const getNodesPerIsland = useCallback((): Map<string, GraphNode[]> => {
    const rootNodes = nodes.filter((n) => n.type === "root");
    const nodesByIsland = new Map<string, GraphNode[]>();

    for (const root of rootNodes) {
      nodesByIsland.set(root.id, getIslandNodes(root.id));
    }
    return nodesByIsland;
  }, [nodes, getIslandNodes]);

  // Memoize context to avoid recalculating on every call
  const contextRef = useRef<string[]>([]);
  const contextNodesLengthRef = useRef(0);

  // Get recent context for API calls (most recent nodes, limited)
  const getContext = useCallback((): string[] => {
    // Only recalculate if nodes length changed
    if (nodes.length !== contextNodesLengthRef.current) {
      contextNodesLengthRef.current = nodes.length;
      contextRef.current = nodes.slice(-MAX_CONTEXT_NODES).map((n) => n.label);
    }
    return contextRef.current;
  }, [nodes]);

  return {
    nodes,
    edges,
    logs,
    isLoaded,
    hasNodes,
    addNode,
    addNodes,
    addNodesAndEdges,
    addEdge,
    addEdges,
    addLogEntry,
    clearGraph,
    getContext,
    getRootNodes,
    getIslandNodes,
    getNodesPerIsland,
  };
}
