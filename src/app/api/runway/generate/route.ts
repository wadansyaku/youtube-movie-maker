import { NextRequest, NextResponse } from 'next/server';
import * as runway from '@/lib/runway';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { promptText, promptImage, model, duration, ratio } = body;

        if (!promptText) {
            return NextResponse.json(
                { error: 'promptText is required' },
                { status: 400 }
            );
        }

        // Check if Runway is configured
        const isConfigured = await runway.isConfigured();
        if (!isConfigured) {
            return NextResponse.json(
                { error: 'Runway API key not configured. Please set it in Settings.' },
                { status: 500 }
            );
        }

        // Estimate cost before generation
        const cost = runway.estimateCost(duration || 10, model);

        // Start generation
        const result = await runway.generateVideo({
            promptText,
            promptImage,
            model: model || 'gen3a_turbo',
            duration: duration || 10,
            ratio: ratio || '16:9',
        });

        return NextResponse.json({
            taskId: result.id,
            status: result.status,
            estimatedCost: cost,
        });
    } catch (error) {
        console.error('Runway generation failed:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Generation failed' },
            { status: 500 }
        );
    }
}
