import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/production/episodes - List all production episodes
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const lane = searchParams.get('lane');
        const seriesId = searchParams.get('seriesId');
        const variant = searchParams.get('variant');
        const ideaId = searchParams.get('ideaId');

        const where: Record<string, unknown> = {};
        if (status) where.status = status;
        if (lane) where.lane = lane;
        if (seriesId) where.seriesId = seriesId;
        if (variant) where.variant = variant;
        if (ideaId) where.ideaId = ideaId;

        const episodes = await prisma.productionEpisode.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            include: {
                idea: {
                    select: { id: true, title: true },
                },
                owner: {
                    select: { id: true, name: true, email: true },
                },
                parentEpisode: {
                    select: { id: true, title: true, variant: true },
                },
                _count: {
                    select: {
                        tasks: true,
                        sources: true,
                        generationPrompts: true,
                        childVariants: true,
                    },
                },
            },
        });

        // Parse JSON fields
        const parsed = episodes.map((ep) => ({
            ...ep,
            tags: JSON.parse(ep.tags),
            youtubeTags: JSON.parse(ep.youtubeTags),
            ttsDictionary: JSON.parse(ep.ttsDictionary),
            scriptContent: JSON.parse(ep.scriptContent),
            originalityChecks: JSON.parse(ep.originalityChecks),
        }));

        return NextResponse.json({ episodes: parsed });
    } catch (error) {
        console.error('Error fetching episodes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch episodes' },
            { status: 500 }
        );
    }
}

// POST /api/production/episodes - Create a new episode
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            ideaId,
            parentEpisodeId,
            seriesId,
            episodeNumber,
            variant,
            lane,
            title,
            synopsis,
            targetAudience,
            targetDuration,
            purposeStatement,
            status,
        } = body;

        if (!title) {
            return NextResponse.json(
                { error: 'title is required' },
                { status: 400 }
            );
        }

        const episode = await prisma.productionEpisode.create({
            data: {
                ideaId: ideaId || null,
                parentEpisodeId: parentEpisodeId || null,
                seriesId: seriesId || null,
                episodeNumber: episodeNumber || null,
                variant: variant || 'long',
                lane: lane || null,
                title,
                synopsis: synopsis || null,
                targetAudience: targetAudience || null,
                targetDuration: targetDuration || null,
                purposeStatement: purposeStatement || null,
                status: status || 'scripting',
            },
            include: {
                idea: {
                    select: { id: true, title: true },
                },
            },
        });

        return NextResponse.json({
            ...episode,
            tags: JSON.parse(episode.tags),
            youtubeTags: JSON.parse(episode.youtubeTags),
            ttsDictionary: JSON.parse(episode.ttsDictionary),
            scriptContent: JSON.parse(episode.scriptContent),
            originalityChecks: JSON.parse(episode.originalityChecks),
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating episode:', error);
        return NextResponse.json(
            { error: 'Failed to create episode' },
            { status: 500 }
        );
    }
}
