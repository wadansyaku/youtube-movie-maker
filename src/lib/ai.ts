import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/db';

const MODEL_NAME = 'gemini-1.5-flash';

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
    const modelName = options?.model || 'gemini-1.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: temp,
        },
    });

    return result.response.text();
}

export async function generateJSON(prompt: string, schema: any, modelName = MODEL_NAME) {
    const apiKey = await getApiKey();
    if (!apiKey) {
        throw new Error('API Keyが設定されていません。');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
            responseMimeType: 'application/json',
        },
    });

    const result = await model.generateContent(
        `${prompt}\n\nReturn JSON strictly following this schema:\n${JSON.stringify(schema)}`
    );

    return JSON.parse(result.response.text());
}
