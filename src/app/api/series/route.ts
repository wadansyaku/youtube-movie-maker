import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/series - List all series
export async function GET() {
    try {
        const series = await prisma.series.findMany({
            select: {
                id: true,
                title: true,
                status: true,
            },
            orderBy: { updatedAt: 'desc' },
        });

        return NextResponse.json(series);
    } catch (error) {
        console.error("Failed to fetch series:", error);
        return NextResponse.json(
            { error: "Failed to fetch series" },
            { status: 500 }
        );
    }
}
