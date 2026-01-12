import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import archiver from "archiver";
import fs from "fs";
import path from "path";
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
        const projectRoot = process.cwd();
        const missingAssets: Array<{ id: string; fileName: string; filePath: string | null }> = [];
        const assetZipIndex = new Map<string, { zipPath: string; included: boolean }>();

        const sanitize = (value: string) =>
            value.replace(/[^a-zA-Z0-9._-]/g, "_") || "asset";

        const resolveAssetPath = (filePath?: string | null): string | null => {
            if (!filePath || typeof filePath !== "string") return null;
            const trimmed = filePath.trim();
            if (!trimmed) return null;
            if (/^(https?:|s3:)/i.test(trimmed)) return null;

            const candidates: string[] = [];
            if (path.isAbsolute(trimmed)) {
                candidates.push(path.resolve(trimmed));
                candidates.push(path.resolve(projectRoot, trimmed.replace(/^\/+/, "")));
            } else {
                candidates.push(path.resolve(projectRoot, trimmed.replace(/^\/+/, "")));
            }

            for (const candidate of candidates) {
                const relative = path.relative(projectRoot, candidate);
                if (relative.startsWith("..") || path.isAbsolute(relative)) continue;
                if (!fs.existsSync(candidate)) continue;
                return candidate;
            }

            return null;
        };

        const ensureAssetInArchive = (asset: { id: string; fileName: string; filePath: string | null }) => {
            const existing = assetZipIndex.get(asset.id);
            if (existing) return existing;

            const safeName = sanitize(asset.fileName || asset.id);
            const zipPath = `assets/${asset.id}_${safeName}`;
            const resolvedPath = resolveAssetPath(asset.filePath);

            const entry = { zipPath, included: Boolean(resolvedPath) };
            assetZipIndex.set(asset.id, entry);

            if (resolvedPath) {
                archive.file(resolvedPath, { name: zipPath });
            } else {
                missingAssets.push({
                    id: asset.id,
                    fileName: asset.fileName,
                    filePath: asset.filePath || null,
                });
            }

            return entry;
        };

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
                            zipPath: (() => {
                                const entry = ensureAssetInArchive(shot.heroAsset);
                                return entry.included ? entry.zipPath : null;
                            })(),
                            included: ensureAssetInArchive(shot.heroAsset).included,
                        }
                        : null,
                    assets: shot.shotAssets.map((sa) => {
                        const entry = ensureAssetInArchive(sa.asset);
                        return {
                            id: sa.asset.id,
                            fileName: sa.asset.fileName,
                            type: sa.asset.type,
                            role: sa.role,
                            zipPath: entry.included ? entry.zipPath : null,
                            included: entry.included,
                            filePath: sa.asset.filePath,
                        };
                    }),
                })),
            })),
            missingAssets,
            exportedAt: new Date().toISOString(),
        };

        archive.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });

        // Add shot metadata files (asset files are included when found locally).
        for (const scene of project.scenes) {
            const sceneDir = `scenes/${String(scene.orderIndex + 1).padStart(2, "0")}_${sanitize(scene.name)}`;

            for (const shot of scene.shots) {
                const shotDir = `${sceneDir}/shots/${String(shot.orderIndex + 1).padStart(2, "0")}_${sanitize(shot.name)}`;

                if (shot.heroAsset) {
                    const heroEntry = ensureAssetInArchive(shot.heroAsset);
                    // Add info file about the hero asset
                    const assetInfo = {
                        id: shot.heroAsset.id,
                        fileName: shot.heroAsset.fileName,
                        filePath: shot.heroAsset.filePath,
                        type: shot.heroAsset.type,
                        duration: shot.heroAsset.duration,
                        source: shot.heroAsset.source,
                        zipPath: heroEntry.included ? heroEntry.zipPath : null,
                        included: heroEntry.included,
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
