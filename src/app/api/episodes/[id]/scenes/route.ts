import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/episodes/[id]/scenes - Get all scenes for an episode
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id: episodeId } = await params;

        const scenes = await prisma.scene.findMany({
            where: { episodeId },
            include: {
                shots: {
                    orderBy: { orderIndex: "asc" },
                },
            },
            orderBy: { orderIndex: "asc" },
        });

        return NextResponse.json(scenes);
    } catch (error) {
        console.error("Failed to fetch scenes:", error);
        return NextResponse.json(
            { error: "Failed to fetch scenes" },
            { status: 500 }
        );
    }
}

// POST /api/episodes/[id]/scenes - Create a new scene
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { id: episodeId } = await params;
        const body = await request.json();
        const { name, description, durationSeconds } = body;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json(
                { error: "Scene name is required" },
                { status: 400 }
            );
        }

        // Get next order index
        const lastScene = await prisma.scene.findFirst({
            where: { episodeId },
            orderBy: { orderIndex: "desc" },
        });
        const orderIndex = (lastScene?.orderIndex ?? -1) + 1;

        const scene = await prisma.scene.create({
            data: {
                episodeId,
                name: name.trim(),
                description: description?.trim() || null,
                durationSeconds: durationSeconds || null,
                orderIndex,
            },
            include: {
                shots: true,
            },
        });

        // Log creation
        await prisma.auditLog.create({
            data: {
                action: "create",
                entityType: "scene",
                entityId: scene.id,
                newValues: JSON.stringify(scene),
            },
        });

        return NextResponse.json(scene, { status: 201 });
    } catch (error) {
        console.error("Failed to create scene:", error);
        return NextResponse.json(
            { error: "Failed to create scene" },
            { status: 500 }
        );
    }
}

// PUT /api/episodes/[id]/scenes - Reorder scenes
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const { id: episodeId } = await params;
        const body = await request.json();
        const { sceneIds } = body;

        if (!Array.isArray(sceneIds)) {
            return NextResponse.json(
                { error: "sceneIds must be an array" },
                { status: 400 }
            );
        }

        // Update order indices
        await Promise.all(
            sceneIds.map((sceneId: string, index: number) =>
                prisma.scene.update({
                    where: { id: sceneId, episodeId },
                    data: { orderIndex: index },
                })
            )
        );

        const scenes = await prisma.scene.findMany({
            where: { episodeId },
            include: { shots: { orderBy: { orderIndex: "asc" } } },
            orderBy: { orderIndex: "asc" },
        });

        return NextResponse.json(scenes);
    } catch (error) {
        console.error("Failed to reorder scenes:", error);
        return NextResponse.json(
            { error: "Failed to reorder scenes" },
            { status: 500 }
        );
    }
}
