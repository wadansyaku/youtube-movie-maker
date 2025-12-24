import { NextResponse } from 'next/server';
import { generateScript } from '@/lib/ai-services';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { seriesId, concept, targetDuration } = body;

        if (!seriesId) {
            return NextResponse.json(
                { error: 'seriesId is required' },
                { status: 400 }
            );
        }

        if (!concept) {
            return NextResponse.json(
                { error: 'concept is required' },
                { status: 400 }
            );
        }

        const result = await generateScript({
            seriesId,
            concept,
            targetDuration: targetDuration || undefined,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to generate script:', error);
        return NextResponse.json(
            { error: 'Failed to generate script' },
            { status: 500 }
        );
    }
}
