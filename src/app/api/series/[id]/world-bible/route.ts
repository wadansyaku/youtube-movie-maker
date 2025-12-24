import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/series/[id]/world-bible - Get World Bible for a series
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const worldBible = await prisma.worldBible.findUnique({
            where: { seriesId: params.id },
        });

        if (!worldBible) {
            return NextResponse.json(
                { error: "World Bible not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(worldBible);
    } catch (error) {
        console.error("Failed to fetch World Bible:", error);
        return NextResponse.json(
            { error: "Failed to fetch World Bible" },
            { status: 500 }
        );
    }
}
