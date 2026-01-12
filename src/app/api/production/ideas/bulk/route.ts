import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            titles,
            description,
            lane,
            targetAudience,
            tags,
            status,
            seriesId,
        } = body;

        if (!Array.isArray(titles) || titles.length === 0) {
            return NextResponse.json(
                { error: 'titles is required' },
                { status: 400 }
            );
        }

        const cleanedTitles = Array.from(
            new Set(
                titles
                    .map((title: unknown) => (typeof title === 'string' ? title.trim() : ''))
                    .filter(Boolean)
            )
        );

        if (cleanedTitles.length === 0) {
            return NextResponse.json(
                { error: 'titles is required' },
                { status: 400 }
            );
        }

        const ideas = await prisma.$transaction(
            cleanedTitles.map((title) =>
                prisma.idea.create({
                    data: {
                        title,
                        description: description || null,
                        lane: lane || null,
                        seriesId: seriesId || null,
                        targetAudience: targetAudience || null,
                        tags: JSON.stringify(tags || []),
                        status: status || 'backlog',
                    },
                })
            )
        );

        return NextResponse.json({
            count: ideas.length,
            ideas: ideas.map((idea) => ({
                ...idea,
                tags: JSON.parse(idea.tags),
            })),
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating ideas:', error);
        return NextResponse.json(
            { error: 'Failed to create ideas' },
            { status: 500 }
        );
    }
}
