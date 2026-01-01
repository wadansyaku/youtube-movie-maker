import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const item = await prisma.item.findUnique({
            where: { id: params.id },
            include: {
                template: {
                    select: { id: true, name: true, steps: true },
                },
                jobRuns: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    include: {
                        artifacts: true,
                    },
                },
            },
        });

        if (!item) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Parse inputText as JSON config if available
        let videoConfig = null;
        if (item.inputText) {
            try {
                videoConfig = JSON.parse(item.inputText);
            } catch {
                videoConfig = null;
            }
        }

        return NextResponse.json({
            id: item.id,
            title: item.title,
            status: item.status,
            template: item.template,
            videoConfig,
            jobRuns: item.jobRuns.map((run) => ({
                id: run.id,
                status: run.status,
                startedAt: run.startedAt?.toISOString(),
                finishedAt: run.finishedAt?.toISOString(),
                artifacts: run.artifacts,
                createdAt: run.createdAt.toISOString(),
            })),
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
        });
    } catch (error) {
        console.error('Failed to fetch project:', error);
        return NextResponse.json(
            { error: 'Failed to fetch project' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { title, status, videoConfig } = body;

        const updateData: Record<string, unknown> = {};
        if (title !== undefined) updateData.title = title;
        if (status !== undefined) updateData.status = status;
        if (videoConfig !== undefined) updateData.inputText = JSON.stringify(videoConfig);

        const item = await prisma.item.update({
            where: { id: params.id },
            data: updateData,
        });

        return NextResponse.json({
            id: item.id,
            title: item.title,
            status: item.status,
            updatedAt: item.updatedAt.toISOString(),
        });
    } catch (error) {
        console.error('Failed to update project:', error);
        return NextResponse.json(
            { error: 'Failed to update project' },
            { status: 500 }
        );
    }
}
