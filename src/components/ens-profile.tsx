import { ENSProfileData, truncateAddress } from "@/lib/ens";
import Link from "next/link";

interface ENSProfileProps {
  profile: ENSProfileData;
}

export function ENSProfile({ profile }: ENSProfileProps) {
  if (profile.error) {
    return (
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <div className="text-red-600 font-medium">Error</div>
        <p className="text-gray-600 mt-2">{profile.error}</p>
        <p className="text-sm text-gray-400 mt-1">
          Could not resolve: {profile.ensName}
        </p>
      </div>
    );
  }

  const populatedRecords = Object.entries(profile.textRecords).filter(
    ([, value]) => value !== null && value !== ""
  );

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm space-y-6">
      {/* Avatar and Name */}
      <div className="flex items-center gap-4">
        {profile.avatar ? (
          <img
            src={profile.avatar}
            alt={profile.ensName}
            className="w-20 h-20 rounded-full object-cover border"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-2xl text-gray-400">?</span>
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold">{profile.ensName}</h2>
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
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            ETH Address
          </h3>
          <p className="font-mono text-sm break-all bg-gray-50 p-2 rounded">
            {profile.address}
          </p>
        </div>
      )}

      {/* Text Records */}
      {populatedRecords.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Text Records
          </h3>
          <div className="space-y-2">
            {populatedRecords.map(([key, value]) => (
              <div key={key} className="flex border-b pb-2 last:border-b-0">
                <span className="font-medium text-gray-600 w-32 flex-shrink-0">
                  {formatRecordKey(key)}
                </span>
                <span className="text-gray-800 break-all">
                  {formatRecordValue(key, value as string)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="pt-4 border-t">
        <Link href="/" className="text-blue-600 hover:underline text-sm">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

function formatRecordKey(key: string): string {
  const keyMap: Record<string, string> = {
    "com.twitter": "Twitter",
    "com.github": "GitHub",
    "com.discord": "Discord",
    description: "Description",
    url: "Website",
    email: "Email",
    location: "Location",
    keywords: "Keywords",
  };
  return keyMap[key] || key;
}

function formatRecordValue(key: string, value: string): React.ReactNode {
  if (key === "url" || value.startsWith("http")) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        {value}
      </a>
    );
  }
  if (key === "com.twitter") {
    return (
      <a
        href={`https://twitter.com/${value.replace("@", "")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        @{value.replace("@", "")}
      </a>
    );
  }
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
  return value;
}
