import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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

export async function GET() {
    try {
        const videos = await prisma.pastVideo.findMany({
            orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        });
        const parsed = videos.map((video) => ({
            ...video,
            tags: parseTagsJson(video.tags),
        }));
        return NextResponse.json({ videos: parsed });
    } catch (error) {
        console.error("Failed to fetch past videos:", error);
        return NextResponse.json(
            { error: "Failed to fetch past videos" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const items = Array.isArray(body) ? body : body.items;

        if (!Array.isArray(items)) {
            return NextResponse.json(
                { error: "items must be an array" },
                { status: 400 }
            );
        }

        const data: Prisma.PastVideoCreateManyInput[] = [];

        items.forEach((item) => {
            if (!item?.title) return;
            const title = String(item.title);
            const tags = parseTags(item.tags);
            const publishedAt = parsePublishedAt(item.publishedAt);
            const summary = item.summary ? String(item.summary) : null;

            data.push({
                title,
                youtubeUrl: item.youtubeUrl ? String(item.youtubeUrl) : null,
                publishedAt,
                summary,
                tags: JSON.stringify(tags),
                canonicalText: buildPastVideoCanonicalText({
                    title,
                    summary: summary ?? undefined,
                    tags,
                }),
            });
        });

        if (data.length === 0) {
            return NextResponse.json(
                { error: "No valid items to import" },
                { status: 400 }
            );
        }

        const result = await prisma.pastVideo.createMany({ data });
        return NextResponse.json({ imported: result.count }, { status: 201 });
    } catch (error) {
        console.error("Failed to import past videos:", error);
        return NextResponse.json(
            { error: "Failed to import past videos" },
            { status: 500 }
        );
    }
}
