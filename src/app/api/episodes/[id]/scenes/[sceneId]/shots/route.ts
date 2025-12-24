import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
    params: Promise<{ id: string; sceneId: string }>;
}

// GET /api/episodes/[id]/scenes/[sceneId]/shots - Get all shots for a scene
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { sceneId } = await params;

        const shots = await prisma.shot.findMany({
            where: { sceneId },
            include: {
                shotAssets: {
                    include: { asset: true },
                },
            },
            orderBy: { orderIndex: "asc" },
        });

        return NextResponse.json(shots);
    } catch (error) {
        console.error("Failed to fetch shots:", error);
        return NextResponse.json(
            { error: "Failed to fetch shots" },
            { status: 500 }
        );
    }
}

// POST /api/episodes/[id]/scenes/[sceneId]/shots - Create a new shot
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { sceneId } = await params;
        const body = await request.json();
        const { name, description, durationSeconds, cameraMovement } = body;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json(
                { error: "Shot name is required" },
                { status: 400 }
            );
        }

        // Get next order index
        const lastShot = await prisma.shot.findFirst({
            where: { sceneId },
            orderBy: { orderIndex: "desc" },
        });
        const orderIndex = (lastShot?.orderIndex ?? -1) + 1;

        const shot = await prisma.shot.create({
            data: {
                sceneId,
                name: name.trim(),
                description: description?.trim() || null,
                durationSeconds: durationSeconds || null,
                cameraMovement: cameraMovement || null,
                orderIndex,
            },
            include: {
                shotAssets: { include: { asset: true } },
            },
        });

        await prisma.auditLog.create({
            data: {
                action: "create",
                entityType: "shot",
                entityId: shot.id,
                newValues: JSON.stringify(shot),
            },
        });

        return NextResponse.json(shot, { status: 201 });
    } catch (error) {
        console.error("Failed to create shot:", error);
        return NextResponse.json(
            { error: "Failed to create shot" },
            { status: 500 }
        );
    }
}

// PUT /api/episodes/[id]/scenes/[sceneId]/shots - Reorder shots
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const { sceneId } = await params;
        const body = await request.json();
        const { shotIds } = body;

        if (!Array.isArray(shotIds)) {
            return NextResponse.json(
                { error: "shotIds must be an array" },
                { status: 400 }
            );
        }

        await Promise.all(
            shotIds.map((shotId: string, index: number) =>
                prisma.shot.update({
                    where: { id: shotId, sceneId },
                    data: { orderIndex: index },
                })
            )
        );

        const shots = await prisma.shot.findMany({
            where: { sceneId },
            include: { shotAssets: { include: { asset: true } } },
            orderBy: { orderIndex: "asc" },
        });

        return NextResponse.json(shots);
    } catch (error) {
        console.error("Failed to reorder shots:", error);
        return NextResponse.json(
            { error: "Failed to reorder shots" },
            { status: 500 }
        );
    }
}
