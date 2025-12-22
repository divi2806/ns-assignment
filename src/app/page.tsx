"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const EXAMPLE_NAMES = [
  { name: "vitalik.eth", description: "Ethereum founder" },
  { name: "balajis.eth", description: "Tech entrepreneur" },
  { name: "nick.eth", description: "ENS lead developer" },
];

export default function Home() {
  const [ensName, setEnsName] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = ensName.trim();
    if (trimmed) {
      router.push(`/profile/${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ENS Social Graph
          </h1>
          <p className="text-lg text-gray-600">
            Explore ENS profiles and visualize social connections on the
            Ethereum Name Service.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={ensName}
              onChange={(e) => setEnsName(e.target.value)}
              placeholder="Enter any ENS name (e.g., vitalik.eth)"
              className="flex-1 px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!ensName.trim()}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Example ENS Names */}
        <div className="mb-10">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Try these examples
          </h2>
          <div className="flex flex-wrap gap-3">
            {EXAMPLE_NAMES.map((example) => (
              <Link
                key={example.name}
                href={`/profile/${example.name}`}
                className="group px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                <span className="font-semibold text-gray-900 group-hover:text-blue-600">
                  {example.name}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  {example.description}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Graph Link */}
        <div className="border-t pt-8">
          <Link
            href="/graph"
            className="block p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              📊 View Social Graph
            </h2>
            <p className="text-gray-600">
              Interactive network visualization of ENS connections
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
