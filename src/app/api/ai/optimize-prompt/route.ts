import { NextResponse } from 'next/server';
import { optimizePrompt } from '@/lib/ai-services';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { rawPrompt, platform, seriesId } = body;

        if (!rawPrompt) {
            return NextResponse.json(
                { error: 'rawPrompt is required' },
                { status: 400 }
            );
        }

        if (!platform) {
            return NextResponse.json(
                { error: 'platform is required' },
                { status: 400 }
            );
        }

        const validPlatforms = ['runway', 'suno', 'stability', 'luma', 'kling'];
        if (!validPlatforms.includes(platform)) {
            return NextResponse.json(
                { error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` },
                { status: 400 }
            );
        }

        const result = await optimizePrompt({
            rawPrompt,
            platform,
            seriesId: seriesId || undefined,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to optimize prompt:', error);
        return NextResponse.json(
            { error: 'Failed to optimize prompt' },
            { status: 500 }
        );
    }
}
