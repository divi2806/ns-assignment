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
      const fontSize = 12 / globalScale;
      const nodeRadius = 8;

      // Draw circle for node
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = "#3b82f6";
      ctx.fill();
      ctx.strokeStyle = "#1d4ed8";
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();

      // Draw label
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#1f2937";
      ctx.fillText(label, x, y + nodeRadius + 2);
    },
    []
  );

  return (
    <div className="space-y-4">
      {/* Add Edge Form */}
      {onAddEdge && (
        <form onSubmit={handleAddEdge} className="flex gap-2 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Source ENS</label>
            <input
              type="text"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              placeholder="e.g. vitalik.eth"
              className="border rounded px-3 py-2 w-40"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Target ENS</label>
            <input
              type="text"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              placeholder="e.g. nick.eth"
              className="border rounded px-3 py-2 w-40"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Connection"}
          </button>
        </form>
      )}

      {/* Edge List with Delete */}
      {onDeleteEdge && initialEdges.length > 0 && (
        <div className="border rounded p-3 bg-gray-50">
          <h3 className="text-sm font-medium mb-2">Connections</h3>
          <div className="flex flex-wrap gap-2">
            {initialEdges.map((edge, i) => (
              <div key={edge.id || i} className="flex items-center gap-1 bg-white border rounded px-2 py-1 text-sm">
                <span>{edge.source}</span>
                <span className="text-gray-400">→</span>
                <span>{edge.target}</span>
                {edge.id && (
                  <button
                    onClick={() => onDeleteEdge(edge.id!)}
                    className="ml-1 text-red-500 hover:text-red-700"
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
      <div ref={containerRef} className="border rounded bg-white" style={{ height: 600 }}>
        {graphData.nodes.length > 0 ? (
          <ForceGraph2D
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
              ctx.arc(n.x ?? 0, n.y ?? 0, 12, 0, 2 * Math.PI);
              ctx.fill();
            }}
            linkColor={() => "#94a3b8"}
            linkWidth={2}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            No connections to display. Add some edges above!
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500">
        Click on a node to view the ENS profile.
      </p>
    </div>
  );
}

