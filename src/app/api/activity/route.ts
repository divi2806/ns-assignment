import { NextRequest, NextResponse } from "next/server";
import { hasDatabaseConfig, getEtherscanApiKey } from "@/lib/config";
import { db } from "@/lib/db";
import { activityCache } from "@/db/schema";
import { eq } from "drizzle-orm";

interface Activity {
  date: string;
  count: number;
}

interface EtherscanTransaction {
  timeStamp: string;
  from: string;
  to: string;
  hash: string;
}

// Cache expiration: 24 hours
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  // Normalize address to lowercase
  const normalizedAddress = address.toLowerCase();

  // Try to get from cache if database is available
  if (hasDatabaseConfig()) {
    try {
      const cached = await db
        .select()
        .from(activityCache)
        .where(eq(activityCache.address, normalizedAddress))
        .limit(1);

      if (cached.length > 0) {
        const cacheEntry = cached[0];
        const cacheAge = Date.now() - new Date(cacheEntry.updatedAt!).getTime();

        // Return cached data if less than 24 hours old
        if (cacheAge < CACHE_EXPIRATION_MS) {
          console.log(`Using cached activity data for ${normalizedAddress}`);
          return NextResponse.json({
            activities: JSON.parse(cacheEntry.activitiesJson),
            maxCount: cacheEntry.maxCount,
            cached: true,
            cacheAge: Math.floor(cacheAge / 1000 / 60), // minutes
          });
        }
        
        console.log(`Cache expired for ${normalizedAddress}, fetching fresh data`);
      }
    } catch (error) {
      console.log("Cache check failed, proceeding with fresh fetch:", error);
    }
  }

  try {
    const etherscanApiKey = getEtherscanApiKey();
    
    if (!etherscanApiKey) {
      throw new Error("Etherscan API key not configured");
    }

    console.log(`Fetching transactions from Etherscan for ${normalizedAddress}`);

    // Fetch both normal and internal transactions from Etherscan
    const [normalTxResponse, internalTxResponse] = await Promise.all([
      fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10000&sort=asc&apikey=${etherscanApiKey}`),
      fetch(`https://api.etherscan.io/api?module=account&action=txlistinternal&address=${address}&startblock=0&endblock=99999999&page=1&offset=10000&sort=asc&apikey=${etherscanApiKey}`)
    ]);
    
    const normalTxData = await normalTxResponse.json();
    const internalTxData = await internalTxResponse.json();

    const normalTransactions: EtherscanTransaction[] = normalTxData.status === "1" && Array.isArray(normalTxData.result) ? normalTxData.result : [];
    const internalTransactions: EtherscanTransaction[] = internalTxData.status === "1" && Array.isArray(internalTxData.result) ? internalTxData.result : [];
    
    const allTransactions = [...normalTransactions, ...internalTransactions];
    console.log(`Fetched ${normalTransactions.length} normal + ${internalTransactions.length} internal = ${allTransactions.length} total transactions`);

    // Group transactions by date
    const activityMap = new Map<string, number>();
    
    allTransactions.forEach((tx) => {
      const timestamp = parseInt(tx.timeStamp) * 1000; // Convert to milliseconds
      const date = new Date(timestamp);
      const dateStr = date.toISOString().split('T')[0];
      
      activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
    });

    // Generate last 365 days of activity
    const activities: Activity[] = [];
    const today = new Date();
    
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      activities.push({
        date: dateStr,
        count: activityMap.get(dateStr) || 0,
      });
    }

    const maxCount = Math.max(...activities.map(a => a.count), 1);
    const reversedActivities = activities;

    // Store in cache if database is available
    if (hasDatabaseConfig()) {
      try {
        await db
          .insert(activityCache)
          .values({
            address: normalizedAddress,
            activitiesJson: JSON.stringify(reversedActivities),
            maxCount,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: activityCache.address,
            set: {
              activitiesJson: JSON.stringify(reversedActivities),
              maxCount,
              updatedAt: new Date(),
            },
          });
        
        console.log(`Cached activity data for ${normalizedAddress}`);
      } catch (cacheError) {
        console.error("Failed to cache activity data:", cacheError);
      }
    }

    return NextResponse.json({
      activities: reversedActivities,
      maxCount,
      cached: false,
    });
  } catch (error) {
    console.error("Failed to fetch activity:", error);
    
    // Check cache one more time before returning demo data
    if (hasDatabaseConfig()) {
      try {
        const cached = await db
          .select()
          .from(activityCache)
          .where(eq(activityCache.address, normalizedAddress))
          .limit(1);

        if (cached.length > 0) {
          console.log(`Using stale cache for ${normalizedAddress} due to fetch error`);
          return NextResponse.json({
            activities: JSON.parse(cached[0].activitiesJson),
            maxCount: cached[0].maxCount,
            cached: true,
            stale: true,
          });
        }
      } catch (cacheError) {
        console.error("Failed to retrieve stale cache:", cacheError);
      }
    }
    
    // Return mock data for demo purposes
    const activities: Activity[] = [];
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Generate some random activity for demo
      const count = Math.random() > 0.7 ? Math.floor(Math.random() * 10) : 0;
      
      activities.push({
        date: dateStr,
        count,
      });
    }

    return NextResponse.json({
      activities: activities.reverse(),
      maxCount: 10,
      demo: true,
    });
  }
}

