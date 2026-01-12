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

const parseMetadata = (value?: string | null) => {
    if (!value) return {};
    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
};

const buildContentDisposition = (fileName: string, download: boolean) => {
    const safeName = fileName.replace(/[\r\n"]/g, "_");
    return `${download ? "attachment" : "inline"}; filename="${safeName}"`;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const asset = await prisma.asset.findUnique({ where: { id } });

        if (!asset) {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }

        const metadata = parseMetadata(asset.metadata);
        const thumbnailPath = metadata?.thumbnailPath as string | undefined;
        if (!thumbnailPath) {
            return NextResponse.json({ error: "Thumbnail not found" }, { status: 404 });
        }

        const resolvedPath = resolveAssetPath(thumbnailPath);
        if (!resolvedPath) {
            return NextResponse.json({ error: "Thumbnail file not available" }, { status: 404 });
        }

        const fileStats = await stat(resolvedPath);
        const fileSize = fileStats.size;
        const fileName = path.basename(resolvedPath);
        const contentType = getContentType(fileName);

        const url = new URL(request.url);
        const download = ["1", "true", "yes"].includes(
            (url.searchParams.get("download") || "").toLowerCase()
        );

        const headers = new Headers();
        headers.set("Content-Type", contentType);
        headers.set("Content-Length", fileSize.toString());
        headers.set("Content-Disposition", buildContentDisposition(fileName, download));

        const stream = fs.createReadStream(resolvedPath);
        return new NextResponse(Readable.toWeb(stream) as ReadableStream, { headers });
    } catch (error) {
        console.error("Failed to stream thumbnail:", error);
        return NextResponse.json(
            { error: "Failed to stream thumbnail" },
            { status: 500 }
        );
    }
}
