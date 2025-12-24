/**
 * Runway API Client
 * 
 * Integrates with Runway Gen-3 Alpha API for video generation.
 * API Docs: https://docs.runwayml.com/
 */

import { prisma } from "@/lib/db";

const RUNWAY_API_BASE = "https://api.runwayml.com/v1";

interface RunwayCredentials {
    apiKey: string;
    apiSecret?: string;
}

interface GenerateVideoRequest {
    promptText: string;
    promptImage?: string; // base64 or URL
    model?: "gen3a_turbo" | "gen3";
    duration?: 5 | 10;
    ratio?: "16:9" | "9:16" | "1:1";
    watermark?: boolean;
}

interface GenerateVideoResponse {
    id: string;
    status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";
    createdAt: string;
    output?: string[];
    failure?: string;
    failureCode?: string;
}

interface TaskStatusResponse {
    id: string;
    status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";
    progress: number;
    output?: string[];
    failure?: string;
    estimatedTimeRemaining?: number;
}

/**
 * Get Runway API credentials from database
 */
async function getCredentials(): Promise<RunwayCredentials | null> {
    const setting = await prisma.systemSettings.findUnique({
        where: { key: "runway_api_key" },
    });

    if (!setting?.value) {
        return null;
    }

    return { apiKey: setting.value };
}

/**
 * Make an authenticated request to Runway API
 */
async function runwayFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const credentials = await getCredentials();

    if (!credentials) {
        throw new Error("Runway API key not configured. Please set it in Settings.");
    }

    const response = await fetch(`${RUNWAY_API_BASE}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${credentials.apiKey}`,
            "X-Runway-Version": "2024-11-06",
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
            error.message || `Runway API error: ${response.status} ${response.statusText}`
        );
    }

    return response.json();
}

/**
 * Start a video generation task
 */
export async function generateVideo(
    request: GenerateVideoRequest
): Promise<GenerateVideoResponse> {
    const body: Record<string, unknown> = {
        promptText: request.promptText,
        model: request.model || "gen3a_turbo",
        duration: request.duration || 10,
        ratio: request.ratio || "16:9",
        watermark: request.watermark ?? false,
    };

    if (request.promptImage) {
        body.promptImage = request.promptImage;
    }

    return runwayFetch<GenerateVideoResponse>("/image_to_video", {
        method: "POST",
        body: JSON.stringify(body),
    });
}

/**
 * Check the status of a generation task
 */
export async function getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
    return runwayFetch<TaskStatusResponse>(`/tasks/${taskId}`);
}

/**
 * Cancel a running task
 */
export async function cancelTask(taskId: string): Promise<void> {
    await runwayFetch(`/tasks/${taskId}/cancel`, {
        method: "POST",
    });
}

/**
 * Poll for task completion with callback for progress updates
 */
export async function waitForCompletion(
    taskId: string,
    options?: {
        pollInterval?: number;
        timeout?: number;
        onProgress?: (progress: number, eta?: number) => void;
    }
): Promise<TaskStatusResponse> {
    const pollInterval = options?.pollInterval || 5000;
    const timeout = options?.timeout || 300000; // 5 minutes default
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        const status = await getTaskStatus(taskId);

        if (options?.onProgress) {
            options.onProgress(status.progress, status.estimatedTimeRemaining);
        }

        if (status.status === "SUCCEEDED" || status.status === "FAILED") {
            return status;
        }

        await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Task ${taskId} timed out after ${timeout}ms`);
}

/**
 * Download video from Runway output URL
 */
export async function downloadVideo(
    outputUrl: string,
    outputPath?: string
): Promise<Buffer> {
    const response = await fetch(outputUrl);

    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * Estimate cost for a generation
 * Based on Runway pricing (approximately)
 */
export function estimateCost(
    duration: 5 | 10 = 10,
    model: "gen3a_turbo" | "gen3" = "gen3a_turbo"
): { credits: number; usd: number } {
    // Runway charges per second
    // Gen-3 Alpha Turbo: ~5 credits/second
    // Gen-3: ~10 credits/second
    const creditsPerSecond = model === "gen3a_turbo" ? 5 : 10;
    const credits = duration * creditsPerSecond;

    // Approximately 100 credits = $1
    const usd = credits / 100;

    return { credits, usd };
}

/**
 * Configure Runway API key
 */
export async function setApiKey(apiKey: string): Promise<void> {
    await prisma.systemSettings.upsert({
        where: { key: "runway_api_key" },
        update: { value: apiKey },
        create: { key: "runway_api_key", value: apiKey },
    });
}

/**
 * Check if Runway is configured
 */
export async function isConfigured(): Promise<boolean> {
    const credentials = await getCredentials();
    return credentials !== null;
}
