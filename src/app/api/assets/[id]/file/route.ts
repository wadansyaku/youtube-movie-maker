import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs";
import path from "path";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { getContentType } from "@/lib/storage";

interface RouteParams {
    params: Promise<{ id: string }>;
}

const PROJECT_ROOT = process.cwd();

const resolveAssetPath = (filePath?: string | null): string | null => {
    if (!filePath || typeof filePath !== "string") return null;
    const trimmed = filePath.trim();
    if (!trimmed) return null;
    if (/^(https?:|s3:)/i.test(trimmed)) return null;

    const candidates: string[] = [];
    if (path.isAbsolute(trimmed)) {
        candidates.push(path.resolve(trimmed));
        candidates.push(path.resolve(PROJECT_ROOT, trimmed.replace(/^\/+/, "")));
    } else {
        candidates.push(path.resolve(PROJECT_ROOT, trimmed.replace(/^\/+/, "")));
    }

    for (const candidate of candidates) {
        const relative = path.relative(PROJECT_ROOT, candidate);
        if (relative.startsWith("..") || path.isAbsolute(relative)) continue;
        if (!fs.existsSync(candidate)) continue;
        return candidate;
    }

    return null;
};

const buildContentDisposition = (fileName: string, download: boolean) => {
    const safeName = fileName.replace(/[\r\n"]/g, "_");
    return `${download ? "attachment" : "inline"}; filename="${safeName}"`;
};

// GET /api/assets/[id]/file - Stream asset file (supports Range)
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const asset = await prisma.asset.findUnique({ where: { id } });

        if (!asset) {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }

        const resolvedPath = resolveAssetPath(asset.filePath);
        if (!resolvedPath) {
            return NextResponse.json({ error: "Asset file not available" }, { status: 404 });
        }

        const fileStats = await stat(resolvedPath);
        const fileSize = fileStats.size;
        const fileName = asset.fileName || path.basename(resolvedPath);
        const contentType = asset.mimeType || getContentType(fileName);

        const url = new URL(request.url);
        const download = ["1", "true", "yes"].includes(
            (url.searchParams.get("download") || "").toLowerCase()
        );

        const headers = new Headers();
        headers.set("Content-Type", contentType);
        headers.set("Accept-Ranges", "bytes");
        headers.set("Content-Disposition", buildContentDisposition(fileName, download));

        const range = request.headers.get("range");
        if (range) {
            const match = /^bytes=(\d+)-(\d*)$/.exec(range);
            if (!match) {
                return new NextResponse("Invalid range", {
                    status: 416,
                    headers: {
                        "Content-Range": `bytes */${fileSize}`,
                    },
                });
            }

            const start = Number.parseInt(match[1], 10);
            const end = match[2] ? Number.parseInt(match[2], 10) : fileSize - 1;

            if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= fileSize) {
                return new NextResponse("Range not satisfiable", {
                    status: 416,
                    headers: {
                        "Content-Range": `bytes */${fileSize}`,
                    },
                });
            }

            const clampedEnd = Math.min(end, fileSize - 1);
            const chunkSize = clampedEnd - start + 1;
            headers.set("Content-Range", `bytes ${start}-${clampedEnd}/${fileSize}`);
            headers.set("Content-Length", chunkSize.toString());

            const stream = fs.createReadStream(resolvedPath, { start, end: clampedEnd });
            return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
                status: 206,
                headers,
            });
        }

        headers.set("Content-Length", fileSize.toString());
        const stream = fs.createReadStream(resolvedPath);
        return new NextResponse(Readable.toWeb(stream) as ReadableStream, { headers });
    } catch (error) {
        console.error("Failed to stream asset file:", error);
        return NextResponse.json(
            { error: "Failed to stream asset file" },
            { status: 500 }
        );
    }
}
