import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

export type RenderJobStatus = "queued" | "rendering" | "completed" | "failed";

export type RenderJob = {
    id: string;
    status: RenderJobStatus;
    progress: number;
    message?: string;
    assetId?: string;
    filePath?: string;
    error?: string;
    createdAt: number;
    updatedAt: number;
};

const jobs = new Map<string, RenderJob>();
const jobsDir = path.join(process.cwd(), "data", "render-jobs");

const ensureJobsDir = async () => {
    await fs.mkdir(jobsDir, { recursive: true });
};

const getJobPath = (id: string) => path.join(jobsDir, `${id}.json`);

const readJob = async (id: string) => {
    try {
        const data = await fs.readFile(getJobPath(id), "utf-8");
        return JSON.parse(data) as RenderJob;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            return null;
        }
        throw error;
    }
};

const writeJob = async (job: RenderJob) => {
    await ensureJobsDir();
    await fs.writeFile(getJobPath(job.id), JSON.stringify(job), "utf-8");
};

export const createRenderJob = async () => {
    const id = randomUUID();
    const now = Date.now();
    const job: RenderJob = {
        id,
        status: "queued",
        progress: 0,
        message: "準備中",
        createdAt: now,
        updatedAt: now,
    };
    jobs.set(id, job);
    await writeJob(job);
    return job;
};

export const updateRenderJob = async (id: string, updates: Partial<RenderJob>) => {
    const job = jobs.get(id) ?? (await readJob(id));
    if (!job) return null;
    const next: RenderJob = {
        ...job,
        ...updates,
        updatedAt: Date.now(),
    };
    jobs.set(id, next);
    await writeJob(next);
    return next;
};

export const getRenderJob = async (id: string) => {
    const cached = jobs.get(id);
    if (cached) return cached;
    const stored = await readJob(id);
    if (stored) {
        jobs.set(id, stored);
    }
    return stored;
};
