import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/production/ideas - List all ideas
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const lane = searchParams.get('lane');
        const seriesId = searchParams.get('seriesId');

        const where: Record<string, unknown> = {};
        if (status) where.status = status;
        if (lane) where.lane = lane;
        if (seriesId) where.seriesId = seriesId;

        const ideas = await prisma.idea.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            include: {
                owner: {
                    select: { id: true, name: true, email: true },
                },
                _count: {
                    select: { productionEpisodes: true },
                },
            },
        });

        // Parse JSON fields
        const parsed = ideas.map((idea) => ({
            ...idea,
            tags: JSON.parse(idea.tags),
        }));

        return NextResponse.json({ ideas: parsed });
    } catch (error) {
        console.error('Error fetching ideas:', error);
        return NextResponse.json(
            { error: 'Failed to fetch ideas' },
            { status: 500 }
        );
    }
}

// POST /api/production/ideas - Create a new idea
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, description, lane, targetAudience, tags, status, seriesId } = body;

        if (!title) {
            return NextResponse.json(
                { error: 'title is required' },
                { status: 400 }
            );
        }

        const idea = await prisma.idea.create({
            data: {
                title,
                description: description || null,
                lane: lane || null,
                seriesId: seriesId || null,
                targetAudience: targetAudience || null,
                tags: JSON.stringify(tags || []),
                status: status || 'backlog',
            },
        });

        return NextResponse.json({
            ...idea,
            tags: JSON.parse(idea.tags),
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating idea:', error);
        return NextResponse.json(
            { error: 'Failed to create idea' },
            { status: 500 }
        );
    }
}
