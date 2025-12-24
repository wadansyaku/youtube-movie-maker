import { NextResponse } from 'next/server';
import { generateSEO } from '@/lib/ai-services';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { episodeTitle, synopsis, targetAudience } = body;

        if (!episodeTitle) {
            return NextResponse.json(
                { error: 'episodeTitle is required' },
                { status: 400 }
            );
        }

        if (!synopsis) {
            return NextResponse.json(
                { error: 'synopsis is required' },
                { status: 400 }
            );
        }

        const result = await generateSEO({
            episodeTitle,
            synopsis,
            targetAudience: targetAudience || undefined,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to generate SEO:', error);
        return NextResponse.json(
            { error: 'Failed to generate SEO' },
            { status: 500 }
        );
    }
}
