import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import type { ProductionSnapshot, ProductionStep } from "./types";

const ARTIFACT_DIR = path.join(process.cwd(), "data", "production-os", "artifacts");

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

function formatStepLabel(step: ProductionStep, index: number) {
    const tool = step.tool ? `/${step.tool}` : "";
    const name = step.name ? ` - ${step.name}` : "";
    return `STEP ${index + 1}: ${step.type}${tool}${name}`;
}

export async function executeJobRun(jobRunId: string) {
    const jobRun = await prisma.jobRun.findUnique({
        where: { id: jobRunId },
        include: { item: true, template: true },
    });

    if (!jobRun) {
        throw new Error("JobRun not found");
    }

    let logBuffer = jobRun.log || "";
    const appendLog = (line: string) => {
        logBuffer = logBuffer ? `${logBuffer}\n${line}` : line;
    };

    appendLog(`[${new Date().toISOString()}] Job started`);

    await prisma.jobRun.update({
        where: { id: jobRunId },
        data: {
            status: "running",
            startedAt: new Date(),
            log: logBuffer,
        },
    });

    try {
        const snapshot = safeJsonParse<ProductionSnapshot>(jobRun.inputSnapshot, {
            version: 1,
            capturedAt: new Date().toISOString(),
            item: {
                id: jobRun.itemId,
                title: jobRun.item.title,
                status: jobRun.item.status,
                tags: [],
                inputText: jobRun.item.inputText,
                kpiNote: jobRun.item.kpiNote,
            },
            template: null,
            assets: [],
            references: [],
            steps: [],
            params: {},
        });

        const steps = snapshot.steps ?? [];
        if (steps.length === 0) {
            appendLog("No steps found. Marking as succeeded.");
        }

        steps.forEach((step, index) => {
            appendLog(`[${new Date().toISOString()}] ${formatStepLabel(step, index)} started`);
            if (step.params && (step.params as { forceFail?: boolean }).forceFail) {
                throw new Error(`Step failed: ${formatStepLabel(step, index)}`);
            }
            appendLog(`[${new Date().toISOString()}] ${formatStepLabel(step, index)} completed`);
        });

        ensureDir(ARTIFACT_DIR);
        const artifactName = `${jobRun.item.title || "item"}-${jobRun.id}`;
        const artifactPath = path.join(ARTIFACT_DIR, `${jobRun.id}.json`);
        const artifactPayload = {
            jobRunId: jobRun.id,
            itemId: jobRun.itemId,
            createdAt: new Date().toISOString(),
            snapshot,
            log: logBuffer,
        };
        fs.writeFileSync(artifactPath, JSON.stringify(artifactPayload, null, 2), "utf-8");

        const artifact = await prisma.artifact.create({
            data: {
                itemId: jobRun.itemId,
                jobRunId: jobRun.id,
                name: artifactName,
                type: snapshot.template?.format || "artifact",
                uri: artifactPath,
                metadata: JSON.stringify({
                    runner: "local",
                    stepCount: steps.length,
                }),
            },
        });

        appendLog(`[${new Date().toISOString()}] Job succeeded`);

        await prisma.jobRun.update({
            where: { id: jobRunId },
            data: {
                status: "succeeded",
                finishedAt: new Date(),
                log: logBuffer,
            },
        });

        return { artifactId: artifact.id };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        appendLog(`[${new Date().toISOString()}] Job failed: ${message}`);

        await prisma.jobRun.update({
            where: { id: jobRunId },
            data: {
                status: "failed",
                finishedAt: new Date(),
                log: logBuffer,
            },
        });

        return { error: message };
    }
}
