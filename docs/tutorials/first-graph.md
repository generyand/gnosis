# Your First Knowledge Graph

This tutorial guides you through creating your first knowledge graph with Gnosis. You'll learn how to seed a graph, expand topics, and navigate the visualization.

## Prerequisites

- Gnosis running locally (see [Getting Started](./getting-started.md))
- A web browser

## Step 1: Open the Application

Navigate to http://localhost:3000. You'll see:

- A dark canvas area (the graph visualization)
- An input bar at the bottom (the OmniBar)
- A toggle button in the top-right (Neural Log)

## Step 2: Seed Your First Topic

The graph starts empty. Let's create our first node:

1. Click the input field or press `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux)
2. Type a topic you want to explore, e.g., **"Machine Learning"**
3. Press Enter or click the arrow button

You'll see:
- A loading animation as the AI processes
- A new amber-colored node appears (root nodes are amber)
- The Neural Log panel shows the AI's reasoning

## Step 3: Expand the Graph

Now let's generate related concepts:

1. Click on the "Machine Learning" node
2. The OmniBar becomes active with the node selected
3. Type a related subtopic, e.g., **"Neural Networks"**
4. Press Enter

The AI will:
1. Check if your new topic relates to the existing context
2. Generate 5 related concepts
3. Create edges showing relationships
4. Display its reasoning in the Neural Log

## Step 4: Explore the Visualization

Interact with your growing graph:

| Action | How |
|--------|-----|
| Pan | Click and drag on empty space |
| Zoom | Scroll wheel or pinch gesture |
| Select node | Click on a node |
| View details | Hover over a node |

**Color coding by depth:**
- **Amber** - Root nodes (depth 0)
- **Orange** - First level (depth 1)
- **Purple** - Second level (depth 2)
- **Blue** - Third level (depth 3)
- **Cyan** - Fourth level (depth 4)
- **Teal** - Deeper levels

## Step 5: View the Neural Log

Click the toggle in the top-right corner to open the Neural Log sidebar. This shows:

- **Topic**: What was expanded
- **Reasoning**: Why the AI chose those concepts
- **Node count**: How many nodes were generated

This helps you understand the AI's thought process.

## Step 6: Handle Unrelated Topics

If you enter a topic that doesn't relate to your current graph:

1. A dialog appears asking what you want to do
2. **Create new root**: Start a separate cluster in the graph
3. **Connect anyway**: Force a connection to the selected node

This lets you build multi-topic graphs or stay focused on one domain.

## Step 7: Clear and Start Fresh

To start over:

1. Notice the "Clear" button appears when you have nodes
2. Click it to remove all nodes and edges
3. The graph resets to empty

Your graph state is automatically saved to your browser's localStorage, so you can close and reopen without losing work.

## What You've Learned

- How to seed a knowledge graph with an initial topic
- How to expand nodes with related concepts
- How to navigate and interact with the visualization
- How to use the Neural Log to understand AI reasoning
- How to handle unrelated topics and clear the graph

## Next Steps

- [Configure API Keys](../how-to/configure-api-keys.md) - Use real AI services
- [Architecture Overview](../explanation/architecture.md) - Understand how it works
- [API Reference](../reference/api.md) - Build your own integrations
