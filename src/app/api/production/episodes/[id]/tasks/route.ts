import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/production/episodes/[id]/tasks
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const tasks = await prisma.productionTask.findMany({
            where: { episodeId: id },
            orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'asc' }],
            include: {
                owner: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        return NextResponse.json({
            tasks: tasks.map((t) => ({
                ...t,
                tags: JSON.parse(t.tags),
            })),
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tasks' },
            { status: 500 }
        );
    }
}

// POST /api/production/episodes/[id]/tasks
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, description, status, priority, dueDate, tags } = body;

        if (!title) {
            return NextResponse.json(
                { error: 'title is required' },
                { status: 400 }
            );
        }

        const task = await prisma.productionTask.create({
            data: {
                episodeId: id,
                title,
                description: description || null,
                status: status || 'todo',
                priority: priority || 0,
                dueDate: dueDate ? new Date(dueDate) : null,
                tags: JSON.stringify(tags || []),
            },
        });

        return NextResponse.json({
            ...task,
            tags: JSON.parse(task.tags),
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating task:', error);
        return NextResponse.json(
            { error: 'Failed to create task' },
            { status: 500 }
        );
    }
}
