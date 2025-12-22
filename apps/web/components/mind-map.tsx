"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as d3 from "d3-force";
import { zoom as d3Zoom, zoomIdentity, ZoomBehavior, ZoomTransform } from "d3-zoom";
import { select } from "d3-selection";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Network, Zap, Brain, Cpu, GitBranch } from "lucide-react";
import { FuturisticBackground } from "./futuristic-background";
import type { GraphNode, GraphEdge } from "@/lib/api/schemas";

interface MindMapProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
  isExpanding?: boolean;
  expandingNodeId?: string | null;
}

// Internal node type with simulation properties
interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: "root" | "generated";
  reason?: string | null;
  depth: number;
  islandIndex: number; // Which island (root) this node belongs to
  // Animation state
  entranceProgress: number;
  entranceStartTime: number;
  scale: number;
  glowIntensity: number;
  pulsePhase: number;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  label?: string | null;
}

// Constants
const NODE_RADIUS = 12;
const HIT_RADIUS = 40;

// Smooth warm-to-cool spectrum for depth visualization
// Hue goes from red (0°) through yellow, green, cyan, blue to violet (270°)
// This creates an intuitive "temperature" gradient: warm = close, cool = far

const SPECTRUM_CONFIG = {
  startHue: 0,      // Red (warm) - origin
  endHue: 270,      // Violet (cool) - distant
  saturation: 85,   // Vibrant colors
  lightness: 55,    // Good visibility on dark background
  maxDepth: 8,      // Depth at which we reach the coolest color
};

// Get color for any depth using smooth spectrum interpolation
const getColorByDepth = (depth: number): string => {
  const { startHue, endHue, saturation, lightness, maxDepth } = SPECTRUM_CONFIG;

  // Normalize depth to 0-1 range, clamped at maxDepth
  const t = Math.min(depth / maxDepth, 1);

  // Interpolate hue from warm to cool
  const hue = Math.round(startHue + (endHue - startHue) * t);

  // Slightly reduce saturation for very deep nodes (subtle fade effect)
  const sat = depth > maxDepth
    ? Math.max(50, saturation - (depth - maxDepth) * 5)
    : saturation;

  return `hsl(${hue}, ${sat}%, ${lightness}%)`;
};

// Legend labels for display
const DEPTH_LABELS = [
  { depth: 0, label: "Origin", description: "Main topic" },
  { depth: 1, label: "Direct", description: "First-level connections" },
  { depth: 2, label: "Related", description: "Secondary concepts" },
  { depth: 3, label: "Extended", description: "Tertiary relationships" },
  { depth: 4, label: "Distant", description: "Peripheral ideas" },
  { depth: 5, label: "Far", description: "Remote connections" },
] as const;

// Generate legend data dynamically
export const getDepthLegend = (maxDepth: number) => {
  const items = [];
  const displayDepths = Math.min(maxDepth + 1, 6); // Show up to 6 items

  for (let d = 0; d < displayDepths; d++) {
    const labelInfo = DEPTH_LABELS[d] ?? { label: `Depth ${d}`, description: "Extended connections" };
    items.push({
      depth: d,
      color: getColorByDepth(d),
      label: labelInfo.label,
      description: labelInfo.description,
    });
  }

  return items;
};

// Island color hue offsets - each island gets a different base hue
const ISLAND_HUE_OFFSETS = [0, 120, 240, 60, 180, 300, 30, 150, 270, 90];

// Calculate depths and island indices from all root nodes
const calculateDepthsAndIslands = (
  nodes: GraphNode[],
  edges: GraphEdge[]
): { depthMap: Map<string, number>; islandMap: Map<string, number> } => {
  const depthMap = new Map<string, number>();
  const islandMap = new Map<string, number>();

  // Find ALL root nodes (multiple islands support)
  const rootNodes = nodes.filter((n) => n.type === "root");
  if (rootNodes.length === 0) return { depthMap, islandMap };

  // BFS from each root node
  rootNodes.forEach((rootNode, islandIndex) => {
    const queue: Array<{ id: string; depth: number }> = [{ id: rootNode.id, depth: 0 }];
    depthMap.set(rootNode.id, 0);
    islandMap.set(rootNode.id, islandIndex);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = edges.filter((e) => e.source === current.id).map((e) => e.target);
      for (const childId of children) {
        if (!depthMap.has(childId)) {
          depthMap.set(childId, current.depth + 1);
          islandMap.set(childId, islandIndex);
          queue.push({ id: childId, depth: current.depth + 1 });
        }
      }
    }
  });

  return { depthMap, islandMap };
};

