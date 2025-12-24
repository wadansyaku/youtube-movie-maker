import { NextResponse } from 'next/server';
import { describeShots } from '@/lib/ai-services';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sceneDescription, seriesId } = body;

        if (!sceneDescription) {
            return NextResponse.json(
                { error: 'sceneDescription is required' },
                { status: 400 }
            );
        }

        const shots = await describeShots({
            sceneDescription,
            seriesId: seriesId || undefined,
        });

        return NextResponse.json({ shots });
    } catch (error) {
        console.error('Failed to describe shots:', error);
        return NextResponse.json(
            { error: 'Failed to describe shots' },
            { status: 500 }
        );
    }
}
