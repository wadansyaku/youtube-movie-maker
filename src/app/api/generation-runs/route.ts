import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/generation-runs - List generation runs
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const platform = searchParams.get("platform");
        const assetId = searchParams.get("assetId");
        const seriesId = searchParams.get("seriesId");
        const episodeId = searchParams.get("episodeId");
        const status = searchParams.get("status");
        const search = searchParams.get("search");
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");

        const where: Record<string, unknown> = {};

        if (platform) {
            where.platform = platform;
        }

        if (assetId) {
            where.assetId = assetId;
        }

        if (seriesId) {
            where.seriesId = seriesId;
        }

        if (episodeId) {
            where.episodeId = episodeId;
        }

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { prompt: { contains: search } },
                { modelVersion: { contains: search } },
            ];
        }

        const [runs, total] = await Promise.all([
            prisma.generationRun.findMany({
                where,
                include: {
                    asset: {
                        select: {
                            id: true,
                            fileName: true,
                            type: true,
                            filePath: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset,
            }),
            prisma.generationRun.count({ where }),
        ]);

        return NextResponse.json({
            runs,
            total,
            limit,
            offset,
        });
    } catch (error) {
        console.error("Failed to fetch generation runs:", error);
        return NextResponse.json(
            { error: "Failed to fetch generation runs" },
            { status: 500 }
        );
    }
}

// POST /api/generation-runs - Create a generation run
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            assetId,
            platform,
            modelVersion,
            prompt,
            negativePrompt,
            parameters,
            externalJobId,
            externalUrl,
            status,
            costCredits,
            costUsd,
            generationTimeSeconds,
            seriesId,
            episodeId,
        } = body;

        if (!platform) {
            return NextResponse.json(
                { error: "platform is required" },
                { status: 400 }
            );
        }

        let targetAssetId = assetId;

        // If no assetId provided, create a new Asset placeholder
        if (!targetAssetId) {
            const type = ["suno", "udio"].includes(platform) ? "audio" : "video";
            const newAsset = await prisma.asset.create({
                data: {
                    type,
                    fileName: prompt ? `Generated: ${prompt.slice(0, 30)}...` : "Untitled Generation",
                    filePath: "", // Placeholder
                    source: platform,
                    status: "generating",
                    generationParams: JSON.stringify(parameters || {}),
                }
            });
            targetAssetId = newAsset.id;
        }

        const run = await prisma.generationRun.create({
            data: {
                assetId: targetAssetId,
                seriesId: seriesId || null,
                episodeId: episodeId || null,
                platform,
                modelVersion: modelVersion || null,
                prompt: prompt || null,
                negativePrompt: negativePrompt || null,
                parameters: JSON.stringify(parameters || {}),
                externalJobId: externalJobId || null,
                externalUrl: externalUrl || null,
                status: status || "processing",
                costCredits: costCredits || null,
                costUsd: costUsd || null,
                generationTimeSeconds: generationTimeSeconds || null,
            },
            include: {
                asset: {
                    select: { id: true, fileName: true, type: true, filePath: true, status: true },
                },
            },
        });

        return NextResponse.json(run, { status: 201 });
    } catch (error) {
        console.error("Failed to create generation run:", error);
        return NextResponse.json(
            { error: "Failed to create generation run" },
            { status: 500 }
        );
    }
}
