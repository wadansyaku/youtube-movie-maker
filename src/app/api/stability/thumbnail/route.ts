import { NextRequest, NextResponse } from 'next/server';
import * as stability from '@/lib/stability';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { title, description, style } = body;

        if (!title) {
            return NextResponse.json(
                { error: 'title is required' },
                { status: 400 }
            );
        }

        // Check if Stability is configured
        const isConfigured = await stability.isConfigured();
        if (!isConfigured) {
            return NextResponse.json(
                { error: 'Stability AI API key not configured. Please set it in Settings.' },
                { status: 500 }
            );
        }

        // Generate thumbnail
        const result = await stability.generateThumbnail(
            title,
            description || '',
            style
        );

        const cost = stability.estimateCost('sd3-large');

        return NextResponse.json({
            image: result.image,
            finishReason: result.finishReason,
            seed: result.seed,
            estimatedCost: cost,
        });
    } catch (error) {
        console.error('Thumbnail generation failed:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Generation failed' },
            { status: 500 }
        );
    }
}
