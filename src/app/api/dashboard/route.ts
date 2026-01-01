import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const [
            totalProjects,
            activeProjects,
            totalSeries,
            activeSeries,
            totalAssets,
            pendingReviews,
            recentActivity,
            recentProjects,
            recentSeries,
        ] = await Promise.all([
            prisma.project.count(),
            prisma.project.count({
                where: { status: { in: ["in_progress", "review"] } },
            }),
            prisma.series.count(),
            prisma.series.count({
                where: { status: "active" },
            }),
            prisma.asset.count({ where: { status: "active" } }),
            prisma.review.count({ where: { status: "pending" } }),
            prisma.auditLog.findMany({
                take: 10,
                orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { name: true } },
                },
            }),
            prisma.project.findMany({
                take: 5,
                orderBy: { updatedAt: "desc" },
                include: {
                    _count: {
                        select: { scenes: true, projectAssets: true },
                    },
                },
            }),
            prisma.series.findMany({
                take: 5,
                orderBy: { updatedAt: "desc" },
                include: {
                    _count: {
                        select: { productionEpisodes: true },
                    },
                },
            }),
        ]);

        return NextResponse.json({
            totalProjects,
            activeProjects,
            totalSeries,
            activeSeries,
            totalAssets,
            pendingReviews,
            recentActivity,
            recentProjects,
            recentSeries,
        });
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard data" },
            { status: 500 }
        );
    }
}
