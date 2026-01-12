import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

function slugify(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
}

function safeFileName(value: string) {
    return value.replace(/[\\/:"*?<>|]+/g, "").trim();
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const theme = typeof body.theme === "string" ? body.theme.trim() : "";
        const tone = typeof body.tone === "string" ? body.tone.trim() : "";
        const title = typeof body.title === "string" ? body.title.trim() : "";
        const pkg = body.package;
        const assetId = typeof body.assetId === "string" ? body.assetId.trim() : "";
        const episodeId = typeof body.episodeId === "string" ? body.episodeId.trim() : "";

        if (!pkg || !pkg.script) {
            return NextResponse.json(
                { error: "package is required" },
                { status: 400 }
            );
        }

        const payload = {
            ...pkg,
            theme,
            tone,
            title,
            savedAt: new Date().toISOString(),
        };

        const content = JSON.stringify(payload, null, 2);

        const tag = await prisma.tag.upsert({
            where: { name: "AI Shorts" },
            update: {},
            create: { name: "AI Shorts", color: "#f97316" },
        });

        const timestamp = Date.now();
        const baseSlug = slugify(title) || "ai-short";
        const fileBase = `${baseSlug}-${timestamp}.json`;

        const metadata = JSON.stringify({
            kind: "ai-shorts",
            title,
            theme,
            tone,
        });

        const displayNameRaw = safeFileName(
            title ? `${title}.json` : `ai-short-${timestamp}.json`
        );
        const displayName = displayNameRaw || `ai-short-${timestamp}.json`;

        let asset;
        if (assetId) {
            const existing = await prisma.asset.findUnique({ where: { id: assetId } });
            if (!existing) {
                return NextResponse.json({ error: "Asset not found" }, { status: 404 });
            }

            const relativePath = existing.filePath
                ? existing.filePath
                : path.posix.join("data", "assets", "ai-shorts", fileBase);
            const absolutePath = path.join(process.cwd(), relativePath);

            await fs.mkdir(path.dirname(absolutePath), { recursive: true });
            await fs.writeFile(absolutePath, content, "utf-8");

            asset = await prisma.asset.update({
                where: { id: assetId },
                data: {
                    fileName: displayName || existing.fileName,
                    filePath: relativePath,
                    type: "script",
                    source: "ai-shorts",
                    fileSize: Buffer.byteLength(content),
                    mimeType: "application/json",
                    metadata,
                    generationParams: JSON.stringify(payload),
                    status: "active",
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
        } else {
            const relativePath = path.posix.join("data", "assets", "ai-shorts", fileBase);
            const absolutePath = path.join(process.cwd(), relativePath);

            await fs.mkdir(path.dirname(absolutePath), { recursive: true });
            await fs.writeFile(absolutePath, content, "utf-8");

            asset = await prisma.asset.create({
                data: {
                    fileName: displayName,
                    filePath: relativePath,
                    type: "script",
                    source: "ai-shorts",
                    fileSize: Buffer.byteLength(content),
                    mimeType: "application/json",
                    metadata,
                    generationParams: JSON.stringify(payload),
                    status: "active",
                    version: 1,
                },
            });

            await prisma.auditLog.create({
                data: {
                    action: "create",
                    entityType: "asset",
                    entityId: asset.id,
                    newValues: JSON.stringify(asset),
                },
            });
        }

        await prisma.assetTag.upsert({
            where: {
                assetId_tagId: {
                    assetId: asset.id,
                    tagId: tag.id,
                },
            },
            update: {},
            create: {
                assetId: asset.id,
                tagId: tag.id,
            },
        });

        if (episodeId) {
            await prisma.episodeAsset.upsert({
                where: {
                    episodeId_assetId: {
                        episodeId,
                        assetId: asset.id,
                    },
                },
                update: {},
                create: {
                    episodeId,
                    assetId: asset.id,
                    role: "script",
                },
            });
        }

        return NextResponse.json({
            assetId: asset.id,
            fileName: asset.fileName,
        }, { status: 201 });
    } catch (error) {
        console.error("Failed to save ai shorts package:", error);
        const message = error instanceof Error ? error.message : "Failed to save ai shorts package";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
