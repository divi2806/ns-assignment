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
  const [edges, setEdges] = useState<Edge[]>(INITIAL_EDGES); // Start with demo data immediately
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [useLocalStorage, setUseLocalStorage] = useState(false);

  // Load edges from API or localStorage
  const loadEdges = useCallback(async () => {
    try {
      const res = await fetch("/api/edges");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setEdges(data);
        }
        // If DB is empty, keep the initial demo data
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

  // OPTIMISTIC ADD: Update UI immediately, sync to DB in background
  const handleAddEdge = async (source: string, target: string) => {
    // Create a temporary ID for optimistic update
    const tempId = Date.now();
    const newEdge: Edge = { id: tempId, source, target };
    
    // Update UI immediately (optimistic)
    setEdges((prev) => [...prev, newEdge]);

    if (useLocalStorage) {
      // Already updated, nothing more to do
      return;
    }

    // Sync to database in background
    setSyncing(true);
    try {
      const res = await fetch("/api/edges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, target }),
      });
      if (res.ok) {
        const savedEdge = await res.json();
        // Replace temp ID with real DB ID
        setEdges((prev) => 
          prev.map((e) => e.id === tempId ? { ...e, id: savedEdge.id } : e)
        );
      }
    } catch (error) {
      console.error("Failed to sync edge to DB:", error);
      // Rollback on failure
      setEdges((prev) => prev.filter((e) => e.id !== tempId));
    }
    setSyncing(false);
  };

  // OPTIMISTIC DELETE: Update UI immediately, sync to DB in background
  const handleDeleteEdge = async (id: number) => {
    // Find the edge to delete (for potential rollback)
    const edgeToDelete = edges.find((e) => e.id === id);
    
    // Update UI immediately (optimistic)
    setEdges((prev) => prev.filter((e) => e.id !== id));

    if (useLocalStorage) {
      // Already updated, nothing more to do
      return;
    }

    // Sync to database in background
    setSyncing(true);
    try {
      const res = await fetch("/api/edges", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error("Failed to sync deletion to DB:", error);
      // Rollback on failure - re-add the edge
      if (edgeToDelete) {
        setEdges((prev) => [...prev, edgeToDelete]);
      }
    }
    setSyncing(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">ENS Social Graph</h1>
            {loading && (
              <p className="text-sm text-gray-500 mt-1">
                Loading from database...
              </p>
            )}
            {syncing && (
              <p className="text-sm text-blue-600 mt-1">
                Syncing changes...
              </p>
            )}
            {useLocalStorage && !loading && (
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
