import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/production/episodes/[id]/sources
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const sources = await prisma.productionSource.findMany({
            where: { episodeId: id },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            sources: sources.map((s) => ({
                ...s,
                tags: JSON.parse(s.tags),
            })),
        });
    } catch (error) {
        console.error('Error fetching sources:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sources' },
            { status: 500 }
        );
    }
}

// POST /api/production/episodes/[id]/sources
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { type, title, url, notes, accessedAt, tags } = body;

        if (!type) {
            return NextResponse.json(
                { error: 'type is required' },
                { status: 400 }
            );
        }

        const source = await prisma.productionSource.create({
            data: {
                episodeId: id,
                type,
                title: title || null,
                url: url || null,
                notes: notes || null,
                accessedAt: accessedAt ? new Date(accessedAt) : null,
                tags: JSON.stringify(tags || []),
            },
        });

        return NextResponse.json({
            ...source,
            tags: JSON.parse(source.tags),
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating source:', error);
        return NextResponse.json(
            { error: 'Failed to create source' },
            { status: 500 }
        );
    }
}
