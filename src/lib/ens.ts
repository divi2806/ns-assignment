import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export interface ENSProfileData {
  ensName: string;
  normalizedName: string;
  address: string | null;
  avatar: string | null;
  resolver: string | null;
  textRecords: Record<string, string>;
  error?: string;
  notFound?: boolean;
}

// Common ENS text record keys to check
// These are the most commonly used keys in the ENS ecosystem
// The profile will display any that have values set
const COMMON_TEXT_RECORD_KEYS = [
  // Identity & Profile
  "description",
  "name",
  "keywords",
  "location",
  
  // Links
  "url",
  "email",
  
  // Social Media
  "com.twitter",
  "com.github",
  "com.discord",
  "com.reddit",
  "com.linkedin",
  "org.telegram",
  "com.youtube",
  "com.instagram",
  
  // Crypto & Web3
  "eth.ens.delegate",
  "snapshot",
  "header",
  "notice",
  
  // Avatar & branding
  "avatar",
  "banner",
  "cover",
];

export async function fetchENSProfile(ensName: string): Promise<ENSProfileData> {
  try {
    // Normalize the ENS name (handles unicode, case, etc.)
    let normalizedName: string;
    try {
      normalizedName = normalize(ensName);
    } catch {
      return {
        ensName,
        normalizedName: ensName,
        address: null,
        avatar: null,
        resolver: null,
        textRecords: {},
        error: `Invalid ENS name format: "${ensName}"`,
        notFound: true,
      };
    }

    // First check if the name has a resolver (i.e., exists)
    let resolver: `0x${string}` | null;
    try {
      resolver = await client.getEnsResolver({ name: normalizedName });
    } catch {
      resolver = null;
    }

    if (!resolver) {
      return {
        ensName,
        normalizedName,
        address: null,
        avatar: null,
        resolver: null,
        textRecords: {},
        error: `ENS name "${ensName}" not found or has no resolver`,
        notFound: true,
      };
    }

    // Fetch basic data in parallel
    const [address, avatar] = await Promise.all([
      client.getEnsAddress({ name: normalizedName }).catch(() => null),
      client.getEnsAvatar({ name: normalizedName }).catch(() => null),
    ]);

    // Fetch all text records in parallel
    // We try all common keys and filter out nulls
    const textRecordPromises = COMMON_TEXT_RECORD_KEYS.map(async (key) => {
      try {
        const value = await client.getEnsText({ name: normalizedName, key });
        return [key, value] as [string, string | null];
      } catch {
        return [key, null] as [string, string | null];
      }
    });

    const textRecordResults = await Promise.all(textRecordPromises);
    
    // Only include records that have values
    const textRecords: Record<string, string> = {};
    for (const [key, value] of textRecordResults) {
      if (value !== null && value !== "") {
        textRecords[key] = value;
      }
    }

    // Consider the name "not found" if it has no address AND no text records
    // This handles the case where ENS uses universal resolvers for unregistered names
    const hasNoData = !address && Object.keys(textRecords).length === 0;
    
    if (hasNoData) {
      return {
        ensName,
        normalizedName,
        address: null,
        avatar: null,
        resolver,
        textRecords: {},
        error: `ENS name "${ensName}" is not registered or has no data`,
        notFound: true,
      };
    }

    return {
      ensName,
      normalizedName,
      address,
      avatar,
      resolver,
      textRecords,
    };
  } catch (error) {
    return {
      ensName,
      normalizedName: ensName,
      address: null,
      avatar: null,
      resolver: null,
      textRecords: {},
      error: error instanceof Error ? error.message : "Failed to resolve ENS name",
    };
  }
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
