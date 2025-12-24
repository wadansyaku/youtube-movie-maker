import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import archiver from "archiver";
import { PassThrough } from "stream";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/projects/[id]/export/zip - Generate ZIP file
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { id: projectId } = await params;

        // Fetch project with all related data
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                scenes: {
                    orderBy: { orderIndex: "asc" },
                    include: {
                        shots: {
                            orderBy: { orderIndex: "asc" },
                            include: {
                                heroAsset: true,
                                shotAssets: {
                                    include: { asset: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Create archive
        const archive = archiver("zip", { zlib: { level: 9 } });
        const passThrough = new PassThrough();
        archive.pipe(passThrough);

        // Add manifest.json
        const manifest = {
            project: {
                id: project.id,
                name: project.name,
                description: project.description,
                aspectRatio: project.aspectRatio,
            },
            scenes: project.scenes.map((scene, sceneIndex) => ({
                id: scene.id,
                name: scene.name,
                orderIndex: scene.orderIndex,
                shots: scene.shots.map((shot, shotIndex) => ({
                    id: shot.id,
                    name: shot.name,
                    orderIndex: shot.orderIndex,
                    heroAsset: shot.heroAsset
                        ? {
                            id: shot.heroAsset.id,
                            fileName: shot.heroAsset.fileName,
                            zipPath: `scenes/${String(sceneIndex + 1).padStart(2, "0")}_${scene.name}/shots/${String(shotIndex + 1).padStart(2, "0")}_${shot.name}/hero_${shot.heroAsset.fileName}`,
                        }
                        : null,
                })),
            })),
            exportedAt: new Date().toISOString(),
        };

        archive.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });

        // Add hero assets to archive
        // Note: In production, you would fetch actual files from S3
        // For now, we add placeholder info files
        for (const scene of project.scenes) {
            const sceneDir = `scenes/${String(scene.orderIndex + 1).padStart(2, "0")}_${scene.name.replace(/[^a-zA-Z0-9]/g, "_")}`;

            for (const shot of scene.shots) {
                const shotDir = `${sceneDir}/shots/${String(shot.orderIndex + 1).padStart(2, "0")}_${shot.name.replace(/[^a-zA-Z0-9]/g, "_")}`;

                if (shot.heroAsset) {
                    // Add info file about the hero asset
                    const assetInfo = {
                        id: shot.heroAsset.id,
                        fileName: shot.heroAsset.fileName,
                        filePath: shot.heroAsset.filePath,
                        type: shot.heroAsset.type,
                        duration: shot.heroAsset.duration,
                        source: shot.heroAsset.source,
                    };
                    archive.append(JSON.stringify(assetInfo, null, 2), {
                        name: `${shotDir}/hero_asset_info.json`,
                    });
                }

                // Add shot info
                const shotInfo = {
                    id: shot.id,
                    name: shot.name,
                    description: shot.description,
                    durationSeconds: shot.durationSeconds,
                    cameraMovement: shot.cameraMovement,
                    heroAssetId: shot.heroAssetId,
                    totalAssets: shot.shotAssets.length,
                };
                archive.append(JSON.stringify(shotInfo, null, 2), {
                    name: `${shotDir}/shot_info.json`,
                });
            }
        }

        // Create export record
        await prisma.export.create({
            data: {
                projectId,
                outputFormat: "zip",
                status: "completed",
            },
        });

        // Finalize archive
        archive.finalize();

        // Convert stream to buffer
        const chunks: Uint8Array[] = [];
        for await (const chunk of passThrough) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        // Return ZIP file
        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_export.zip"`,
            },
        });
    } catch (error) {
        console.error("Failed to export project as ZIP:", error);
        return NextResponse.json(
            { error: "Failed to export project" },
            { status: 500 }
        );
    }
}
