'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { generateJSON as genJSON } from '@/lib/ai';
import { requireUser } from '@/lib/auth-guard';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function ensureAuth() {
    await requireUser();
}

type ActionResult = {
    ok: boolean;
    message: string;
};

const GEMINI_MODELS = ['gemini-3-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];

async function saveSetting(key: string, formData: FormData): Promise<ActionResult> {
    try {
        await ensureAuth();
        const apiKey = formData.get('apiKey') as string;
        const trimmed = apiKey?.trim();
        if (!trimmed) {
            return { ok: false, message: 'APIキーを入力してください' };
        }

        await prisma.systemSettings.upsert({
            where: { key },
            update: { value: trimmed },
            create: { key, value: trimmed },
        });

        revalidatePath('/settings');
        return { ok: true, message: '保存しました' };
    } catch (error) {
        console.error(`Failed to save ${key}:`, error);
        return {
            ok: false,
            message: error instanceof Error ? error.message : '保存に失敗しました',
        };
    }
}

export async function saveApiKey(formData: FormData): Promise<ActionResult> {
    return saveSetting('gemini_api_key', formData);
}

export async function getApiKey() {
    await ensureAuth();
    const setting = await prisma.systemSettings.findUnique({
        where: { key: 'gemini_api_key' },
    });
    return setting?.value;
}

// Runway API Key
export async function saveRunwayApiKey(formData: FormData): Promise<ActionResult> {
    return saveSetting('runway_api_key', formData);
}

export async function getRunwayApiKey() {
    await ensureAuth();
    const setting = await prisma.systemSettings.findUnique({
        where: { key: 'runway_api_key' },
    });
    return setting?.value;
}

// ElevenLabs API Key
export async function saveElevenLabsApiKey(formData: FormData): Promise<ActionResult> {
    return saveSetting('elevenlabs_api_key', formData);
}

export async function getElevenLabsApiKey() {
    await ensureAuth();
    const setting = await prisma.systemSettings.findUnique({
        where: { key: 'elevenlabs_api_key' },
    });
    return setting?.value;
}

// Stability AI API Key
export async function saveStabilityApiKey(formData: FormData): Promise<ActionResult> {
    return saveSetting('stability_api_key', formData);
}

export async function getStabilityApiKey() {
    await ensureAuth();
    const setting = await prisma.systemSettings.findUnique({
        where: { key: 'stability_api_key' },
    });
    return setting?.value;
}

// Stripe API Keys
export async function saveStripeSecretKey(formData: FormData): Promise<ActionResult> {
    return saveSetting('stripe_secret_key', formData);
}

export async function getStripeSecretKey() {
    await ensureAuth();
    const setting = await prisma.systemSettings.findUnique({
        where: { key: 'stripe_secret_key' },
    });
    return setting?.value;
}

export async function saveStripePublishableKey(formData: FormData): Promise<ActionResult> {
    return saveSetting('stripe_publishable_key', formData);
}

export async function getStripePublishableKey() {
    await ensureAuth();
    const setting = await prisma.systemSettings.findUnique({
        where: { key: 'stripe_publishable_key' },
    });
    return setting?.value;
}

export async function saveStripeWebhookSecret(formData: FormData): Promise<ActionResult> {
    return saveSetting('stripe_webhook_secret', formData);
}

export async function testGeminiApiKey(formData: FormData): Promise<ActionResult> {
    try {
        await ensureAuth();
        const apiKey = formData.get('apiKey') as string;
        const trimmed = apiKey?.trim();
        if (!trimmed) {
            return { ok: false, message: 'APIキーを入力してください' };
        }

        const genAI = new GoogleGenerativeAI(trimmed);
        let lastError: unknown;

        for (const modelName of GEMINI_MODELS) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                await model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: 'Ping' }] }],
                });
                return { ok: true, message: 'Geminiキーを確認しました' };
            } catch (error) {
                lastError = error;
            }
        }

        return {
            ok: false,
            message: lastError instanceof Error ? lastError.message : 'Geminiキーの検証に失敗しました',
        };
    } catch (error) {
        console.error('Failed to test Gemini API key:', error);
        return {
            ok: false,
            message: error instanceof Error ? error.message : 'Geminiキーの検証に失敗しました',
        };
    }
}

export async function getStripeWebhookSecret() {
    await ensureAuth();
    const setting = await prisma.systemSettings.findUnique({
        where: { key: 'stripe_webhook_secret' },
    });
    return setting?.value;
}

export async function generateDecisionLog(notes: string) {
    await ensureAuth();
    const prompt = `
あなたはプロの映像編集者です。以下のメモ（編集時の思考）を元に、
YouTube動画の「編集意図（Editorial Intent）」と「差別化ポイント」を
第三者に伝わるように、説得力のある文章に整えてください。
JSONで返してください。

メモ:
${notes}

Format:
{
  "editorialIntent": "...",
  "differentiationPoints": "..."
}
  `;

    return genJSON(prompt, {
        editorialIntent: "string",
        differentiationPoints: "string"
    });
}

export async function generateWorldBible(concept: string) {
    await ensureAuth();
    const prompt = `
シリーズコンセプト: "${concept}"

このコンセプトに基づき、映画のような映像制作のためのスタイルガイド（World Bible）を提案してください。
Visual Style, Audio Style, RulesなどをJSON形式で作成してください。
特に、"Runway"での映像生成と"Suno"での音楽生成に適した具体的な指示を含めてください。
BrainrotやVaporwaveなどのインターネットミーム文化にも理解を示してください。
  `;

    return genJSON(prompt, {
        visualStyle: { colorPalette: [], lightingStyle: "", cameraStyle: "", aspectRatio: "", notes: "" },
        audioStyle: { genre: "", tempo: "", mood: "", instruments: [], notes: "" },
        rules: { mustInclude: [], mustAvoid: [], styleGuidelines: [] }
    }, 'gemini-1.5-pro');
}
