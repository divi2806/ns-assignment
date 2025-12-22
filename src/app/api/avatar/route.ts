import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import { NextRequest, NextResponse } from "next/server";

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const normalizedName = normalize(name);
    const avatar = await client.getEnsAvatar({ name: normalizedName });
    return NextResponse.json({ avatar });
  } catch (error) {
    return NextResponse.json({
      avatar: null,
      error: error instanceof Error ? error.message : "Failed to fetch avatar",
    });
  }
}
