// Environment configuration
// All environment variables are optional - the app works with defaults

// RPC URL for Ethereum Mainnet
// Uses Alchemy if provided, otherwise falls back to public RPC
export function getRpcUrl(): string {
  // Check for Alchemy key (can be full URL or just the key)
  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY;
  
  if (alchemyKey) {
    // If it's already a full URL, use it directly
    if (alchemyKey.startsWith("http")) {
      return alchemyKey;
    }
    // Otherwise construct the URL with the key
    return `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`;
  }
  
  // Fallback to public RPC (slower, may have rate limits)
  return "https://cloudflare-eth.com";
}

// Database URL for edge persistence (optional)
export function getPostgresUrl(): string | undefined {
  const url = process.env.POSTGRES_URL;
  if (url && url !== "your-vercel-postgres-or-supabase-url") {
    return url;
  }
  return undefined;
}

// Check if we have a valid database configuration
export function hasDatabaseConfig(): boolean {
  return !!getPostgresUrl();
}
