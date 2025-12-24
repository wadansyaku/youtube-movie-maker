import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
    params: Promise<{ id: string; sceneId: string }>;
}

// GET /api/episodes/[id]/scenes/[sceneId] - Get a single scene
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { sceneId } = await params;

        const scene = await prisma.scene.findUnique({
            where: { id: sceneId },
            include: {
                shots: {
                    include: {
                        shotAssets: {
                            include: { asset: true },
                        },
                    },
                    orderBy: { orderIndex: "asc" },
                },
            },
        });

        if (!scene) {
            return NextResponse.json(
                { error: "Scene not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(scene);
    } catch (error) {
        console.error("Failed to fetch scene:", error);
        return NextResponse.json(
            { error: "Failed to fetch scene" },
            { status: 500 }
        );
    }
}

// PATCH /api/episodes/[id]/scenes/[sceneId] - Update a scene
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { sceneId } = await params;
        const body = await request.json();
        const { name, description, durationSeconds } = body;

        const existing = await prisma.scene.findUnique({ where: { id: sceneId } });
        if (!existing) {
            return NextResponse.json(
                { error: "Scene not found" },
                { status: 404 }
            );
        }

        const updateData: Record<string, unknown> = {};
        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description?.trim() || null;
        if (durationSeconds !== undefined) updateData.durationSeconds = durationSeconds;

        const scene = await prisma.scene.update({
            where: { id: sceneId },
            data: updateData,
            include: { shots: { orderBy: { orderIndex: "asc" } } },
        });

        await prisma.auditLog.create({
            data: {
                action: "update",
                entityType: "scene",
                entityId: scene.id,
                oldValues: JSON.stringify(existing),
                newValues: JSON.stringify(scene),
            },
        });

        return NextResponse.json(scene);
    } catch (error) {
        console.error("Failed to update scene:", error);
        return NextResponse.json(
            { error: "Failed to update scene" },
            { status: 500 }
        );
    }
}

// DELETE /api/episodes/[id]/scenes/[sceneId] - Delete a scene
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { sceneId } = await params;

        const existing = await prisma.scene.findUnique({ where: { id: sceneId } });
        if (!existing) {
            return NextResponse.json(
                { error: "Scene not found" },
                { status: 404 }
            );
        }

        await prisma.scene.delete({ where: { id: sceneId } });

        await prisma.auditLog.create({
            data: {
                action: "delete",
                entityType: "scene",
                entityId: sceneId,
                oldValues: JSON.stringify(existing),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete scene:", error);
        return NextResponse.json(
            { error: "Failed to delete scene" },
            { status: 500 }
        );
    }
}
