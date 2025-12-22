"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { MindMap } from "@/components/mind-map";
import { OmniBar } from "@/components/omni-bar";
import { NeuralLog } from "@/components/neural-log";
import { TypoDialog } from "@/components/typo-dialog";
import { useGraphState } from "@/hooks/use-graph-state";
import type { SpellCheckResult } from "@/hooks/use-fuzzy-search";
import {
  useExpandTopicApiV1GraphExpandPost,
  useSeedTopicApiV1GraphSeedPost,
  useCheckSimilarityApiV1GraphCheckSimilarityPost,
} from "@/lib/api/generated/graph/graph";
import type { GraphNode } from "@/lib/api/schemas";
import { Brain } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Home() {
  const {
    nodes,
    edges,
    logs,
    hasNodes,
    isLoaded,
    addNode,
    addNodesAndEdges,
    addLogEntry,
    clearGraph,
    getContext,
  } = useGraphState();

  const [expandingNodeId, setExpandingNodeId] = useState<string | null>(null);

  // Typo dialog state
  const [typoDialog, setTypoDialog] = useState<{
    isOpen: boolean;
    spellCheck: SpellCheckResult | null;
  }>({ isOpen: false, spellCheck: null });

  const seedMutation = useSeedTopicApiV1GraphSeedPost({
    mutation: {
      onSuccess: (response) => {
        if (response.status === 200) {
          addNode(response.data.node);
          addLogEntry(
            response.data.node.label,
            response.data.reasoning,
            1
          );
          toast.success(`Started exploring "${response.data.node.label}"`);
        }
      },
      onError: (error: Error) => {
        console.error("[Gnosis] Seed API error:", error);
        toast.error("Failed to connect to backend. Please ensure the API is running.");
      },
    },
  });

  const expandMutation = useExpandTopicApiV1GraphExpandPost({
    mutation: {
      onSuccess: (response) => {
        if (response.status === 200) {
          addNodesAndEdges(response.data.nodes, response.data.edges);
          addLogEntry(
            expandingNodeId || "topic",
            response.data.reasoning,
            response.data.nodes.length
          );
          toast.success(
            `Added ${response.data.nodes.length} related concepts`
          );
        }
        setExpandingNodeId(null);
      },
      onError: (error: Error) => {
        console.error("[Gnosis] Expand API error:", error);
        toast.error("Failed to connect to backend. Please ensure the API is running.");
        setExpandingNodeId(null);
      },
    },
  });

  const similarityMutation = useCheckSimilarityApiV1GraphCheckSimilarityPost();

  const isLoading = seedMutation.isPending || expandMutation.isPending || similarityMutation.isPending;

  // Helper to perform the actual expansion
  const performExpand = useCallback(
    (topic: string) => {
      const rootNode = nodes.find((n) => n.type === "root") || nodes[0];
      if (!rootNode) return;

      expandMutation.mutate({
        data: {
          topic,
          source_node_id: rootNode.id,
          context: getContext(),
          num_expansions: 5,
        },
      });
    },
    [nodes, expandMutation, getContext]
  );

  // Helper to create a new root node (new island)
  const createNewRoot = useCallback(
    (topic: string) => {
      seedMutation.mutate({ data: { topic } });
    },
    [seedMutation]
  );

  const handleSubmit = async (topic: string) => {
    console.log("[Gnosis] Submit:", { topic, hasNodes });

    // First topic - always create a root
    if (!hasNodes) {
      createNewRoot(topic);
      return;
    }

    // Check if the topic is related to existing graph
    const context = getContext();
    if (context.length === 0) {
      // No context available, create new root
      createNewRoot(topic);
      return;
    }

    try {
      const response = await similarityMutation.mutateAsync({
        data: {
          topic,
          context,
          threshold: 0.3,
        },
      });

      if (response.status === 200) {
        const { suggested_action, similarity_score, closest_match } = response.data;
        console.log("[Gnosis] Similarity check:", {
          suggested_action,
          similarity_score,
          closest_match,
        });

        if (suggested_action === "new_root") {
          toast.info(`"${topic}" is unrelated to current graph. Starting new exploration.`);
          createNewRoot(topic);
        } else {
          performExpand(topic);
        }
      }
    } catch (error) {
      console.error("[Gnosis] Similarity check error:", error);
      // Fallback to expand on error
      performExpand(topic);
    }
  };

  const handleNodeClick = (node: GraphNode) => {
    if (isLoading) {
      console.log("[Gnosis] Click ignored - loading in progress");
      return;
    }

    console.log("[Gnosis] Node clicked:", {
      id: node.id,
      label: node.label,
      type: node.type,
    });

    setExpandingNodeId(node.id);

    expandMutation.mutate({
      data: {
        topic: node.label,
        source_node_id: node.id,
        context: getContext(),
        num_expansions: 5,
      },
    });
  };

  const handleClear = () => {
    console.log("[Gnosis] Clearing graph");
    clearGraph();
    toast.info("Graph cleared");
  };

  // Typo detection handlers
  const handleTypoDetected = useCallback((spellCheck: SpellCheckResult) => {
    setTypoDialog({ isOpen: true, spellCheck });
  }, []);

  const handleTypoAccept = useCallback(
    (corrected: string) => {
      setTypoDialog({ isOpen: false, spellCheck: null });
      handleSubmit(corrected);
    },
    [handleSubmit]
  );

  const handleTypoReject = useCallback(
    (original: string) => {
      setTypoDialog({ isOpen: false, spellCheck: null });
      handleSubmit(original);
    },
    [handleSubmit]
  );

  const handleTypoCancel = useCallback(() => {
    setTypoDialog({ isOpen: false, spellCheck: null });
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#020617]">
      <MindMap
        nodes={nodes}
        edges={edges}
        onNodeClick={handleNodeClick}
        isExpanding={isLoading}
        expandingNodeId={expandingNodeId}
      />

      <OmniBar
        onSubmit={handleSubmit}
        onClear={handleClear}
        isLoading={isLoading}
        hasNodes={hasNodes}
        nodes={nodes}
        onTypoDetected={handleTypoDetected}
        placeholder={
          hasNodes
            ? "Enter a topic to expand..."
            : "Enter a topic to start exploring..."
        }
      />

      <NeuralLog logs={logs} />

      {/* Loading Indicator */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed left-1/2 top-4 z-50 -translate-x-1/2"
          >
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 20px rgba(168, 85, 247, 0.3)",
                  "0 0 40px rgba(168, 85, 247, 0.5)",
                  "0 0 20px rgba(168, 85, 247, 0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex items-center gap-2 rounded-full border border-primary/30 bg-slate-900/95 px-4 py-2 backdrop-blur-xl"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Brain className="h-4 w-4 text-primary" />
              </motion.div>
              <span className="text-sm font-medium text-slate-200">
                AI is thinking
              </span>
              <div className="flex gap-1">
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: 0 }}
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title */}
      <div className="fixed left-3 top-3 z-40 sm:left-4 sm:top-4">
        <h1 className="text-lg font-bold text-foreground sm:text-xl">
          Gnosis
        </h1>
        <p className="text-[10px] text-muted-foreground sm:text-xs">
          Semantic mind-mapping engine
        </p>
      </div>

      {/* Typo Confirmation Dialog */}
      {typoDialog.spellCheck && (
        <TypoDialog
          isOpen={typoDialog.isOpen}
          spellCheck={typoDialog.spellCheck}
          onAccept={handleTypoAccept}
          onReject={handleTypoReject}
          onCancel={handleTypoCancel}
        />
      )}
    </main>
  );
}
