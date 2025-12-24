import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/projects/[id] - Get a single project
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;

        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                createdBy: {
                    select: { id: true, name: true, email: true, image: true },
                },
                scenes: {
                    include: {
                        shots: {
                            include: {
                                shotAssets: {
                                    include: {
                                        asset: true,
                                    },
                                },
                            },
                            orderBy: { orderIndex: "asc" },
                        },
                    },
                    orderBy: { orderIndex: "asc" },
                },
                referenceSets: {
                    include: {
                        items: true,
                    },
                },
                projectAssets: {
                    include: {
                        asset: {
                            include: {
                                generationRuns: true,
                                reviews: {
                                    include: {
                                        reviewer: {
                                            select: { id: true, name: true, email: true },
                                        },
                                    },
                                    orderBy: { createdAt: "desc" },
                                    take: 1,
                                },
                            },
                        },
                    },
                },
                exports: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                },
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(project);
    } catch (error) {
        console.error("Failed to fetch project:", error);
        return NextResponse.json(
            { error: "Failed to fetch project" },
            { status: 500 }
        );
    }
}

// PATCH /api/projects/[id] - Update a project
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, description, status, targetDurationSeconds, aspectRatio } = body;

        const existing = await prisma.project.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        const updateData: Record<string, unknown> = {};
        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description?.trim() || null;
        if (status !== undefined) updateData.status = status;
        if (targetDurationSeconds !== undefined) updateData.targetDurationSeconds = targetDurationSeconds;
        if (aspectRatio !== undefined) updateData.aspectRatio = aspectRatio;

        const project = await prisma.project.update({
            where: { id },
            data: updateData,
            include: {
                scenes: {
                    include: { shots: true },
                    orderBy: { orderIndex: "asc" },
                },
            },
        });

        // Log update
        await prisma.auditLog.create({
            data: {
                action: "update",
                entityType: "project",
                entityId: project.id,
                oldValues: JSON.stringify(existing),
                newValues: JSON.stringify(project),
            },
        });

        return NextResponse.json(project);
    } catch (error) {
        console.error("Failed to update project:", error);
        return NextResponse.json(
            { error: "Failed to update project" },
            { status: 500 }
        );
    }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;

        const existing = await prisma.project.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        await prisma.project.delete({ where: { id } });

        // Log deletion
        await prisma.auditLog.create({
            data: {
                action: "delete",
                entityType: "project",
                entityId: id,
                oldValues: JSON.stringify(existing),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete project:", error);
        return NextResponse.json(
            { error: "Failed to delete project" },
            { status: 500 }
        );
    }
}
