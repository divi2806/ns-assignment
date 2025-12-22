import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { edges } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET - Fetch all edges
export async function GET() {
  try {
    const allEdges = await db.select().from(edges);
    return NextResponse.json(allEdges);
  } catch (error) {
    console.error("Failed to fetch edges:", error);
    return NextResponse.json({ error: "Failed to fetch edges" }, { status: 500 });
  }
}

// POST - Add edge
export async function POST(request: NextRequest) {
  try {
    const { source, target } = await request.json();

    if (!source || !target) {
      return NextResponse.json(
        { error: "Source and target are required" },
        { status: 400 }
      );
    }

    const newEdge = await db
      .insert(edges)
      .values({ source, target })
      .returning();

    return NextResponse.json(newEdge[0]);
  } catch (error) {
    console.error("Failed to add edge:", error);
    return NextResponse.json({ error: "Failed to add edge" }, { status: 500 });
  }
}

// DELETE - Remove edge
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await db.delete(edges).where(eq(edges.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete edge:", error);
    return NextResponse.json({ error: "Failed to delete edge" }, { status: 500 });
  }
}
