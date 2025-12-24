import { NextRequest, NextResponse } from 'next/server';
import * as elevenlabs from '@/lib/elevenlabs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text, voiceId, modelId, stability, similarityBoost } = body;

        if (!text) {
            return NextResponse.json(
                { error: 'text is required' },
                { status: 400 }
            );
        }

        if (!voiceId) {
            return NextResponse.json(
                { error: 'voiceId is required' },
                { status: 400 }
            );
        }

        // Check if ElevenLabs is configured
        const isConfigured = await elevenlabs.isConfigured();
        if (!isConfigured) {
            return NextResponse.json(
                { error: 'ElevenLabs API key not configured. Please set it in Settings.' },
                { status: 500 }
            );
        }

        // Estimate cost
        const cost = elevenlabs.estimateCost(text.length);

        // Generate speech
        const result = await elevenlabs.textToSpeechBase64({
            text,
            voiceId,
            modelId,
            stability,
            similarityBoost,
        });

        return NextResponse.json({
            audio: result.audio,
            contentType: result.contentType,
            characterCount: text.length,
            estimatedCost: cost,
        });
    } catch (error) {
        console.error('ElevenLabs generation failed:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Generation failed' },
            { status: 500 }
        );
    }
}
