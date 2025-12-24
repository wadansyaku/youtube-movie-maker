import { NextRequest, NextResponse } from 'next/server';
import * as runway from '@/lib/runway';

export async function GET(
    req: NextRequest,
    { params }: { params: { taskId: string } }
) {
    try {
        const { taskId } = params;

        if (!taskId) {
            return NextResponse.json(
                { error: 'taskId is required' },
                { status: 400 }
            );
        }

        const status = await runway.getTaskStatus(taskId);

        return NextResponse.json({
            taskId: status.id,
            status: status.status,
            progress: status.progress,
            output: status.output,
            failure: status.failure,
            estimatedTimeRemaining: status.estimatedTimeRemaining,
        });
    } catch (error) {
        console.error('Failed to get task status:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to get status' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { taskId: string } }
) {
    try {
        const { taskId } = params;

        if (!taskId) {
            return NextResponse.json(
                { error: 'taskId is required' },
                { status: 400 }
            );
        }

        await runway.cancelTask(taskId);

        return NextResponse.json({ cancelled: true });
    } catch (error) {
        console.error('Failed to cancel task:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to cancel' },
            { status: 500 }
        );
    }
}
