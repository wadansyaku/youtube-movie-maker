import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createVideoThumbnail } from "@/lib/video-thumbnails";

// GET /api/assets - List all assets
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");
        const source = searchParams.get("source");
        const projectId = searchParams.get("projectId");
        const search = searchParams.get("search");
        const status = searchParams.get("status");
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");

        const where: Record<string, unknown> = {};

        if (type) {
            where.type = type;
        }

        if (source) {
            where.source = source;
        }

        if (status) {
            where.status = status;
        } else {
            where.status = "active"; // Default to active assets
        }

        if (search) {
            where.OR = [
                { fileName: { contains: search } },
                { metadata: { contains: search } },
            ];
        }

        // Filter by project if specified
        let assetIds: string[] | undefined;
        if (projectId) {
            const projectAssets = await prisma.projectAsset.findMany({
                where: { projectId },
                select: { assetId: true },
            });
            assetIds = projectAssets.map((pa) => pa.assetId);
            if (assetIds.length === 0) {
                return NextResponse.json({ assets: [], total: 0, limit, offset });
            }
            where.id = { in: assetIds };
        }

        const [assets, total] = await Promise.all([
            prisma.asset.findMany({
                where,
                include: {
                    assetTags: { include: { tag: true } },
                    generationRuns: { orderBy: { createdAt: "desc" }, take: 1 },
                    reviews: {
                        orderBy: { createdAt: "desc" },
                        take: 1,
                        include: {
                            reviewer: { select: { id: true, name: true, image: true } },
                        },
                    },
                    _count: {
                        select: {
                            projectAssets: true,
                            shotAssets: true,
                            childVersions: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset,
            }),
            prisma.asset.count({ where }),
        ]);

        return NextResponse.json({
            assets,
            total,
            limit,
            offset,
        });
    } catch (error) {
        console.error("Failed to fetch assets:", error);
        return NextResponse.json(
            { error: "Failed to fetch assets" },
            { status: 500 }
        );
    }
}

// POST /api/assets - Create a new asset (manual import)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            fileName,
            filePath,
            type,
            source,
            fileSize,
            mimeType,
            duration,
            resolution,
            metadata,
            generationParams,
            licenseType,
            creditRequired,
            projectId,
            prompt,
            modelVersion,
            platform,
        } = body;

        if (!fileName || !filePath || !type) {
            return NextResponse.json(
                { error: "fileName, filePath, and type are required" },
                { status: 400 }
            );
        }

        // Create asset
        const metadataObj = metadata || {};
        const asset = await prisma.asset.create({
            data: {
                fileName,
                filePath,
                type,
                source: source || "manual",
                fileSize: fileSize || null,
                mimeType: mimeType || null,
                duration: duration || null,
                resolution: resolution || null,
                metadata: JSON.stringify(metadataObj),
                generationParams: JSON.stringify(generationParams || {}),
                licenseType: licenseType || null,
                creditRequired: creditRequired || null,
                status: "active",
                version: 1,
            },
            include: {
                assetTags: { include: { tag: true } },
            },
        });

        if (type === "video") {
            const thumbnailPath = await createVideoThumbnail(asset.id, asset.filePath);
            if (thumbnailPath) {
                await prisma.asset.update({
                    where: { id: asset.id },
                    data: {
                        metadata: JSON.stringify({
                            ...metadataObj,
                            thumbnailPath,
                        }),
                    },
                });
            }
        }

        // Create generation run if prompt/model info provided
        if (prompt || modelVersion || platform) {
            await prisma.generationRun.create({
                data: {
                    assetId: asset.id,
                    platform: platform || source || "manual",
                    modelVersion: modelVersion || null,
                    prompt: prompt || null,
                    status: "completed",
                },
            });
        }

        // Link to project if specified
        if (projectId) {
            await prisma.projectAsset.create({
                data: {
                    projectId,
                    assetId: asset.id,
                },
            });
        }

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: "create",
                entityType: "asset",
                entityId: asset.id,
                newValues: JSON.stringify(asset),
            },
        });

        // Fetch complete asset with relations
        const completeAsset = await prisma.asset.findUnique({
            where: { id: asset.id },
            include: {
                assetTags: { include: { tag: true } },
                generationRuns: true,
                projectAssets: true,
            },
        });

        return NextResponse.json(completeAsset, { status: 201 });
    } catch (error) {
        console.error("Failed to create asset:", error);
        return NextResponse.json(
            { error: "Failed to create asset" },
            { status: 500 }
        );
    }
}
