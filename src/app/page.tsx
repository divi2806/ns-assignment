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
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 pt-24 pb-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Your Web3 Identity
          </h1>
          <p className="text-xl text-gray-600 max-w-xl mx-auto">
            Explore ENS profiles and visualize social connections on Ethereum
          </p>
        </div>

        {/* Search Form with Autocomplete */}
        <form onSubmit={handleSubmit} className="mb-12 relative max-w-xl mx-auto">
          <div className="relative">
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
              placeholder="Search for a name"
              className="w-full px-6 py-4 text-lg bg-white border-2 border-gray-200 rounded-2xl shadow-lg focus:border-blue-500 focus:shadow-xl focus:outline-none transition-all"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!ensName.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Search"
              )}
            </button>

            {/* Autocomplete Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                {suggestions.map((result, index) => (
                  <button
                    key={result.name}
                    type="button"
                    onClick={() => handleSelectSuggestion(result.name)}
                    className={`w-full px-5 py-3 text-left hover:bg-blue-50 transition-colors ${
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
        </form>

        {/* Example ENS Names */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {EXAMPLE_NAMES.map((example) => (
            <Link
              key={example.name}
              href={`/profile/${example.name}`}
              className="group px-5 py-3 bg-white border border-gray-200 rounded-full hover:border-blue-400 hover:shadow-md transition-all"
            >
              <span className="font-semibold text-gray-800 group-hover:text-blue-600">
                {example.name}
              </span>
              <span className="text-sm text-gray-500 ml-2">
                {example.description}
              </span>
            </Link>
          ))}
        </div>

        {/* Social Graph Feature Card */}
        <Link
          href="/graph"
          className="block max-w-lg mx-auto p-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">
              Social Graph
            </h2>
          </div>
          <p className="text-white/90 text-lg leading-relaxed">
            Visualize and edit ENS connection networks. Add or remove relationships between profiles.
          </p>
          <div className="mt-6 flex items-center text-white/80 group-hover:text-white transition-colors">
            <span className="font-medium">Explore connections</span>
            <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </Link>
      </div>
    </main>
  );
}
