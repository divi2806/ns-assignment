"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SearchResult {
  name: string;
  label: string;
}

const EXAMPLE_NAMES = [
  { name: "vitalik.eth", description: "Ethereum founder" },
  { name: "balajis.eth", description: "Tech entrepreneur" },
  { name: "nick.eth", description: "ENS lead developer" },
];

export default function Home() {
  const [ensName, setEnsName] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const searchENS = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/ens-search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSuggestions([]);
    }
    setIsLoading(false);
  }, []);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (ensName.trim()) {
        searchENS(ensName.trim());
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [ensName, searchENS]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = ensName.trim();
    if (name) {
      // Add .eth if not present and doesn't contain a dot
      const fullName = name.includes(".") ? name : `${name}.eth`;
      router.push(`/profile/${encodeURIComponent(fullName)}`);
    }
  };

  const handleSelectSuggestion = (name: string) => {
    setEnsName(name);
    setShowSuggestions(false);
    router.push(`/profile/${encodeURIComponent(name)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        if (selectedIndex >= 0) {
          e.preventDefault();
          handleSelectSuggestion(suggestions[selectedIndex].name);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
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

        {/* Search Form with Autocomplete */}
        <form onSubmit={handleSubmit} className="mb-8 relative">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={ensName}
                onChange={(e) => {
                  setEnsName(e.target.value);
                  setSelectedIndex(-1);
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter any ENS name (e.g., vitalik.eth)"
                className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                autoComplete="off"
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
                >
                  {suggestions.map((result, index) => (
                    <button
                      key={result.name}
                      type="button"
                      onClick={() => handleSelectSuggestion(result.name)}
                      className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-2 ${
                        index === selectedIndex ? "bg-blue-50" : ""
                      }`}
                    >
                      <span className="font-medium text-gray-900">
                        {result.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!ensName.trim()}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Search
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Start typing (3+ characters) to see suggestions
          </p>
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
