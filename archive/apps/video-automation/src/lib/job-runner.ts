import fs from 'fs';
import path from 'path';
import { prisma } from './db';
import { renderVideo, RenderResult } from './render-engine';

export interface JobStep {
    type: 'remotion' | 'script' | 'manual';
    name?: string;
    compositionId?: string;
    params?: Record<string, unknown>;
}

export interface JobSnapshot {
    version: number;
    capturedAt: string;
    projectId: string;
    projectTitle: string;
    templateId?: string;
    templateName?: string;
    steps: JobStep[];
    videoConfig?: Record<string, unknown>;
}

export interface JobRunResult {
    success: boolean;
    artifactId?: string;
    outputPath?: string;
    error?: string;
}

const ARTIFACT_DIR = path.join(process.cwd(), 'out', 'artifacts');

function ensureDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function safeJsonParse<T>(value: string, fallback: T): T {
    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
}

/**
 * Execute a job run with all its steps
 */
export async function executeJobRun(jobRunId: string): Promise<JobRunResult> {
    const jobRun = await prisma.jobRun.findUnique({
        where: { id: jobRunId },
        include: { item: true, template: true },
    });

    if (!jobRun) {
        throw new Error('JobRun not found');
    }

    let logBuffer = jobRun.log || '';
    const appendLog = (line: string) => {
        const timestamp = new Date().toISOString();
        logBuffer = logBuffer ? `${logBuffer}\n[${timestamp}] ${line}` : `[${timestamp}] ${line}`;
    };

    appendLog('Job started');

    // Update status to running
    await prisma.jobRun.update({
        where: { id: jobRunId },
        data: {
            status: 'running',
            startedAt: new Date(),
            log: logBuffer,
        },
    });

    try {
        const snapshot = safeJsonParse<JobSnapshot>(jobRun.inputSnapshot, {
            version: 1,
            capturedAt: new Date().toISOString(),
            projectId: jobRun.itemId,
            projectTitle: jobRun.item.title,
            steps: [],
        });

        const steps = snapshot.steps || [];
        let renderResult: RenderResult | null = null;

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const stepLabel = `Step ${i + 1}: ${step.type}${step.name ? ` - ${step.name}` : ''}`;
            appendLog(`${stepLabel} started`);

            if (step.type === 'remotion' && step.compositionId) {
                // Execute Remotion render
                const outputFileName = `${jobRun.item.title.replace(/[^a-z0-9]/gi, '_')}_${jobRunId}.mp4`;

                renderResult = await renderVideo({
                    compositionId: step.compositionId,
                    outputPath: outputFileName,
                    props: snapshot.videoConfig,
                });

                if (!renderResult.success) {
                    throw new Error(`Render failed: ${renderResult.error}`);
                }

                appendLog(`${stepLabel} completed - Output: ${renderResult.outputPath}`);
            } else {
                // Generic step execution (placeholder for future step types)
                appendLog(`${stepLabel} completed`);
            }
        }

        // If no steps, mark as succeeded
        if (steps.length === 0) {
            appendLog('No steps found. Marking as succeeded.');
        }

        // Create artifact
        ensureDir(ARTIFACT_DIR);
        const artifactName = `${jobRun.item.title}-${jobRun.id}`;
        const artifactPath = renderResult?.outputPath || path.join(ARTIFACT_DIR, `${jobRun.id}.json`);

        // If no render was done, save snapshot as artifact
        if (!renderResult) {
            const artifactPayload = {
                jobRunId: jobRun.id,
                itemId: jobRun.itemId,
                createdAt: new Date().toISOString(),
                snapshot,
                log: logBuffer,
            };
            fs.writeFileSync(
                path.join(ARTIFACT_DIR, `${jobRun.id}.json`),
                JSON.stringify(artifactPayload, null, 2),
                'utf-8'
            );
        }

        const artifact = await prisma.artifact.create({
            data: {
                itemId: jobRun.itemId,
                jobRunId: jobRun.id,
                name: artifactName,
                type: renderResult ? 'video' : 'report',
                uri: artifactPath,
                metadata: JSON.stringify({
                    runner: 'video-automation',
                    stepCount: steps.length,
                    renderDuration: renderResult?.duration,
                }),
            },
        });

        appendLog('Job succeeded');

        // Update status to succeeded
        await prisma.jobRun.update({
            where: { id: jobRunId },
            data: {
                status: 'succeeded',
                finishedAt: new Date(),
                log: logBuffer,
            },
        });

        return {
            success: true,
            artifactId: artifact.id,
            outputPath: artifactPath,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        appendLog(`Job failed: ${errorMessage}`);

        await prisma.jobRun.update({
            where: { id: jobRunId },
            data: {
                status: 'failed',
                finishedAt: new Date(),
                log: logBuffer,
            },
        });

        return {
            success: false,
            error: errorMessage,
        };
    }
}

/**
 * Create a new job run for a project
 */
export async function createJobRun(params: {
    itemId: string;
    templateId?: string;
    videoConfig?: Record<string, unknown>;
}): Promise<string> {
    const { itemId, templateId, videoConfig } = params;

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
        throw new Error('Item not found');
    }

    let template = null;
    if (templateId) {
        template = await prisma.template.findUnique({ where: { id: templateId } });
    }

    const steps: JobStep[] = template
        ? safeJsonParse<JobStep[]>(template.steps, [])
        : [{ type: 'remotion', compositionId: 'MedicalShorts' }];

    const snapshot: JobSnapshot = {
        version: 1,
        capturedAt: new Date().toISOString(),
        projectId: item.id,
        projectTitle: item.title,
        templateId: template?.id,
        templateName: template?.name,
        steps,
        videoConfig,
    };

    const jobRun = await prisma.jobRun.create({
        data: {
            itemId: item.id,
            templateId: template?.id,
            status: 'queued',
            inputSnapshot: JSON.stringify(snapshot),
            log: '',
        },
    });

    return jobRun.id;
}
