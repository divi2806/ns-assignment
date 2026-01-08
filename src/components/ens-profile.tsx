"use client";

import { useState } from "react";
import { ENSProfileData, truncateAddress, getEtherscanUrl } from "@/lib/ens";
import Link from "next/link";
import { ActivityGraph } from "./activity-graph";

interface ENSProfileProps {
  profile: ENSProfileData;
}

type TabType = "profile" | "records" | "ownership" | "more";

export function ENSProfile({ profile }: ENSProfileProps) {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Handle not found case
  if (profile.notFound) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white border border-gray-300 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Identity Not Found
          </h2>
          <p className="text-gray-700 mb-4">
            The identity <strong>"{profile.ensName}"</strong> could not be found or
            has no associated data.
          </p>
          <p className="text-sm text-gray-600 mb-6">
            Please verify the name is registered on ENS.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gray-900 text-white font-medium rounded hover:bg-gray-800 transition-colors"
          >
            ← Try Another Search
          </Link>
        </div>
      </div>
    );
  }

  // Extract social accounts
  const accounts = {
    twitter: profile.textRecords["com.twitter"],
    github: profile.textRecords["com.github"],
    discord: profile.textRecords["com.discord"],
    reddit: profile.textRecords["com.reddit"],
    telegram: profile.textRecords["org.telegram"],
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "records", label: "Records" },
    { id: "ownership", label: "Ownership" },
    { id: "more", label: "More" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{profile.ensName}</h1>
          <button
            onClick={() => handleCopy(profile.ensName, "name")}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Copy name"
          >
            {copiedText === "name" ? (
              <span className="text-green-600 text-sm">✓</span>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
        {profile.address && (
          <a
            href={getEtherscanUrl(profile.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-gray-900 hover:text-gray-700 font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Etherscan
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-300 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-300 overflow-hidden mb-6">
        {activeTab === "profile" && (
          <ProfileTab profile={profile} accounts={accounts} handleCopy={handleCopy} copiedText={copiedText} />
        )}
        {activeTab === "records" && (
          <RecordsTab profile={profile} handleCopy={handleCopy} copiedText={copiedText} />
        )}
        {activeTab === "ownership" && (
          <OwnershipTab profile={profile} handleCopy={handleCopy} copiedText={copiedText} />
        )}
        {activeTab === "more" && (
          <MoreTab profile={profile} handleCopy={handleCopy} copiedText={copiedText} />
        )}
      </div>

      {/* Activity Graph */}
      {profile.address && (
        <div className="mb-6">
          <ActivityGraph address={profile.address} />
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
          <Link href="/" className="text-gray-900 hover:text-gray-700 text-sm font-medium">
          ← Back to Home
        </Link>
        <Link href="/graph" className="text-gray-900 hover:text-gray-700 text-sm font-medium">
          View Network →
        </Link>
      </div>
    </div>
  );
}

// Profile Tab Component
function ProfileTab({
  profile,
  accounts,
  handleCopy,
  copiedText,
}: {
  profile: ENSProfileData;
  accounts: Record<string, string | undefined>;
  handleCopy: (text: string, label: string) => void;
  copiedText: string | null;
}) {
  return (
    <div>
      {/* Hero Section with Header */}
      <div className="relative">
        {/* Header/Banner Image */}
        <div 
          className="h-32 bg-gray-900"
          style={profile.header ? { 
            backgroundImage: `url(${profile.header})`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          } : undefined}
        />
        
        {/* Avatar */}
        <div className="absolute -bottom-12 left-6">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.ensName}
              className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-sm"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-700 flex items-center justify-center shadow-sm">
              <span className="text-3xl text-white font-bold">
                {profile.ensName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Profile Info */}
      <div className="pt-14 px-6 pb-6">
        <h2 className="text-xl font-bold text-gray-900">{profile.ensName}</h2>
        {profile.textRecords["description"] && (
          <p className="text-gray-600 mt-1">{profile.textRecords["description"]}</p>
        )}
        {profile.textRecords["url"] && (
          <a
            href={profile.textRecords["url"].startsWith("http") ? profile.textRecords["url"] : `https://${profile.textRecords["url"]}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-900 hover:text-gray-700 text-sm mt-1 inline-block underline"
          >
            {profile.textRecords["url"]}
          </a>
        )}
      </div>

      {/* Accounts Section */}
      {Object.values(accounts).some(Boolean) && (
        <div className="px-6 pb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Accounts</h3>
          <div className="flex flex-wrap gap-2">
            {accounts.twitter && (
              <a
                href={`https://twitter.com/${accounts.twitter.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition-colors text-sm"
              >
                <span className="font-bold">𝕏</span>
                <span>@{accounts.twitter.replace("@", "")}</span>
                <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
            {accounts.github && (
              <a
                href={`https://github.com/${accounts.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition-colors text-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>{accounts.github}</span>
                <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
            {accounts.discord && (
              <span className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm">
                <span>🎮</span>
                <span>{accounts.discord}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Addresses Section */}
      {profile.address && (
        <div className="px-6 pb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Addresses</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCopy(profile.address!, "eth-address")}
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition-colors text-sm group"
            >
              <span className="text-lg">⟠</span>
              <span className="font-mono">{truncateAddress(profile.address)}</span>
              {copiedText === "eth-address" ? (
                <span className="text-green-600 text-xs">Copied!</span>
              ) : (
                <svg className="w-3 h-3 text-gray-600 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Records Tab Component
function RecordsTab({
  profile,
  handleCopy,
  copiedText,
}: {
  profile: ENSProfileData;
  handleCopy: (text: string, label: string) => void;
  copiedText: string | null;
}) {
  const textRecordCount = Object.keys(profile.textRecords).length;
  
  return (
    <div className="p-6">
      {/* Text Records */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-3">
          Text <span className="text-gray-400">{textRecordCount} Records</span>
        </h3>
        {textRecordCount > 0 ? (
          <div className="space-y-2">
            {Object.entries(profile.textRecords).map(([key, value]) => (
              <div
                key={key}
                className="flex items-start justify-between p-3 bg-gray-100 border border-gray-300 rounded group"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-900 font-medium">{key}</span>
                  <p className="text-sm text-gray-700 break-all mt-0.5">{value}</p>
                </div>
                <button
                  onClick={() => handleCopy(value, key)}
                  className="ml-2 p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-all"
                >
                  {copiedText === key ? (
                    <span className="text-green-600 text-xs">✓</span>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No text records found.</p>
        )}
      </div>

      {/* Address Record */}
      {profile.address && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            Address <span className="text-gray-400">1 Record</span>
          </h3>
          <div className="flex items-center justify-between p-3 bg-gray-100 border border-gray-300 rounded group">
            <div>
              <span className="text-sm text-gray-900 font-medium">eth</span>
              <p className="text-sm text-gray-700 font-mono mt-0.5">{profile.address}</p>
            </div>
            <button
              onClick={() => handleCopy(profile.address!, "eth-record")}
              className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-all"
            >
              {copiedText === "eth-record" ? (
                <span className="text-green-600 text-xs">✓</span>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Ownership Tab Component
function OwnershipTab({
  profile,
  handleCopy,
  copiedText,
}: {
  profile: ENSProfileData;
  handleCopy: (text: string, label: string) => void;
  copiedText: string | null;
}) {
  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Roles</h3>
      
      {profile.address && (
        <div className="space-y-3 mb-6">
          {/* Manager */}
          <div className="flex items-center justify-between p-4 bg-gray-100 border border-gray-300 rounded">
            <div className="flex items-center gap-3">
              {profile.avatar ? (
                <img src={profile.avatar} alt="" className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="text-white font-bold">{profile.ensName.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">{profile.ensName}</p>
                <p className="text-sm text-gray-600 font-mono">{truncateAddress(profile.address)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-medium text-gray-900 bg-gray-300 border border-gray-400 rounded">Manager</span>
              <span className="px-2 py-1 text-xs font-medium text-gray-900 bg-gray-300 border border-gray-400 rounded">ETH record</span>
            </div>
          </div>
        </div>
      )}

      {/* Etherscan Link */}
      {profile.address && (
        <div className="pt-4 border-t">
          <a
            href={getEtherscanUrl(profile.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-gray-900 hover:text-gray-700 font-medium text-sm underline"
          >
            View on Etherscan
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}

// More Tab Component
function MoreTab({
  profile,
  handleCopy,
  copiedText,
}: {
  profile: ENSProfileData;
  handleCopy: (text: string, label: string) => void;
  copiedText: string | null;
}) {
  return (
    <div className="p-6 space-y-6">
      {/* Primary Name */}
      {profile.address && (
        <div className="bg-gray-100 border border-gray-300 rounded p-4">
          <h3 className="font-bold text-gray-900 mb-2">Primary Name</h3>
          <p className="text-sm text-gray-600 mb-3">
            A primary name links this name to an address, allowing apps to display a name and profile when looking up the address.
          </p>
          <div className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded">
            <div>
              <span className="text-sm text-gray-900 font-medium">eth</span>
              <p className="text-sm text-gray-700 font-mono mt-0.5">{profile.address}</p>
            </div>
            <button
              onClick={() => handleCopy(profile.address!, "primary-name")}
              className="p-1.5 text-gray-400 hover:text-gray-900"
            >
              {copiedText === "primary-name" ? (
                <span className="text-green-600 text-xs">✓</span>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Resolver */}
      {profile.resolver && (
        <div className="bg-gray-100 border border-gray-300 rounded p-4">
          <h3 className="font-bold text-gray-900 mb-2">Resolver</h3>
          <div className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded">
            <p className="text-sm text-gray-700 font-mono break-all">{profile.resolver}</p>
            <button
              onClick={() => handleCopy(profile.resolver!, "resolver")}
              className="ml-2 p-1.5 text-gray-400 hover:text-gray-900"
            >
              {copiedText === "resolver" ? (
                <span className="text-green-600 text-xs">✓</span>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Data Source */}
      <div className="text-xs text-gray-400 pt-4 border-t">
        <p>📡 Data retrieved directly from Ethereum Mainnet. All information is verified on-chain through ENS resolver contracts.</p>
      </div>
    </div>
  );
}
