import { ENSProfileData, truncateAddress } from "@/lib/ens";
import Link from "next/link";

interface ENSProfileProps {
  profile: ENSProfileData;
}

export function ENSProfile({ profile }: ENSProfileProps) {
  // Handle not found case
  if (profile.notFound) {
    return (
      <div className="border-2 border-red-200 rounded-xl p-8 bg-red-50 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-red-700 mb-2">
          Profile Not Found
        </h2>
        <p className="text-red-600 mb-4">
          The ENS name <strong>"{profile.ensName}"</strong> does not exist or
          has no resolver configured.
        </p>
        <p className="text-sm text-red-500 mb-6">
          Make sure you entered a valid .eth name that has been registered.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
        >
          ← Search Again
        </Link>
      </div>
    );
  }

  // Handle other errors
  if (profile.error) {
    return (
      <div className="border-2 border-amber-200 rounded-xl p-6 bg-amber-50">
        <div className="text-amber-600 font-medium mb-2">⚠️ Error</div>
        <p className="text-gray-700">{profile.error}</p>
        <Link
          href="/"
          className="inline-block mt-4 text-blue-600 hover:underline"
        >
          ← Try another search
        </Link>
      </div>
    );
  }

  const recordCount = Object.keys(profile.textRecords).length;

  return (
    <div className="border-2 border-gray-200 rounded-xl p-6 bg-white shadow-sm space-y-6">
      {/* Avatar and Name */}
      <div className="flex items-center gap-4">
        {profile.avatar ? (
          <img
            src={profile.avatar}
            alt={profile.ensName}
            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <span className="text-2xl text-white font-bold">
              {profile.ensName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{profile.ensName}</h2>
          {profile.address && (
            <p className="text-gray-500 font-mono text-sm">
              {truncateAddress(profile.address)}
            </p>
          )}
        </div>
      </div>

      {/* Full Address */}
      {profile.address && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
            ETH Address
          </h3>
          <p className="font-mono text-sm break-all bg-gray-50 p-3 rounded-lg border">
            {profile.address}
          </p>
        </div>
      )}

      {/* Text Records - Dynamically Rendered */}
      {recordCount > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            On-Chain Records ({recordCount})
          </h3>
          <div className="space-y-3">
            {Object.entries(profile.textRecords).map(([key, value]) => (
              <div
                key={key}
                className="flex flex-col sm:flex-row sm:items-start border-b border-gray-100 pb-3 last:border-b-0"
              >
                <span className="font-medium text-gray-600 sm:w-36 flex-shrink-0 text-sm">
                  {formatRecordKey(key)}
                </span>
                <span className="text-gray-800 break-all mt-1 sm:mt-0">
                  {formatRecordValue(key, value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {recordCount === 0 && (
        <div className="text-center py-6 text-gray-500">
          <p>No text records found for this ENS name.</p>
        </div>
      )}

      {/* Data Source Info */}
      <div className="border-t pt-4 text-xs text-gray-400">
        <p>
          📡 Data fetched directly from Ethereum Mainnet via public RPC. All
          records are read from the ENS resolver contract on-chain.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 pt-2">
        <Link
          href="/"
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          ← Back to Search
        </Link>
        <Link
          href="/graph"
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          View Graph →
        </Link>
      </div>
    </div>
  );
}

// Maps technical key names to user-friendly labels
function formatRecordKey(key: string): string {
  const keyMap: Record<string, string> = {
    "com.twitter": "Twitter",
    "com.github": "GitHub",
    "com.discord": "Discord",
    "com.reddit": "Reddit",
    "com.linkedin": "LinkedIn",
    "org.telegram": "Telegram",
    "com.youtube": "YouTube",
    "com.instagram": "Instagram",
    description: "Description",
    name: "Display Name",
    url: "Website",
    email: "Email",
    location: "Location",
    keywords: "Keywords",
    avatar: "Avatar URL",
    banner: "Banner",
    cover: "Cover",
    header: "Header",
    notice: "Notice",
    snapshot: "Snapshot",
    "eth.ens.delegate": "ENS Delegate",
  };
  return keyMap[key] || key;
}

// Formats values with clickable links where appropriate
function formatRecordValue(key: string, value: string): React.ReactNode {
  // URLs
  if (key === "url" || value.startsWith("http://") || value.startsWith("https://")) {
    return (
      <a
        href={value.startsWith("http") ? value : `https://${value}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        {value}
      </a>
    );
  }
  
  // Twitter
  if (key === "com.twitter") {
    const handle = value.replace("@", "");
    return (
      <a
        href={`https://twitter.com/${handle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        @{handle}
      </a>
    );
  }
  
  // GitHub
  if (key === "com.github") {
    return (
      <a
        href={`https://github.com/${value}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        {value}
      </a>
    );
  }
  
  // Email
  if (key === "email") {
    return (
      <a
        href={`mailto:${value}`}
        className="text-blue-600 hover:underline"
      >
        {value}
      </a>
    );
  }
  
  return value;
}