// Helper to add alpha to an HSL color string
// Converts "hsl(h, s%, l%)" to "hsla(h, s%, l%, alpha)" where alpha is 0-1
const addAlphaToHsl = (hslColor: string, alpha: number): string => {
  const match = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) {
    // Fallback for hex colors (like the expanding node amber)
    if (hslColor.startsWith('#')) {
      const alphaHex = Math.floor(alpha * 255).toString(16).padStart(2, '0');
      return hslColor + alphaHex;
    }
    return hslColor;
  }
  return `hsla(${match[1]}, ${match[2]}%, ${match[3]}%, ${alpha.toFixed(2)})`;
};

// Get color with island hue offset applied
const getColorByDepthAndIsland = (depth: number, islandIndex: number): string => {
  const baseColor = getColorByDepth(depth);
  if (islandIndex === 0) return baseColor; // First island uses default colors

  // Parse HSL and apply hue offset for other islands
  const hslMatch = baseColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!hslMatch || !hslMatch[1] || !hslMatch[2] || !hslMatch[3]) return baseColor;

  const h = parseInt(hslMatch[1]);
  const s = parseInt(hslMatch[2]);
  const l = parseInt(hslMatch[3]);

  const hueOffset = ISLAND_HUE_OFFSETS[islandIndex % ISLAND_HUE_OFFSETS.length] ?? 0;
  const newH = (h + hueOffset) % 360;

  return `hsl(${newH}, ${s}%, ${l}%)`;
};

