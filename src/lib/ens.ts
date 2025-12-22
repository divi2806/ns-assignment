import { createPublicClient, http, namehash } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import { getRpcUrl } from "./config";

// Create client using configured RPC (Alchemy if available, otherwise public)
const client = createPublicClient({
  chain: mainnet,
  transport: http(getRpcUrl()),
});

export interface ENSProfileData {
  ensName: string;
  normalizedName: string;
  address: string | null;
  avatar: string | null;
  header: string | null;
  resolver: string | null;
  textRecords: Record<string, string>;
  contentHash: string | null;
  error?: string;
  notFound?: boolean;
}

// All common ENS text record keys
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
  
  // Additional records
  "pgp",
  "contenthash",
];

export async function fetchENSProfile(ensName: string): Promise<ENSProfileData> {
  try {
    // Normalize the ENS name
    let normalizedName: string;
    try {
      normalizedName = normalize(ensName);
    } catch {
      return {
        ensName,
        normalizedName: ensName,
        address: null,
        avatar: null,
        header: null,
        resolver: null,
        textRecords: {},
        contentHash: null,
        error: `Invalid ENS name format: "${ensName}"`,
        notFound: true,
      };
    }

    // Get resolver
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
        header: null,
        resolver: null,
        textRecords: {},
        contentHash: null,
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

    // Get header from text records
    const header = textRecords["header"] || null;

    // Consider the name "not found" if it has no address AND no text records
    const hasNoData = !address && Object.keys(textRecords).length === 0;
    
    if (hasNoData) {
      return {
        ensName,
        normalizedName,
        address: null,
        avatar: null,
        header: null,
        resolver,
        textRecords: {},
        contentHash: null,
        error: `ENS name "${ensName}" is not registered or has no data`,
        notFound: true,
      };
    }

    return {
      ensName,
      normalizedName,
      address,
      avatar,
      header,
      resolver,
      textRecords,
      contentHash: textRecords["contenthash"] || null,
    };
  } catch (error) {
    return {
      ensName,
      normalizedName: ensName,
      address: null,
      avatar: null,
      header: null,
      resolver: null,
      textRecords: {},
      contentHash: null,
      error: error instanceof Error ? error.message : "Failed to resolve ENS name",
    };
  }
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getEtherscanUrl(address: string): string {
  return `https://etherscan.io/address/${address}`;
}
