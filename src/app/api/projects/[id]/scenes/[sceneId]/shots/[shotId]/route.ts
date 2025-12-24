import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
    params: Promise<{ id: string; sceneId: string; shotId: string }>;
}

// GET /api/projects/[id]/scenes/[sceneId]/shots/[shotId]
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { shotId } = await params;

        const shot = await prisma.shot.findUnique({
            where: { id: shotId },
            include: {
                scene: {
                    include: {
                        project: { select: { id: true, name: true } },
                    },
                },
                heroAsset: {
                    include: {
                        generationRuns: { orderBy: { createdAt: "desc" }, take: 1 },
                    },
                },
                shotAssets: {
                    include: {
                        asset: {
                            include: {
                                generationRuns: { orderBy: { createdAt: "desc" }, take: 1 },
                                reviews: {
                                    orderBy: { createdAt: "desc" },
                                    take: 1,
                                    include: {
                                        reviewer: { select: { id: true, name: true, image: true } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!shot) {
            return NextResponse.json({ error: "Shot not found" }, { status: 404 });
        }

        return NextResponse.json(shot);
    } catch (error) {
        console.error("Failed to fetch shot:", error);
        return NextResponse.json(
            { error: "Failed to fetch shot" },
            { status: 500 }
        );
    }
}

// PATCH /api/projects/[id]/scenes/[sceneId]/shots/[shotId]
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { shotId } = await params;
        const body = await request.json();
        const { name, description, durationSeconds, cameraMovement, heroAssetId } = body;

        const existing = await prisma.shot.findUnique({ where: { id: shotId } });
        if (!existing) {
            return NextResponse.json({ error: "Shot not found" }, { status: 404 });
        }

        const updateData: Record<string, unknown> = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (durationSeconds !== undefined) updateData.durationSeconds = durationSeconds;
        if (cameraMovement !== undefined) updateData.cameraMovement = cameraMovement;
        if (heroAssetId !== undefined) updateData.heroAssetId = heroAssetId;

        const shot = await prisma.shot.update({
            where: { id: shotId },
            data: updateData,
            include: {
                heroAsset: true,
                shotAssets: { include: { asset: true } },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: "update",
                entityType: "shot",
                entityId: shot.id,
                oldValues: JSON.stringify(existing),
                newValues: JSON.stringify(shot),
            },
        });

        return NextResponse.json(shot);
    } catch (error) {
        console.error("Failed to update shot:", error);
        return NextResponse.json(
            { error: "Failed to update shot" },
            { status: 500 }
        );
    }
}

// DELETE /api/projects/[id]/scenes/[sceneId]/shots/[shotId]
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { shotId } = await params;

        const existing = await prisma.shot.findUnique({ where: { id: shotId } });
        if (!existing) {
            return NextResponse.json({ error: "Shot not found" }, { status: 404 });
        }

        await prisma.shot.delete({ where: { id: shotId } });

        await prisma.auditLog.create({
            data: {
                action: "delete",
                entityType: "shot",
                entityId: shotId,
                oldValues: JSON.stringify(existing),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete shot:", error);
        return NextResponse.json(
            { error: "Failed to delete shot" },
            { status: 500 }
        );
    }
}
