import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/production/ideas/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const idea = await prisma.idea.findUnique({
            where: { id },
            include: {
                owner: {
                    select: { id: true, name: true, email: true },
                },
                productionEpisodes: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!idea) {
            return NextResponse.json(
                { error: 'Idea not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            ...idea,
            tags: JSON.parse(idea.tags),
            productionEpisodes: idea.productionEpisodes.map((ep) => ({
                ...ep,
                tags: JSON.parse(ep.tags),
            })),
        });
    } catch (error) {
        console.error('Error fetching idea:', error);
        return NextResponse.json(
            { error: 'Failed to fetch idea' },
            { status: 500 }
        );
    }
}

// PATCH /api/production/ideas/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, description, lane, targetAudience, tags, status, seriesId } = body;

        const updateData: Record<string, unknown> = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (lane !== undefined) updateData.lane = lane;
        if (seriesId !== undefined) updateData.seriesId = seriesId;
        if (targetAudience !== undefined) updateData.targetAudience = targetAudience;
        if (tags !== undefined) updateData.tags = JSON.stringify(tags);
        if (status !== undefined) updateData.status = status;

        const idea = await prisma.idea.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            ...idea,
            tags: JSON.parse(idea.tags),
        });
    } catch (error) {
        console.error('Error updating idea:', error);
        return NextResponse.json(
            { error: 'Failed to update idea' },
            { status: 500 }
        );
    }
}

// DELETE /api/production/ideas/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        await prisma.idea.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting idea:', error);
        return NextResponse.json(
            { error: 'Failed to delete idea' },
            { status: 500 }
        );
    }
}
