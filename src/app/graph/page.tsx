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

// Helper to validate ENS name exists (has resolver/address)
async function validateENSName(name: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/ens-search?q=${encodeURIComponent(name)}`);
    if (res.ok) {
      const data = await res.json();
      // Check if the exact name exists in results
      return data.some((r: { name: string }) => r.name.toLowerCase() === name.toLowerCase());
    }
    return false;
  } catch {
    return false;
  }
}

export default function GraphPage() {
  const [edges, setEdges] = useState<Edge[]>(INITIAL_EDGES);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [useLocalStorage, setUseLocalStorage] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  // Load edges from API or localStorage
  const loadEdges = useCallback(async () => {
    try {
      const res = await fetch("/api/edges");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setEdges(data);
        }
      } else {
        throw new Error("API request failed");
      }
    } catch (error) {
      console.log("Using localStorage fallback:", error);
      setUseLocalStorage(true);
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

  useEffect(() => {
    if (useLocalStorage && edges.length > 0) {
      localStorage.setItem("ens-graph-edges", JSON.stringify(edges));
    }
  }, [edges, useLocalStorage]);

  // Show toast notification
  const showToast = (message: string, type: "error" | "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // OPTIMISTIC ADD with ENS validation
  const handleAddEdge = async (source: string, target: string) => {
    // Validate both ENS names exist
    setSyncing(true);
    const [sourceValid, targetValid] = await Promise.all([
      validateENSName(source),
      validateENSName(target),
    ]);

    if (!sourceValid && !targetValid) {
      showToast(`Both "${source}" and "${target}" don't exist`, "error");
      setSyncing(false);
      return;
    }
    if (!sourceValid) {
      showToast(`"${source}" is not a registered ENS name`, "error");
      setSyncing(false);
      return;
    }
    if (!targetValid) {
      showToast(`"${target}" is not a registered ENS name`, "error");
      setSyncing(false);
      return;
    }

    // Both valid - proceed with optimistic update
    const tempId = Date.now();
    const newEdge: Edge = { id: tempId, source, target };
    setEdges((prev) => [...prev, newEdge]);
    showToast(`Added connection: ${source} → ${target}`, "success");

    if (useLocalStorage) {
      setSyncing(false);
      return;
    }

    try {
      const res = await fetch("/api/edges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, target }),
      });
      if (res.ok) {
        const savedEdge = await res.json();
        setEdges((prev) =>
          prev.map((e) => (e.id === tempId ? { ...e, id: savedEdge.id } : e))
        );
      }
    } catch (error) {
      console.error("Failed to sync edge to DB:", error);
      setEdges((prev) => prev.filter((e) => e.id !== tempId));
    }
    setSyncing(false);
  };

  // OPTIMISTIC DELETE
  const handleDeleteEdge = async (id: number) => {
    const edgeToDelete = edges.find((e) => e.id === id);
    setEdges((prev) => prev.filter((e) => e.id !== id));

    if (useLocalStorage) return;

    setSyncing(true);
    try {
      const res = await fetch("/api/edges", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed");
    } catch (error) {
      console.error("Failed to sync deletion to DB:", error);
      if (edgeToDelete) {
        setEdges((prev) => [...prev, edgeToDelete]);
      }
    }
    setSyncing(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white p-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg font-medium transition-all animate-in slide-in-from-right ${
            toast.type === "error"
              ? "bg-red-500 text-white"
              : "bg-green-500 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ENS Social Graph
            </h1>
            {loading && (
              <p className="text-sm text-gray-500 mt-1">Loading from database...</p>
            )}
            {syncing && (
              <p className="text-sm text-blue-600 mt-1">Syncing changes...</p>
            )}
            {useLocalStorage && !loading && (
              <p className="text-sm text-amber-600 mt-1">Using local storage</p>
            )}
          </div>
          <Link
            href="/"
            className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
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
