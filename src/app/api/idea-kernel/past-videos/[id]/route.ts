import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildPastVideoCanonicalText } from "@/lib/idea-kernel";

const parseTags = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.map((tag) => String(tag).trim()).filter(Boolean);
    }
    if (typeof value === "string") {
        return value
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);
    }
    return [];
};

const parseTagsJson = (value: string | null): string[] => {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
            return parsed.map((tag) => String(tag).trim()).filter(Boolean);
        }
    } catch {
        // Fallback to comma-separated tags
    }
    return value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
};

const parsePublishedAt = (value: unknown): Date | null => {
    if (!value) return null;
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
};

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const existing = await prisma.pastVideo.findUnique({
            where: { id: params.id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const title = body.title ? String(body.title) : existing.title;
        const summary = body.summary ? String(body.summary) : existing.summary;
        const youtubeUrl = body.youtubeUrl
            ? String(body.youtubeUrl)
            : existing.youtubeUrl;
        const publishedAt = body.publishedAt
            ? parsePublishedAt(body.publishedAt)
            : existing.publishedAt;
        const tags = body.tags
            ? parseTags(body.tags)
            : parseTagsJson(existing.tags);

        const canonicalText = buildPastVideoCanonicalText({
            title,
            summary: summary ?? undefined,
            tags,
        });

        const updated = await prisma.pastVideo.update({
            where: { id: params.id },
            data: {
                title,
                summary,
                youtubeUrl,
                publishedAt,
                tags: JSON.stringify(tags),
                canonicalText,
            },
        });

        return NextResponse.json({
            video: {
                ...updated,
                tags: parseTagsJson(updated.tags),
            },
        });
    } catch (error) {
        console.error("Failed to update past video:", error);
        return NextResponse.json(
            { error: "Failed to update past video" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.pastVideo.delete({ where: { id: params.id } });
        return NextResponse.json({ deleted: true });
    } catch (error) {
        console.error("Failed to delete past video:", error);
        return NextResponse.json(
            { error: "Failed to delete past video" },
            { status: 500 }
        );
    }
}
