import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createJobRun, executeJobRun } from '@/lib/job-runner';

export async function GET() {
    try {
        const jobRuns = await prisma.jobRun.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                item: {
                    select: { title: true },
                },
                template: {
                    select: { name: true },
                },
                artifacts: {
                    select: { id: true, name: true, uri: true, type: true },
                },
            },
        });

        const renders = jobRuns.map((run) => ({
            id: run.id,
            projectId: run.itemId,
            projectName: run.item.title,
            templateName: run.template?.name,
            status: run.status,
            startedAt: run.startedAt?.toISOString(),
            finishedAt: run.finishedAt?.toISOString(),
            artifacts: run.artifacts,
            createdAt: run.createdAt.toISOString(),
        }));

        return NextResponse.json(renders);
    } catch (error) {
        console.error('Failed to fetch renders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch renders' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { projectId, templateId, videoConfig } = body;

        if (!projectId) {
            return NextResponse.json(
                { error: 'projectId is required' },
                { status: 400 }
            );
        }

        // Create job run
        const jobRunId = await createJobRun({
            itemId: projectId,
            templateId,
            videoConfig,
        });

        // Execute asynchronously (fire and forget for now)
        executeJobRun(jobRunId).catch((error) => {
            console.error('Job execution failed:', error);
        });

        return NextResponse.json({
            id: jobRunId,
            status: 'queued',
            message: 'Render job created and started',
        });
    } catch (error) {
        console.error('Failed to create render:', error);
        return NextResponse.json(
            { error: 'Failed to create render' },
            { status: 500 }
        );
    }
}
