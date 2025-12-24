import { NextRequest, NextResponse } from 'next/server';
import * as stability from '@/lib/stability';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { prompt, negativePrompt, aspectRatio, model } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: 'prompt is required' },
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

        // Estimate cost
        const cost = stability.estimateCost(model);

        // Generate image
        const result = await stability.generateImage({
            prompt,
            negativePrompt,
            aspectRatio: aspectRatio || '16:9',
            model: model || 'sd3-large',
        });

        return NextResponse.json({
            image: result.image,
            finishReason: result.finishReason,
            seed: result.seed,
            estimatedCost: cost,
        });
    } catch (error) {
        console.error('Stability generation failed:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Generation failed' },
            { status: 500 }
        );
    }
}
