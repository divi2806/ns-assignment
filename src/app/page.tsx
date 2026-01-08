"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar";

interface SearchResult {
  name: string;
  label: string;
}

const EXAMPLE_NAMES = [
  { name: "vitalik.eth", description: "Co-founder at Ethereum Foundation" },
  { name: "balajis.eth", description: "Entrepreneur and founder Network School" },
  { name: "nick.eth", description: "Lead at ENS" },
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
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto px-6 pt-24 pb-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            LinkChain
          </h1>
          <p className="text-xl text-gray-600 max-w-xl mx-auto">
            Discover and connect Web3 identities across the Ethereum ecosystem
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
              placeholder="Search Web3 identity..."
              className="w-full px-6 py-4 text-lg bg-white border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:outline-none transition-all"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!ensName.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-gray-900 text-white font-medium rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 overflow-hidden"
              >
                {suggestions.map((result, index) => (
                  <button
                    key={result.name}
                    type="button"
                    onClick={() => handleSelectSuggestion(result.name)}
                    className={`w-full px-5 py-3 text-left hover:bg-gray-100 transition-colors ${
                      index === selectedIndex ? "bg-gray-100" : ""
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
              className="group px-5 py-3 bg-white border border-gray-300 rounded-lg hover:border-gray-900 hover:shadow-sm transition-all"
            >
              <span className="font-semibold text-gray-900">
                {example.name}
              </span>
              <span className="text-sm text-gray-600 ml-2">
                {example.description}
              </span>
            </Link>
          ))}
        </div>

        {/* Social Graph Feature Card */}
        <Link
          href="/graph"
          className="block max-w-lg mx-auto p-8 bg-gray-900 rounded-lg hover:shadow-lg transition-all group border border-gray-800"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gray-800 rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">
              Network Graph
            </h2>
          </div>
          <p className="text-gray-300 text-lg leading-relaxed">
            Visualize identity networks and manage connections. Build and explore relationship maps.
          </p>
          <div className="mt-6 flex items-center text-gray-400 group-hover:text-white transition-colors">
            <span className="font-medium">Explore network</span>
            <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </Link>
      </div>
      </main>
    </>
  );
}
