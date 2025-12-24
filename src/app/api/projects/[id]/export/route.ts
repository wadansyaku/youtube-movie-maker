import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/projects/[id]/export - Create export (ZIP or CSV)
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { id: projectId } = await params;
        const body = await request.json();
        const { format = "csv" } = body; // csv or zip

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
                projectAssets: {
                    include: { asset: true },
                },
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        if (format === "csv") {
            // Generate CSV
            const csvRows: string[] = [];

            // Header
            csvRows.push([
                "Scene",
                "Scene Order",
                "Shot",
                "Shot Order",
                "Duration (s)",
                "Camera Movement",
                "Hero Asset",
                "Hero Asset Type",
                "Hero Asset Source",
                "All Assets",
            ].join(","));

            // Data rows
            for (const scene of project.scenes) {
                for (const shot of scene.shots) {
                    const allAssets = shot.shotAssets.map((sa) => sa.asset.fileName).join("; ");
                    csvRows.push([
                        `"${scene.name}"`,
                        scene.orderIndex.toString(),
                        `"${shot.name}"`,
                        shot.orderIndex.toString(),
                        shot.durationSeconds?.toString() || "",
                        shot.cameraMovement || "",
                        shot.heroAsset?.fileName || "",
                        shot.heroAsset?.type || "",
                        shot.heroAsset?.source || "",
                        `"${allAssets}"`,
                    ].join(","));
                }
            }

            const csvContent = csvRows.join("\n");

            // Create export record
            const exportRecord = await prisma.export.create({
                data: {
                    projectId,
                    outputFormat: "csv",
                    status: "completed",
                },
            });

            // Log
            await prisma.auditLog.create({
                data: {
                    action: "export",
                    entityType: "project",
                    entityId: projectId,
                    newValues: JSON.stringify({ exportId: exportRecord.id, format: "csv" }),
                },
            });

            return new NextResponse(csvContent, {
                headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition": `attachment; filename="${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_export.csv"`,
                },
            });
        }

        // For ZIP format, return metadata (actual ZIP creation would need streaming)
        const exportData = {
            project: {
                id: project.id,
                name: project.name,
                description: project.description,
                aspectRatio: project.aspectRatio,
                targetDurationSeconds: project.targetDurationSeconds,
            },
            scenes: project.scenes.map((scene) => ({
                id: scene.id,
                name: scene.name,
                orderIndex: scene.orderIndex,
                shots: scene.shots.map((shot) => ({
                    id: shot.id,
                    name: shot.name,
                    orderIndex: shot.orderIndex,
                    durationSeconds: shot.durationSeconds,
                    cameraMovement: shot.cameraMovement,
                    heroAsset: shot.heroAsset
                        ? {
                            id: shot.heroAsset.id,
                            fileName: shot.heroAsset.fileName,
                            filePath: shot.heroAsset.filePath,
                            type: shot.heroAsset.type,
                        }
                        : null,
                    assets: shot.shotAssets.map((sa) => ({
                        id: sa.asset.id,
                        fileName: sa.asset.fileName,
                        filePath: sa.asset.filePath,
                        type: sa.asset.type,
                        role: sa.role,
                    })),
                })),
            })),
            exportedAt: new Date().toISOString(),
        };

        // Create export record
        const exportRecord = await prisma.export.create({
            data: {
                projectId,
                outputFormat: "json",
                status: "completed",
            },
        });

        await prisma.auditLog.create({
            data: {
                action: "export",
                entityType: "project",
                entityId: projectId,
                newValues: JSON.stringify({ exportId: exportRecord.id, format: "json" }),
            },
        });

        return NextResponse.json(exportData);
    } catch (error) {
        console.error("Failed to export project:", error);
        return NextResponse.json(
            { error: "Failed to export project" },
            { status: 500 }
        );
    }
}

// GET /api/projects/[id]/export - Get export history
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id: projectId } = await params;

        const exports = await prisma.export.findMany({
            where: { projectId },
            include: {
                exportedBy: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(exports);
    } catch (error) {
        console.error("Failed to fetch exports:", error);
        return NextResponse.json(
            { error: "Failed to fetch exports" },
            { status: 500 }
        );
    }
}
