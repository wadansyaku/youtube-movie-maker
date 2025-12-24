/**
 * Stability AI Client
 * 
 * Integrates with Stability AI for image generation (thumbnails, still frames).
 * API Docs: https://platform.stability.ai/docs/api-reference
 */

import { prisma } from "@/lib/db";

const STABILITY_API_BASE = "https://api.stability.ai/v2beta";

interface StabilityCredentials {
    apiKey: string;
}

interface GenerateImageRequest {
    prompt: string;
    negativePrompt?: string;
    aspectRatio?: "16:9" | "9:16" | "1:1" | "21:9" | "4:5";
    model?: "sd3-large" | "sd3-medium" | "stable-image-ultra";
    outputFormat?: "png" | "jpeg" | "webp";
}

interface GenerateImageResponse {
    image: string; // base64
    finishReason: string;
    seed: number;
}

/**
 * Get Stability AI credentials from database
 */
async function getCredentials(): Promise<StabilityCredentials | null> {
    const setting = await prisma.systemSettings.findUnique({
        where: { key: "stability_api_key" },
    });

    if (!setting?.value) {
        return null;
    }

    return { apiKey: setting.value };
}

/**
 * Make an authenticated request to Stability API
 */
async function stabilityFetch(
    endpoint: string,
    formData: FormData
): Promise<Response> {
    const credentials = await getCredentials();

    if (!credentials) {
        throw new Error("Stability AI API key not configured. Please set it in Settings.");
    }

    const response = await fetch(`${STABILITY_API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${credentials.apiKey}`,
            "Accept": "application/json",
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
            error.message || `Stability AI error: ${response.status} ${response.statusText}`
        );
    }

    return response;
}

/**
 * Generate an image using Stable Diffusion 3
 */
export async function generateImage(
    request: GenerateImageRequest
): Promise<GenerateImageResponse> {
    const formData = new FormData();
    formData.append("prompt", request.prompt);

    if (request.negativePrompt) {
        formData.append("negative_prompt", request.negativePrompt);
    }

    formData.append("aspect_ratio", request.aspectRatio || "16:9");
    formData.append("model", request.model || "sd3-large");
    formData.append("output_format", request.outputFormat || "png");

    const response = await stabilityFetch("/stable-image/generate/sd3", formData);
    const data = await response.json();

    return {
        image: data.image,
        finishReason: data.finish_reason,
        seed: data.seed,
    };
}

/**
 * Generate a thumbnail optimized for YouTube
 */
export async function generateThumbnail(
    title: string,
    description: string,
    style?: string
): Promise<GenerateImageResponse> {
    const prompt = `YouTube thumbnail, ${style || 'cinematic dramatic lighting'}, ${title}, ${description}, eye-catching, vibrant colors, professional quality, 4k detailed`;

    const negativePrompt = "text, watermark, low quality, blurry, amateur, ugly";

    return generateImage({
        prompt,
        negativePrompt,
        aspectRatio: "16:9",
        model: "sd3-large",
        outputFormat: "png",
    });
}

/**
 * Upscale an image
 */
export async function upscaleImage(
    imageBase64: string,
    prompt?: string
): Promise<{ image: string }> {
    const credentials = await getCredentials();

    if (!credentials) {
        throw new Error("Stability AI API key not configured.");
    }

    const formData = new FormData();

    // Convert base64 to blob
    const imageBlob = new Blob(
        [Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0))],
        { type: 'image/png' }
    );
    formData.append("image", imageBlob, "image.png");

    if (prompt) {
        formData.append("prompt", prompt);
    }

    const response = await fetch(`${STABILITY_API_BASE}/stable-image/upscale/creative`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${credentials.apiKey}`,
            "Accept": "application/json",
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Upscale failed");
    }

    const data = await response.json();
    return { image: data.image };
}

/**
 * Estimate cost for generation
 */
export function estimateCost(
    model: "sd3-large" | "sd3-medium" | "stable-image-ultra" = "sd3-large"
): { credits: number; usd: number } {
    // Approximate credits per generation
    const creditsPerGeneration: Record<string, number> = {
        "sd3-large": 6.5,
        "sd3-medium": 3.5,
        "stable-image-ultra": 8,
    };

    const credits = creditsPerGeneration[model] || 6.5;
    // Approximately 1000 credits = $10
    const usd = credits / 100;

    return { credits, usd };
}

/**
 * Configure Stability AI API key
 */
export async function setApiKey(apiKey: string): Promise<void> {
    await prisma.systemSettings.upsert({
        where: { key: "stability_api_key" },
        update: { value: apiKey },
        create: { key: "stability_api_key", value: apiKey },
    });
}

/**
 * Check if Stability AI is configured
 */
export async function isConfigured(): Promise<boolean> {
    const credentials = await getCredentials();
    return credentials !== null;
}
