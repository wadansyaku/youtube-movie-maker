import { NextResponse } from 'next/server';
import * as elevenlabs from '@/lib/elevenlabs';

export async function GET() {
    try {
        // Check if configured
        const isConfigured = await elevenlabs.isConfigured();
        if (!isConfigured) {
            return NextResponse.json(
                { error: 'ElevenLabs API key not configured' },
                { status: 500 }
            );
        }

        const voices = await elevenlabs.getVoices();

        return NextResponse.json({
            voices: voices.map((v) => ({
                id: v.voice_id,
                name: v.name,
                category: v.category,
                description: v.description,
                previewUrl: v.preview_url,
            })),
        });
    } catch (error) {
        console.error('Failed to fetch voices:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch voices' },
            { status: 500 }
        );
    }
}
