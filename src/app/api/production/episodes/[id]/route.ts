import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/production/episodes/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const episode = await prisma.productionEpisode.findUnique({
            where: { id },
            include: {
                idea: true,
                owner: {
                    select: { id: true, name: true, email: true },
                },
                parentEpisode: {
                    select: { id: true, title: true, variant: true },
                },
                childVariants: {
                    select: { id: true, title: true, variant: true, status: true },
                },
                tasks: {
                    orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'asc' }],
                },
                sources: {
                    orderBy: { createdAt: 'desc' },
                },
                generationPrompts: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        asset: {
                            select: { id: true, fileName: true, filePath: true, type: true },
                        },
                    },
                },
                metrics: {
                    orderBy: { recordedAt: 'desc' },
                },
            },
        });

        if (!episode) {
            return NextResponse.json(
                { error: 'Episode not found' },
                { status: 404 }
            );
        }

        // Parse JSON fields
        return NextResponse.json({
            ...episode,
            tags: JSON.parse(episode.tags),
            youtubeTags: JSON.parse(episode.youtubeTags),
            ttsDictionary: JSON.parse(episode.ttsDictionary),
            scriptContent: JSON.parse(episode.scriptContent),
            originalityChecks: JSON.parse(episode.originalityChecks),
            idea: episode.idea ? {
                ...episode.idea,
                tags: JSON.parse(episode.idea.tags),
            } : null,
            tasks: episode.tasks.map((t) => ({
                ...t,
                tags: JSON.parse(t.tags),
            })),
            sources: episode.sources.map((s) => ({
                ...s,
                tags: JSON.parse(s.tags),
            })),
        });
    } catch (error) {
        console.error('Error fetching episode:', error);
        return NextResponse.json(
            { error: 'Failed to fetch episode' },
            { status: 500 }
        );
    }
}

// PATCH /api/production/episodes/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        const updateData: Record<string, unknown> = {};

        // Simple fields
        const simpleFields = [
            'title', 'synopsis', 'seriesId', 'episodeNumber', 'targetAudience', 'targetDuration', 'purposeStatement',
            'hookScript', 'ctaScript', 'pinnedComment', 'ttsText', 'slideOutline',
            'youtubeTitle', 'youtubeDescription', 'thumbnailBrief', 'status',
            'variant', 'lane', 'ideaId', 'parentEpisodeId', 'scheduledAt', 'publishedAt',
        ];

        for (const field of simpleFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        // JSON fields
        if (body.tags !== undefined) updateData.tags = JSON.stringify(body.tags);
        if (body.youtubeTags !== undefined) updateData.youtubeTags = JSON.stringify(body.youtubeTags);
        if (body.ttsDictionary !== undefined) updateData.ttsDictionary = JSON.stringify(body.ttsDictionary);
        if (body.scriptContent !== undefined) updateData.scriptContent = JSON.stringify(body.scriptContent);
        if (body.originalityChecks !== undefined) updateData.originalityChecks = JSON.stringify(body.originalityChecks);

        const episode = await prisma.productionEpisode.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            ...episode,
            tags: JSON.parse(episode.tags),
            youtubeTags: JSON.parse(episode.youtubeTags),
            ttsDictionary: JSON.parse(episode.ttsDictionary),
            scriptContent: JSON.parse(episode.scriptContent),
            originalityChecks: JSON.parse(episode.originalityChecks),
        });
    } catch (error) {
        console.error('Error updating episode:', error);
        return NextResponse.json(
            { error: 'Failed to update episode' },
            { status: 500 }
        );
    }
}

// DELETE /api/production/episodes/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        await prisma.productionEpisode.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting episode:', error);
        return NextResponse.json(
            { error: 'Failed to delete episode' },
            { status: 500 }
        );
    }
}
