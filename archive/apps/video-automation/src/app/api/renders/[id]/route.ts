import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const jobRun = await prisma.jobRun.findUnique({
            where: { id: params.id },
            include: {
                item: {
                    select: { title: true },
                },
                template: {
                    select: { name: true },
                },
                artifacts: true,
            },
        });

        if (!jobRun) {
            return NextResponse.json({ error: 'Render not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: jobRun.id,
            projectId: jobRun.itemId,
            projectName: jobRun.item.title,
            templateName: jobRun.template?.name,
            status: jobRun.status,
            log: jobRun.log,
            startedAt: jobRun.startedAt?.toISOString(),
            finishedAt: jobRun.finishedAt?.toISOString(),
            artifacts: jobRun.artifacts.map((a) => ({
                id: a.id,
                name: a.name,
                type: a.type,
                uri: a.uri,
            })),
            createdAt: jobRun.createdAt.toISOString(),
        });
    } catch (error) {
        console.error('Failed to fetch render:', error);
        return NextResponse.json(
            { error: 'Failed to fetch render' },
            { status: 500 }
        );
    }
}