export function MindMap({
  nodes,
  edges,
  onNodeClick,
  isExpanding,
  expandingNodeId,
}: MindMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const simLinksRef = useRef<SimLink[]>([]);
  const transformRef = useRef<ZoomTransform>(zoomIdentity);
  const zoomBehaviorRef = useRef<ZoomBehavior<HTMLCanvasElement, unknown> | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Performance optimization refs
  const needsRedrawRef = useRef(true);
  const isSimulationActiveRef = useRef(false);
  const lastMouseMoveRef = useRef(0);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<SimNode | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);

  // Track previous nodes to detect new additions
  const prevNodeIdsRef = useRef<Set<string>>(new Set());

  // Update dimensions with debounce
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    const updateDimensions = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (containerRef.current) {
          setDimensions({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight,
          });
          needsRedrawRef.current = true;
        }
      }, 100);
    };
    // Initial dimensions immediately
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    }
    window.addEventListener("resize", updateDimensions);
    return () => {
      window.removeEventListener("resize", updateDimensions);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Initialize/update simulation when nodes/edges change
  useEffect(() => {
    const { depthMap, islandMap } = calculateDepthsAndIslands(nodes, edges);
    const now = Date.now();
    const currentNodeIds = new Set(nodes.map((n) => n.id));

    // Create or update SimNodes
    const existingNodes = new Map(simNodesRef.current.map((n) => [n.id, n]));
    const newSimNodes: SimNode[] = nodes.map((node) => {
      const existing = existingNodes.get(node.id);
      const isNew = !prevNodeIdsRef.current.has(node.id) && prevNodeIdsRef.current.size > 0;

      if (existing) {
        // Update existing node
        existing.label = node.label;
        existing.type = node.type;
        existing.reason = node.reason;
        existing.depth = depthMap.get(node.id) ?? 0;
        existing.islandIndex = islandMap.get(node.id) ?? 0;
        return existing;
      } else {
        // Create new node
        return {
          id: node.id,
          label: node.label,
          type: node.type,
          reason: node.reason,
          depth: depthMap.get(node.id) ?? 0,
          islandIndex: islandMap.get(node.id) ?? 0,
          // Position at center initially
          x: dimensions.width / 2 + (Math.random() - 0.5) * 50,
          y: dimensions.height / 2 + (Math.random() - 0.5) * 50,
          // Animation state
          entranceProgress: isNew ? 0 : 1,
          entranceStartTime: isNew ? now : 0,
          scale: 1,
          glowIntensity: 0.4,
          pulsePhase: Math.random() * Math.PI * 2,
        };
      }
    });

    // Create SimLinks
    const nodeMap = new Map(newSimNodes.map((n) => [n.id, n]));
    const newSimLinks: SimLink[] = edges
      .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map((edge) => ({
        source: nodeMap.get(edge.source)!,
        target: nodeMap.get(edge.target)!,
        label: edge.label,
      }));

    simNodesRef.current = newSimNodes;
    simLinksRef.current = newSimLinks;
    prevNodeIdsRef.current = currentNodeIds;

    // Create or update simulation
    if (!simulationRef.current) {
      simulationRef.current = d3.forceSimulation<SimNode, SimLink>();
    }

    const sim = simulationRef.current;
    sim.nodes(newSimNodes);

    // Configure forces
    sim
      .force("charge", d3.forceManyBody().strength(-800).distanceMax(500))
      .force("link", d3.forceLink<SimNode, SimLink>(newSimLinks)
        .id((d) => d.id)
        .distance(120)
        .strength(0.5))
      .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force("collision", d3.forceCollide().radius(50).strength(0.8))
      .force("x", d3.forceX(dimensions.width / 2).strength(0.05))
      .force("y", d3.forceY(dimensions.height / 2).strength(0.05));

    // Track simulation activity and trigger redraws
    sim.on("tick", () => {
      needsRedrawRef.current = true;
      isSimulationActiveRef.current = sim.alpha() > 0.001;
    });

    sim.on("end", () => {
      isSimulationActiveRef.current = false;
    });

    // Reheat simulation
    isSimulationActiveRef.current = true;
    needsRedrawRef.current = true;
    sim.alpha(0.5).restart();

  }, [nodes, edges, dimensions.width, dimensions.height]);

  // Setup zoom behavior - re-run when canvas appears
  const hasCanvas = nodes.length > 0;
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const zoomBehavior = d3Zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.2, 5])
      .on("zoom", (event) => {
        transformRef.current = event.transform;
        needsRedrawRef.current = true;
      });

    select(canvas).call(zoomBehavior);
    zoomBehaviorRef.current = zoomBehavior;

    return () => {
      select(canvas).on(".zoom", null);
    };
  }, [hasCanvas]);

  // Find node at screen position
  const findNodeAtPosition = useCallback((screenX: number, screenY: number): SimNode | null => {
    const transform = transformRef.current;
    // Convert screen coords to graph coords
    const graphX = (screenX - transform.x) / transform.k;
    const graphY = (screenY - transform.y) / transform.k;

    for (const node of simNodesRef.current) {
      const dx = (node.x ?? 0) - graphX;
      const dy = (node.y ?? 0) - graphY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < HIT_RADIUS) {
        return node;
      }
    }
    return null;
  }, []);

  // Handle canvas click
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isExpanding) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hitNode = findNodeAtPosition(x, y);
    if (hitNode) {
      console.log("[MindMap] Node clicked:", hitNode.label);
      setSelectedNode(hitNode);
      if (onNodeClick) {
        onNodeClick({
          id: hitNode.id,
          label: hitNode.label,
          type: hitNode.type,
          reason: hitNode.reason,
        });
      }
    }
  }, [findNodeAtPosition, onNodeClick, isExpanding]);

  // Handle mouse move for hover (throttled to 60fps)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const now = Date.now();
    // Throttle to ~60fps (16ms)
    if (now - lastMouseMoveRef.current < 16) return;
    lastMouseMoveRef.current = now;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x: e.clientX, y: e.clientY });

    const hitNode = findNodeAtPosition(x, y);
    if (hitNode !== hoveredNode) {
      setHoveredNode(hitNode);
      setShowTooltip(!!hitNode);
      needsRedrawRef.current = true;
      if (canvasRef.current) {
        canvasRef.current.style.cursor = hitNode ? "pointer" : "grab";
      }
    }
  }, [findNodeAtPosition, hoveredNode]);

  // Animation and render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = Date.now();

    // Force initial redraw when effect runs
    needsRedrawRef.current = true;

    const render = () => {
      const now = Date.now();
      const dt = now - lastTime;
      lastTime = now;

      // Check if any animations are still running
      let hasActiveAnimations = false;
      for (const node of simNodesRef.current) {
        if (node.entranceProgress < 1) {
          hasActiveAnimations = true;
          break;
        }
      }

      // Determine if we need to redraw
      const shouldRedraw = needsRedrawRef.current ||
                           isSimulationActiveRef.current ||
                           hasActiveAnimations ||
                           expandingNodeId !== null;

      if (!shouldRedraw) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      needsRedrawRef.current = false;

      // Clear canvas
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      ctx.restore();

      // Apply zoom transform
      const transform = transformRef.current;
      ctx.save();
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.k, transform.k);

      // Update animations
      for (const node of simNodesRef.current) {
        // Entrance animation
        if (node.entranceProgress < 1) {
          const elapsed = now - node.entranceStartTime;
          node.entranceProgress = Math.min(1, elapsed / 600);
        }

        // Hover/select scale
        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selectedNode?.id === node.id;
        const isNodeExpanding = expandingNodeId === node.id;

        let targetScale = 1;
        if (isNodeExpanding) targetScale = 1.25;
        else if (isHovered) targetScale = 1.15;

        node.scale += (targetScale - node.scale) * 0.2;

        // Glow intensity
        let targetGlow = 0.4;
        if (isNodeExpanding) targetGlow = 0.9;
        else if (isSelected) targetGlow = 0.85;
        else if (isHovered) targetGlow = 0.7;

        node.glowIntensity += (targetGlow - node.glowIntensity) * 0.2;

        // Pulse phase for expanding nodes
        if (isNodeExpanding || isSelected) {
          node.pulsePhase += dt / (isNodeExpanding ? 1200 : 3000) * Math.PI * 2;
        }
      }

      // Draw links
      for (const link of simLinksRef.current) {
        const source = link.source as SimNode;
        const target = link.target as SimNode;

        if (!source.x || !source.y || !target.x || !target.y) continue;

        const sourceProgress = source.entranceProgress;
        const targetProgress = target.entranceProgress;
        const linkProgress = Math.min(sourceProgress, targetProgress);

        if (linkProgress <= 0) continue;

        const sourceColor = getColorByDepthAndIsland(source.depth, source.islandIndex);
        const targetColor = getColorByDepthAndIsland(target.depth, target.islandIndex);

        const gradient = ctx.createLinearGradient(source.x, source.y, target.x, target.y);
        const linkAlpha = linkProgress * 0.25; // 0x40/255 ≈ 0.25
        gradient.addColorStop(0, addAlphaToHsl(sourceColor, linkAlpha));
        gradient.addColorStop(1, addAlphaToHsl(targetColor, linkAlpha));

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2 * linkProgress;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      // Draw nodes
      for (const node of simNodesRef.current) {
        const x = node.x ?? 0;
        const y = node.y ?? 0;
        const progress = node.entranceProgress;

        if (progress <= 0) continue;

        const color = expandingNodeId === node.id ? "#f59e0b" : getColorByDepthAndIsland(node.depth, node.islandIndex);
        const scale = node.scale * (progress < 1 ? progress * (1 + 0.2 * Math.sin(progress * Math.PI)) : 1);
        const opacity = Math.min(1, progress * 1.5);

        ctx.globalAlpha = opacity;

        // Glow
        const glowRadius = NODE_RADIUS * 3.5 * (1 + node.glowIntensity * 0.2);
        const glow = ctx.createRadialGradient(x, y, NODE_RADIUS, x, y, glowRadius);
        const glowAlpha = node.glowIntensity * 0.4; // ~100/255
        glow.addColorStop(0, addAlphaToHsl(color, glowAlpha));
        glow.addColorStop(0.5, addAlphaToHsl(color, glowAlpha * 0.5));
        glow.addColorStop(1, "transparent");

        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, 2 * Math.PI);
        ctx.fillStyle = glow;
        ctx.fill();

        // Pulse rings for expanding nodes
        if (expandingNodeId === node.id) {
          for (let i = 0; i < 3; i++) {
            const ringPhase = (node.pulsePhase + (i * Math.PI * 2) / 3) % (Math.PI * 2);
            const ringProgress = ringPhase / (Math.PI * 2);
            const ringRadius = NODE_RADIUS * scale + 10 + ringProgress * 40;
            const ringOpacity = Math.max(0, 1 - ringProgress) * 0.6;

            ctx.beginPath();
            ctx.arc(x, y, ringRadius, 0, 2 * Math.PI);
            ctx.strokeStyle = addAlphaToHsl(color, ringOpacity);
            ctx.lineWidth = 2.5 - ringProgress * 1.5;
            ctx.stroke();
          }
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(x, y, NODE_RADIUS * scale, 0, 2 * Math.PI);

        const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, NODE_RADIUS * scale);
        innerGradient.addColorStop(0, "#ffffff");
        innerGradient.addColorStop(0.6, "#ffffff");
        innerGradient.addColorStop(1, color);

        ctx.fillStyle = innerGradient;
        ctx.fill();

        ctx.strokeStyle = addAlphaToHsl(color, hoveredNode?.id === node.id ? 0.8 : 0.5);
        ctx.lineWidth = hoveredNode?.id === node.id ? 2.5 : 2;
        ctx.stroke();

        // Label
        const fontSize = 14;
        ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";

        const labelX = x + NODE_RADIUS * scale + 12;
        ctx.fillStyle = "#e2e8f0";
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 4;
        ctx.fillText(node.label, labelX, y);
        ctx.shadowBlur = 0;

        ctx.globalAlpha = 1;
      }

      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dimensions, hoveredNode, selectedNode, expandingNodeId, nodes.length]);

  // Empty state - Futuristic design
  if (nodes.length === 0) {
    return (
      <div ref={containerRef} className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#020617]">
        {/* Animated background */}
        <FuturisticBackground />

        {/* Content */}
        <div className="relative z-10 text-center px-4">
          {/* Logo/Icon Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-12"
          >
            {/* Outer rotating ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2"
            >
              <svg className="h-full w-full" viewBox="0 0 160 160">
                <defs>
                  <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                <circle
                  cx="80"
                  cy="80"
                  r="75"
                  fill="none"
                  stroke="url(#ringGradient)"
                  strokeWidth="1"
                  strokeDasharray="8 12"
                />
              </svg>
            </motion.div>

            {/* Inner counter-rotating ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2"
            >
              <svg className="h-full w-full" viewBox="0 0 128 128">
                <circle
                  cx="64"
                  cy="64"
                  r="60"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="0.5"
                  strokeDasharray="4 8"
                  opacity="0.5"
                />
              </svg>
            </motion.div>

            {/* Central icon container */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 40px rgba(168, 85, 247, 0.3), 0 0 80px rgba(168, 85, 247, 0.1)",
                  "0 0 60px rgba(168, 85, 247, 0.5), 0 0 120px rgba(168, 85, 247, 0.2)",
                  "0 0 40px rgba(168, 85, 247, 0.3), 0 0 80px rgba(168, 85, 247, 0.1)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl"
            >
              {/* Animated neural network icon */}
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <GitBranch className="h-10 w-10 text-purple-500/30" />
                </motion.div>
                <Network className="h-10 w-10 text-purple-400" strokeWidth={1.5} />
              </div>
            </motion.div>

            {/* Floating accent dots */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -10, 0],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 2 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.3,
                }}
                className="absolute h-1.5 w-1.5 rounded-full"
                style={{
                  background: i % 2 === 0 ? "#a855f7" : "#22d3ee",
                  left: `${30 + i * 15}%`,
                  top: `${20 + (i % 2) * 60}%`,
                  boxShadow: `0 0 10px ${i % 2 === 0 ? "#a855f7" : "#22d3ee"}`,
                }}
              />
            ))}
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                Begin Your Exploration
              </span>
            </h2>
            <p className="mx-auto max-w-md text-sm text-slate-400 sm:text-base">
              Enter any topic below to start mapping knowledge connections
              <br className="hidden sm:block" />
              <span className="text-slate-500"> with AI-powered semantic analysis</span>
            </p>
          </motion.div>

          {/* Feature badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
          >
            {[
              { icon: Brain, label: "AI-powered", color: "purple", description: "GPT-4 analysis" },
              { icon: Network, label: "Semantic links", color: "cyan", description: "Knowledge graph" },
              { icon: Zap, label: "Real-time", color: "amber", description: "Instant results" },
            ].map((feature, i) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="group relative flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-900/50 px-4 py-2 backdrop-blur-sm transition-all hover:border-slate-600/50 hover:bg-slate-800/50"
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${
                    feature.color === "purple"
                      ? "bg-purple-500/20 text-purple-400"
                      : feature.color === "cyan"
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  <feature.icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-medium text-slate-300">{feature.label}</span>

                {/* Hover tooltip */}
                <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
                  {feature.description}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Keyboard shortcut hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-600"
          >
            <span>Press</span>
            <kbd className="rounded border border-slate-700 bg-slate-800/50 px-2 py-0.5 font-mono text-[10px] text-slate-400">
              ⌘K
            </kbd>
            <span>to focus input</span>
          </motion.div>
        </div>

        {/* Bottom gradient fade */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#020617] to-transparent" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setHoveredNode(null);
          setShowTooltip(false);
        }}
        style={{ cursor: "grab" }}
      />

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredNode && showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none fixed z-50 max-w-xs rounded-lg border border-slate-700/50 bg-slate-900/95 px-3 py-2 text-sm shadow-xl backdrop-blur-sm"
            style={{
              left: Math.min(mousePos.x + 12, window.innerWidth - 260),
              top: Math.min(mousePos.y + 12, window.innerHeight - 100),
            }}
          >
            <div className="flex items-start gap-2">
              <div
                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full shadow-lg"
                style={{
                  backgroundColor: getColorByDepthAndIsland(hoveredNode.depth, hoveredNode.islandIndex),
                  boxShadow: `0 0 8px ${getColorByDepthAndIsland(hoveredNode.depth, hoveredNode.islandIndex)}`,
                }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-200">{hoveredNode.label}</p>
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: addAlphaToHsl(getColorByDepthAndIsland(hoveredNode.depth, hoveredNode.islandIndex), 0.15),
                      color: getColorByDepthAndIsland(hoveredNode.depth, hoveredNode.islandIndex),
                    }}
                  >
                    {hoveredNode.depth === 0 ? "Origin" : `Depth ${hoveredNode.depth}`}
                  </span>
                </div>
                {hoveredNode.reason && (
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{hoveredNode.reason}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Color Legend - Spectrum Bar (bottom-left to avoid logo overlap) */}
      {nodes.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="absolute bottom-28 left-3 rounded-lg border border-slate-700/50 bg-slate-900/80 px-3 py-2.5 backdrop-blur-sm sm:bottom-36"
        >
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Depth
          </p>
          {/* Smooth spectrum gradient bar */}
          <div
            className="h-2 w-24 rounded-full"
            style={{
              background: `linear-gradient(to right, ${getColorByDepth(0)}, ${getColorByDepth(2)}, ${getColorByDepth(4)}, ${getColorByDepth(6)}, ${getColorByDepth(8)})`,
            }}
          />
          {/* Labels */}
          <div className="mt-1.5 flex justify-between text-[10px] text-slate-500">
            <span>Close</span>
            <span>Far</span>
          </div>
        </motion.div>
      )}

      {/* Interaction hint */}
      {nodes.length > 0 && !selectedNode && !hoveredNode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 sm:bottom-32"
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="whitespace-nowrap rounded-full border border-slate-700/50 bg-slate-900/80 px-3 py-2 text-center text-[11px] text-slate-400 backdrop-blur-sm sm:px-4 sm:text-xs"
          >
            <span className="hidden sm:inline">Click nodes to explore • Drag to move • Scroll to zoom</span>
            <span className="sm:hidden">Tap to explore • Drag to move • Pinch to zoom</span>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
