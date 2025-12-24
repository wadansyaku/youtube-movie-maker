import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/assets/[id] - Get a single asset
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;

        const asset = await prisma.asset.findUnique({
            where: { id },
            include: {
                assetTags: { include: { tag: true } },
                parentAsset: { select: { id: true, fileName: true, version: true } },
                childVersions: {
                    select: { id: true, fileName: true, version: true, createdAt: true },
                    orderBy: { version: "desc" },
                },
                generationRuns: { orderBy: { createdAt: "desc" } },
                reviews: {
                    include: {
                        reviewer: { select: { id: true, name: true, email: true, image: true } },
                        annotations: { orderBy: { timecodeStart: "asc" } },
                    },
                    orderBy: { createdAt: "desc" },
                },
                projectAssets: {
                    include: {
                        project: { select: { id: true, name: true } },
                    },
                },
                shotAssets: {
                    include: {
                        shot: {
                            include: {
                                scene: {
                                    select: { id: true, name: true, projectId: true },
                                },
                            },
                        },
                    },
                },
                episodeAssets: {
                    include: {
                        episode: { select: { id: true, title: true } },
                    },
                },
            },
        });

        if (!asset) {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }

        return NextResponse.json(asset);
    } catch (error) {
        console.error("Failed to fetch asset:", error);
        return NextResponse.json(
            { error: "Failed to fetch asset" },
            { status: 500 }
        );
    }
}

// PATCH /api/assets/[id] - Update an asset
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();
        const {
            fileName,
            type,
            source,
            duration,
            resolution,
            metadata,
            generationParams,
            status,
            licenseType,
            creditRequired,
        } = body;

        const existing = await prisma.asset.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }

        const updateData: Record<string, unknown> = {};
        if (fileName !== undefined) updateData.fileName = fileName;
        if (type !== undefined) updateData.type = type;
        if (source !== undefined) updateData.source = source;
        if (duration !== undefined) updateData.duration = duration;
        if (resolution !== undefined) updateData.resolution = resolution;
        if (metadata !== undefined) updateData.metadata = JSON.stringify(metadata);
        if (generationParams !== undefined)
            updateData.generationParams = JSON.stringify(generationParams);
        if (status !== undefined) updateData.status = status;
        if (licenseType !== undefined) updateData.licenseType = licenseType;
        if (creditRequired !== undefined) updateData.creditRequired = creditRequired;

        const asset = await prisma.asset.update({
            where: { id },
            data: updateData,
            include: {
                assetTags: { include: { tag: true } },
                generationRuns: { orderBy: { createdAt: "desc" }, take: 1 },
            },
        });

        await prisma.auditLog.create({
            data: {
                action: "update",
                entityType: "asset",
                entityId: asset.id,
                oldValues: JSON.stringify(existing),
                newValues: JSON.stringify(asset),
            },
        });

        return NextResponse.json(asset);
    } catch (error) {
        console.error("Failed to update asset:", error);
        return NextResponse.json(
            { error: "Failed to update asset" },
            { status: 500 }
        );
    }
}

// DELETE /api/assets/[id] - Soft delete an asset
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const hardDelete = searchParams.get("hard") === "true";

        const existing = await prisma.asset.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }

        if (hardDelete) {
            // Hard delete - remove from database
            await prisma.asset.delete({ where: { id } });
        } else {
            // Soft delete - mark as deleted
            await prisma.asset.update({
                where: { id },
                data: { status: "deleted" },
            });
        }

        await prisma.auditLog.create({
            data: {
                action: "delete",
                entityType: "asset",
                entityId: id,
                oldValues: JSON.stringify(existing),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete asset:", error);
        return NextResponse.json(
            { error: "Failed to delete asset" },
            { status: 500 }
        );
    }
}
