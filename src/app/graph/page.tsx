"use client";

import { useState, useEffect, useCallback } from "react";
import { GraphView } from "@/components/graph-view";
import Link from "next/link";

interface Edge {
  id?: number;
  source: string;
  target: string;
}

// Initial demo data - used as fallback when DB is empty or not configured
const INITIAL_EDGES: Edge[] = [
  { id: 1, source: "vitalik.eth", target: "balajis.eth" },
  { id: 2, source: "vitalik.eth", target: "nick.eth" },
  { id: 3, source: "balajis.eth", target: "nick.eth" },
  { id: 4, source: "nick.eth", target: "brantly.eth" },
];

export default function GraphPage() {
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [useLocalStorage, setUseLocalStorage] = useState(false);

  // Load edges from API or localStorage
  const loadEdges = useCallback(async () => {
    try {
      const res = await fetch("/api/edges");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setEdges(data);
        } else {
          // DB is empty, use initial demo data
          setEdges(INITIAL_EDGES);
        }
      } else {
        throw new Error("API request failed");
      }
    } catch (error) {
      console.log("Using localStorage fallback:", error);
      setUseLocalStorage(true);
      // Try localStorage
      const stored = localStorage.getItem("ens-graph-edges");
      if (stored) {
        setEdges(JSON.parse(stored));
      } else {
        setEdges(INITIAL_EDGES);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEdges();
  }, [loadEdges]);

  // Save to localStorage when using fallback
  useEffect(() => {
    if (useLocalStorage && edges.length > 0) {
      localStorage.setItem("ens-graph-edges", JSON.stringify(edges));
    }
  }, [edges, useLocalStorage]);

  const handleAddEdge = async (source: string, target: string) => {
    if (useLocalStorage) {
      // Local storage mode
      const newEdge: Edge = { source, target, id: Date.now() };
      setEdges((prev) => [...prev, newEdge]);
    } else {
      // Database mode
      try {
        const res = await fetch("/api/edges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source, target }),
        });
        if (res.ok) {
          await loadEdges();
        }
      } catch (error) {
        console.error("Failed to add edge:", error);
      }
    }
  };

  const handleDeleteEdge = async (id: number) => {
    if (useLocalStorage) {
      setEdges((prev) => prev.filter((e) => e.id !== id));
    } else {
      try {
        const res = await fetch("/api/edges", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (res.ok) {
          await loadEdges();
        }
      } catch (error) {
        console.error("Failed to delete edge:", error);
      }
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">ENS Social Graph</h1>
          <p className="text-gray-600">Loading graph data...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">ENS Social Graph</h1>
            {useLocalStorage && (
              <p className="text-sm text-amber-600 mt-1">
                Using local storage (database not configured)
              </p>
            )}
          </div>
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            ← Back to Home
          </Link>
        </div>

        <GraphView
          initialEdges={edges}
          onAddEdge={handleAddEdge}
          onDeleteEdge={handleDeleteEdge}
        />
      </div>
    </main>
  );
}
