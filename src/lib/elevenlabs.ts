/**
 * ElevenLabs API Client
 * 
 * Integrates with ElevenLabs for text-to-speech narration generation.
 * API Docs: https://docs.elevenlabs.io/
 */

import { prisma } from "@/lib/db";

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";

interface ElevenLabsCredentials {
    apiKey: string;
}

interface Voice {
    voice_id: string;
    name: string;
    category: string;
    description?: string;
    labels: Record<string, string>;
    preview_url?: string;
}

interface TextToSpeechRequest {
    text: string;
    voiceId: string;
    modelId?: string;
    stability?: number;
    similarityBoost?: number;
    style?: number;
    useSpeakerBoost?: boolean;
}

interface TextToSpeechResponse {
    audio: Buffer;
    contentType: string;
}

/**
 * Get ElevenLabs API credentials from database
 */
async function getCredentials(): Promise<ElevenLabsCredentials | null> {
    const setting = await prisma.systemSettings.findUnique({
        where: { key: "elevenlabs_api_key" },
    });

    if (!setting?.value) {
        return null;
    }

    return { apiKey: setting.value };
}

/**
 * Make an authenticated request to ElevenLabs API
 */
async function elevenLabsFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> {
    const credentials = await getCredentials();

    if (!credentials) {
        throw new Error("ElevenLabs API key not configured. Please set it in Settings.");
    }

    const response = await fetch(`${ELEVENLABS_API_BASE}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "xi-api-key": credentials.apiKey,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
            error.detail?.message || error.message || `ElevenLabs API error: ${response.status}`
        );
    }

    return response;
}

/**
 * Get available voices
 */
export async function getVoices(): Promise<Voice[]> {
    const response = await elevenLabsFetch<{ voices: Voice[] }>("/voices");
    const data = await response.json();
    return data.voices;
}

/**
 * Generate speech from text
 */
export async function textToSpeech(
    request: TextToSpeechRequest
): Promise<TextToSpeechResponse> {
    const response = await elevenLabsFetch(`/text-to-speech/${request.voiceId}`, {
        method: "POST",
        body: JSON.stringify({
            text: request.text,
            model_id: request.modelId || "eleven_multilingual_v2",
            voice_settings: {
                stability: request.stability ?? 0.5,
                similarity_boost: request.similarityBoost ?? 0.75,
                style: request.style ?? 0,
                use_speaker_boost: request.useSpeakerBoost ?? true,
            },
        }),
    });

    const arrayBuffer = await response.arrayBuffer();

    return {
        audio: Buffer.from(arrayBuffer),
        contentType: response.headers.get("content-type") || "audio/mpeg",
    };
}

/**
 * Generate speech and return as base64
 */
export async function textToSpeechBase64(
    request: TextToSpeechRequest
): Promise<{ audio: string; contentType: string }> {
    const result = await textToSpeech(request);
    return {
        audio: result.audio.toString("base64"),
        contentType: result.contentType,
    };
}

/**
 * Get available models
 */
export async function getModels(): Promise<{ model_id: string; name: string }[]> {
    const response = await elevenLabsFetch("/models");
    const data = await response.json();
    return data;
}

/**
 * Get user subscription info and usage
 */
export async function getSubscription(): Promise<{
    characterCount: number;
    characterLimit: number;
    tier: string;
}> {
    const response = await elevenLabsFetch("/user/subscription");
    const data = await response.json();
    return {
        characterCount: data.character_count,
        characterLimit: data.character_limit,
        tier: data.tier,
    };
}

/**
 * Estimate cost for text generation
 * Based on ElevenLabs pricing (approximately)
 */
export function estimateCost(
    characterCount: number,
    tier: "free" | "starter" | "creator" | "pro" = "starter"
): { characters: number; usd: number } {
    // Rough pricing per 1000 characters
    const pricePerK: Record<string, number> = {
        free: 0, // Limited quota
        starter: 0.30,
        creator: 0.24,
        pro: 0.18,
    };

    const usd = (characterCount / 1000) * (pricePerK[tier] || 0.30);

    return { characters: characterCount, usd };
}

/**
 * Configure ElevenLabs API key
 */
export async function setApiKey(apiKey: string): Promise<void> {
    await prisma.systemSettings.upsert({
        where: { key: "elevenlabs_api_key" },
        update: { value: apiKey },
        create: { key: "elevenlabs_api_key", value: apiKey },
    });
}

/**
 * Check if ElevenLabs is configured
 */
export async function isConfigured(): Promise<boolean> {
    const credentials = await getCredentials();
    return credentials !== null;
}

/**
 * Japanese voice presets
 */
export const JAPANESE_VOICES = {
    female: {
        young: "pNInz6obpgDQGcFmaJgB", // Adam
        mature: "21m00Tcm4TlvDq8ikWAM", // Rachel
    },
    male: {
        young: "VR6AewLTigWG4xSOukaG", // Arnold
        mature: "ErXwobaYiN019PkySvjV", // Antoni
    },
};
