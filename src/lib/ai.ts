import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/db';

const DEFAULT_MODELS = [
    'gemini-3-flash',
    'gemini-2.5-flash',
    'gemini-flash-latest',
];

async function getApiKey() {
    const setting = await prisma.systemSettings.findUnique({
        where: { key: 'gemini_api_key' },
    });
    return setting?.value;
}

export async function generateText(prompt: string, temp = 0.7, options?: { model?: string }) {
    const apiKey = await getApiKey();
    if (!apiKey) {
        throw new Error('API Keyが設定されていません。設定ページでキーを保存してください。');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelCandidates = options?.model ? [options.model] : DEFAULT_MODELS;
    let lastError: unknown;

    for (const modelName of modelCandidates) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: temp,
                },
            });
            return result.response.text();
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError;
}

export async function generateJSON(prompt: string, schema: any, modelName?: string) {
    const apiKey = await getApiKey();
    if (!apiKey) {
        throw new Error('API Keyが設定されていません。');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelCandidates = modelName ? [modelName] : DEFAULT_MODELS;
    let lastError: unknown;

    for (const candidate of modelCandidates) {
        try {
            const model = genAI.getGenerativeModel({
                model: candidate,
                generationConfig: {
                    responseMimeType: 'application/json',
                },
            });

            const result = await model.generateContent(
                `${prompt}\n\nReturn JSON strictly following this schema:\n${JSON.stringify(schema)}`
            );

            return JSON.parse(result.response.text());
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError;
}
