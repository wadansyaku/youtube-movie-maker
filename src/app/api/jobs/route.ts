import { NextRequest, NextResponse } from 'next/server';
import { jobQueue } from '@/lib/jobQueue';

// GET /api/jobs - Get all jobs
export async function GET() {
    try {
        const jobs = jobQueue.getAll();
        return NextResponse.json({ jobs });
    } catch (error) {
        console.error('Failed to get jobs:', error);
        return NextResponse.json(
            { error: 'Failed to get jobs' },
            { status: 500 }
        );
    }
}

// POST /api/jobs - Create a new job (for testing)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, title, description, metadata } = body;

        const job = jobQueue.create({
            type: type || 'export',
            title: title || 'Test Job',
            description,
            metadata,
        });

        return NextResponse.json({ job });
    } catch (error) {
        console.error('Failed to create job:', error);
        return NextResponse.json(
            { error: 'Failed to create job' },
            { status: 500 }
        );
    }
}
