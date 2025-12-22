import logging

from langchain_cerebras import ChatCerebras
from pydantic import BaseModel

from core.exceptions import InferenceError
from models.schemas import GraphEdge, GraphNode

logger = logging.getLogger(__name__)


class ExpansionOutput(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    reasoning: str


class InferenceService:
    def __init__(self, llm: ChatCerebras):
        self.llm = llm.with_structured_output(ExpansionOutput)

    async def expand_topic(
        self,
        topic: str,
        context: list[str],
        similar_concepts: list[dict],
        num_expansions: int = 5,
        source_node_id: str | None = None,
    ) -> ExpansionOutput:
        try:
            similar_str = ", ".join(c["label"] for c in similar_concepts[:5]) if similar_concepts else "none yet"
            context_str = ", ".join(context) if context else "none"

            # Use provided source_node_id or derive from topic
            edge_source_id = source_node_id if source_node_id else topic.lower().replace(" ", "-").replace("_", "-")

            prompt = f"""You are a knowledge graph expansion assistant. Given a topic, generate related concepts that would form an interesting semantic mind map.

Topic to expand: {topic}
Current context/path: {context_str}
Similar concepts already in the graph: {similar_str}

Generate {num_expansions} new, diverse concepts related to this topic. Each concept should:
1. Be genuinely connected to the topic
2. Not duplicate existing similar concepts
3. Represent different aspects or dimensions of the topic
4. Be specific enough to be interesting but general enough to allow further expansion

For each node:
- id: a unique kebab-case identifier
- label: a human-readable label (2-4 words)
- type: "generated" (not "root")
- reason: a brief explanation of why this concept relates to the topic

For each edge:
- source: MUST be exactly "{edge_source_id}" (the existing node we're expanding from)
- target: the new node's id
- label: the relationship type (e.g., "relates to", "is part of", "enables")

IMPORTANT: All edges must have source="{edge_source_id}". Do not use any other source value.

Also provide overall reasoning explaining your expansion choices."""

            logger.debug(f"Expanding topic: {topic} with {num_expansions} expansions, source_node_id: {edge_source_id}")
            result = await self.llm.ainvoke(prompt)

            # Ensure all edges use the correct source node ID
            for edge in result.edges:
                edge.source = edge_source_id

            logger.info(f"Generated {len(result.nodes)} nodes for topic: {topic}")
            return result
        except Exception as e:
            logger.error(f"Inference failed for topic '{topic}': {e}")
            raise InferenceError(
                message=f"Failed to expand topic: {e}",
                error_code="INFERENCE_FAILED",
            ) from e
