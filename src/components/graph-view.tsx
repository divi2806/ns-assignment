"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// Dynamic import to avoid SSR issues with force-graph
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <div className="h-[600px] flex items-center justify-center">Loading graph...</div>,
});

interface GraphNode {
  id: string;
  name: string;
  avatar?: string;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string;
  target: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface Edge {
  id?: number;
  source: string;
  target: string;
}

interface GraphViewProps {
  initialEdges: Edge[];
  onAddEdge?: (source: string, target: string) => Promise<void>;
  onDeleteEdge?: (id: number) => Promise<void>;
}

export function GraphView({ initialEdges, onAddEdge, onDeleteEdge }: GraphViewProps) {
  const router = useRouter();
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [newSource, setNewSource] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 600,
        });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Apply custom D3 forces after graph is mounted
  useEffect(() => {
    if (fgRef.current) {
      const fg = fgRef.current;
      
      // Set charge force (repulsion between nodes)
      fg.d3Force('charge')?.strength(-800).distanceMax(400);
      
      // Set link force (distance between connected nodes)
      fg.d3Force('link')?.distance(150);
      
      // Restart the simulation
      fg.d3ReheatSimulation();
    }
  }, [graphData]);

  // Build graph data from edges
  useEffect(() => {
    const nodeSet = new Set<string>();
    initialEdges.forEach((edge) => {
      nodeSet.add(edge.source);
      nodeSet.add(edge.target);
    });

    const nodes: GraphNode[] = Array.from(nodeSet).map((id) => ({
      id,
      name: id,
      avatar: avatars[id],
    }));

    const links: GraphLink[] = initialEdges.map((edge) => ({
      source: edge.source,
      target: edge.target,
    }));

    setGraphData({ nodes, links });
  }, [initialEdges, avatars]);

  // Fetch avatars for all nodes
  useEffect(() => {
    const nodeSet = new Set<string>();
    initialEdges.forEach((edge) => {
      nodeSet.add(edge.source);
      nodeSet.add(edge.target);
    });

    nodeSet.forEach(async (ensName) => {
      if (avatars[ensName]) return;
      try {
        const res = await fetch(`/api/avatar?name=${encodeURIComponent(ensName)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.avatar) {
            setAvatars((prev) => ({ ...prev, [ensName]: data.avatar }));
          }
        }
      } catch {
        // Avatar fetch failed, continue without it
      }
    });
  }, [initialEdges, avatars]);

  const handleNodeClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any) => {
      if (node?.id) {
        router.push(`/profile/${encodeURIComponent(node.id)}`);
      }
    },
    [router]
  );

  const handleAddEdge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSource.trim() || !newTarget.trim()) return;
    
    setLoading(true);
    try {
      if (onAddEdge) {
        await onAddEdge(newSource.trim(), newTarget.trim());
      }
      setNewSource("");
      setNewTarget("");
    } catch (error) {
      console.error("Failed to add edge:", error);
    }
    setLoading(false);
  };

  const nodeCanvasObject = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const label = node.name || node.id || "";
      const fontSize = 11 / globalScale;
      const nodeRadius = 16; // Smaller nodes for better layout
      
      // Get initials from ENS name (e.g., "vitalik.eth" -> "V")
      const getInitials = (name: string) => {
        const cleanName = name.replace('.eth', '').replace('.', '');
        return cleanName.charAt(0).toUpperCase();
      };
      
      const initials = getInitials(label);
      
      // Draw outer circle (border)
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "#1f2937";
      ctx.lineWidth = 2.5 / globalScale;
      ctx.stroke();
      
      // Draw inner circle with gradient
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, nodeRadius);
      gradient.addColorStop(0, "#5b8ef4");
      gradient.addColorStop(1, "#3b6fd8");
      
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius - 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Draw initials in the center
      const initialFontSize = 12 / globalScale;
      ctx.font = `bold ${initialFontSize}px Sans-Serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(initials, x, y);
      
      // Draw label below
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#1f2937";
      ctx.fillText(label, x, y + nodeRadius + 3);
    },
    []
  );

  return (
    <div className="space-y-4">
      {/* Add Edge Form */}
      {onAddEdge && (
        <form onSubmit={handleAddEdge} className="flex gap-2 items-end">
          <div>
            <label className="block text-sm text-gray-900 font-medium mb-1">From Identity</label>
            <input
              type="text"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              placeholder="e.g. vitalik.eth"
              className="border border-gray-300 rounded px-3 py-2 w-40 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-900 font-medium mb-1">To Identity</label>
            <input
              type="text"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              placeholder="e.g. nick.eth"
              className="border border-gray-300 rounded px-3 py-2 w-40 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50 font-medium"
          >
            {loading ? "Connecting..." : "Link Identities"}
          </button>
        </form>
      )}

      {/* Edge List with Delete */}
      {onDeleteEdge && initialEdges.length > 0 && (
        <div className="border border-gray-300 rounded p-3 bg-white">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Network Links</h3>
          <div className="flex flex-wrap gap-2">
            {initialEdges.map((edge, i) => (
              <div key={edge.id || i} className="flex items-center gap-1 bg-gray-100 border border-gray-300 rounded px-2 py-1 text-sm">
                <span className="text-gray-900">{edge.source}</span>
                <span className="text-gray-600">→</span>
                <span className="text-gray-900">{edge.target}</span>
                {edge.id && (
                  <button
                    onClick={() => onDeleteEdge(edge.id!)}
                    className="ml-1 text-red-600 hover:text-red-800 font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Graph */}
      <div ref={containerRef} className="border border-gray-300 rounded bg-white shadow-sm" style={{ height: 600 }}>
        {graphData.nodes.length > 0 ? (
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            nodeLabel="name"
            onNodeClick={handleNodeClick}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={(node, color, ctx) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const n = node as any;
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(n.x ?? 0, n.y ?? 0, 20, 0, 2 * Math.PI);
              ctx.fill();
            }}
            linkColor={() => "#9ca3af"}
            linkWidth={2}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={1}
            linkCurvature={0}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleSpeed={0.004}
            linkDirectionalParticleColor={() => "#60a5fa"}
            d3AlphaDecay={0.01}
            d3VelocityDecay={0.2}
            cooldownTicks={200}
            warmupTicks={100}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            No network data to display. Link identities to build your network!
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500">
        Click any node to explore the identity profile.
      </p>
    </div>
  );
}

