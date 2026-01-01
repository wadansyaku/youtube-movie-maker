import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const items = await prisma.item.findMany({
            orderBy: { updatedAt: 'desc' },
            include: {
                template: {
                    select: { name: true },
                },
                jobRuns: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { createdAt: true, status: true },
                },
            },
        });

        const projects = items.map((item) => ({
            id: item.id,
            title: item.title,
            status: item.status,
            templateName: item.template?.name,
            lastRenderAt: item.jobRuns[0]?.createdAt?.toISOString(),
            lastRenderStatus: item.jobRuns[0]?.status,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
        }));

        return NextResponse.json(projects);
    } catch (error) {
        console.error('Failed to fetch projects:', error);
        return NextResponse.json(
            { error: 'Failed to fetch projects' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, templateId, inputText } = body;

        if (!title) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        const item = await prisma.item.create({
            data: {
                title,
                status: 'draft',
                templateId: templateId || null,
                inputText: inputText || null,
                tags: '[]',
            },
        });

        return NextResponse.json({
            id: item.id,
            title: item.title,
            status: item.status,
            createdAt: item.createdAt.toISOString(),
        });
    } catch (error) {
        console.error('Failed to create project:', error);
        return NextResponse.json(
            { error: 'Failed to create project' },
            { status: 500 }
        );
    }
}
