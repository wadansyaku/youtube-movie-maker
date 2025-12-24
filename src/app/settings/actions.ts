'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { generateText as genText, generateJSON as genJSON } from '@/lib/ai';
import { requireUser } from '@/lib/auth-guard';

async function ensureAuth() {
    await requireUser();
}

export async function saveApiKey(formData: FormData) {
    await ensureAuth();
    const apiKey = formData.get('apiKey') as string;
    if (!apiKey) return;

    await prisma.systemSettings.upsert({
        where: { key: 'gemini_api_key' },
        update: { value: apiKey },
        create: { key: 'gemini_api_key', value: apiKey },
    });

    revalidatePath('/settings');
}

export async function getApiKey() {
    await ensureAuth();
    const setting = await prisma.systemSettings.findUnique({
        where: { key: 'gemini_api_key' },
    });
    return setting?.value;
}

// Runway API Key
export async function saveRunwayApiKey(formData: FormData) {
    await ensureAuth();
    const apiKey = formData.get('apiKey') as string;
    if (!apiKey) return;

    await prisma.systemSettings.upsert({
        where: { key: 'runway_api_key' },
        update: { value: apiKey },
        create: { key: 'runway_api_key', value: apiKey },
    });

    revalidatePath('/settings');
}

export async function getRunwayApiKey() {
    await ensureAuth();
    const setting = await prisma.systemSettings.findUnique({
        where: { key: 'runway_api_key' },
    });
    return setting?.value;
}

// ElevenLabs API Key
export async function saveElevenLabsApiKey(formData: FormData) {
    await ensureAuth();
    const apiKey = formData.get('apiKey') as string;
    if (!apiKey) return;

    await prisma.systemSettings.upsert({
        where: { key: 'elevenlabs_api_key' },
        update: { value: apiKey },
        create: { key: 'elevenlabs_api_key', value: apiKey },
    });

    revalidatePath('/settings');
}

export async function getElevenLabsApiKey() {
    await ensureAuth();
    const setting = await prisma.systemSettings.findUnique({
        where: { key: 'elevenlabs_api_key' },
    });
    return setting?.value;
}

// Stability AI API Key
export async function saveStabilityApiKey(formData: FormData) {
    await ensureAuth();
    const apiKey = formData.get('apiKey') as string;
    if (!apiKey) return;

    await prisma.systemSettings.upsert({
        where: { key: 'stability_api_key' },
        update: { value: apiKey },
        create: { key: 'stability_api_key', value: apiKey },
    });

    revalidatePath('/settings');
}

export async function getStabilityApiKey() {
    await ensureAuth();
    const setting = await prisma.systemSettings.findUnique({
        where: { key: 'stability_api_key' },
    });
    return setting?.value;
}

// Stripe API Keys
export async function saveStripeSecretKey(formData: FormData) {
    await ensureAuth();
    const apiKey = formData.get('apiKey') as string;
    if (!apiKey) return;

    await prisma.systemSettings.upsert({
        where: { key: 'stripe_secret_key' },
        update: { value: apiKey },
        create: { key: 'stripe_secret_key', value: apiKey },
    });

    revalidatePath('/settings');
}

export async function getStripeSecretKey() {
    await ensureAuth();
    const setting = await prisma.systemSettings.findUnique({
        where: { key: 'stripe_secret_key' },
    });
    return setting?.value;
}

export async function saveStripePublishableKey(formData: FormData) {
    await ensureAuth();
    const apiKey = formData.get('apiKey') as string;
    if (!apiKey) return;

    await prisma.systemSettings.upsert({
        where: { key: 'stripe_publishable_key' },
        update: { value: apiKey },
        create: { key: 'stripe_publishable_key', value: apiKey },
    });

    revalidatePath('/settings');
}

export async function getStripePublishableKey() {
    await ensureAuth();
    const setting = await prisma.systemSettings.findUnique({
        where: { key: 'stripe_publishable_key' },
    });
    return setting?.value;
}

export async function saveStripeWebhookSecret(formData: FormData) {
    await ensureAuth();
    const apiKey = formData.get('apiKey') as string;
    if (!apiKey) return;

    await prisma.systemSettings.upsert({
        where: { key: 'stripe_webhook_secret' },
        update: { value: apiKey },
        create: { key: 'stripe_webhook_secret', value: apiKey },
    });

    revalidatePath('/settings');
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
