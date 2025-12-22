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
  textRecords: Record<string, string | null>;
  error?: string;
}

const TEXT_RECORD_KEYS = [
  "description",
  "url",
  "com.twitter",
  "com.github",
  "com.discord",
  "email",
  "location",
  "keywords",
];

export async function fetchENSProfile(ensName: string): Promise<ENSProfileData> {
  try {
    const normalizedName = normalize(ensName);

    // Fetch basic data in parallel
    const [address, avatar] = await Promise.all([
      client.getEnsAddress({ name: normalizedName }),
      client.getEnsAvatar({ name: normalizedName }),
    ]);

    // Fetch text records in parallel
    const textRecordPromises = TEXT_RECORD_KEYS.map(async (key) => {
      const value = await client.getEnsText({ name: normalizedName, key });
      return [key, value] as [string, string | null];
    });

    const textRecordResults = await Promise.all(textRecordPromises);
    const textRecords: Record<string, string | null> = {};
    for (const [key, value] of textRecordResults) {
      textRecords[key] = value;
    }

    return {
      ensName,
      normalizedName,
      address,
      avatar,
      textRecords,
    };
  } catch (error) {
    return {
      ensName,
      normalizedName: ensName,
      address: null,
      avatar: null,
      textRecords: {},
      error: error instanceof Error ? error.message : "Failed to resolve ENS name",
    };
  }
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
