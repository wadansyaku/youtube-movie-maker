"use server";

import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getAssetType, getContentType } from "@/lib/storage";
import { executeJobRun } from "@/lib/production-os/runner";
import type { ProductionSnapshot, ProductionStep } from "@/lib/production-os/types";

const UPLOAD_DIR = path.join(process.cwd(), "data", "production-os", "uploads");

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

function toTagArray(input: string) {
    return input
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
}

function sanitizeFileName(fileName: string) {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function createItem(formData: FormData) {
    const title = String(formData.get("title") || "").trim();
    if (!title) return;

    const status = String(formData.get("status") || "draft");
    const templateIdValue = String(formData.get("templateId") || "").trim();
    const templateId = templateIdValue ? templateIdValue : null;
    const inputText = String(formData.get("inputText") || "").trim();
    const tags = toTagArray(String(formData.get("tags") || ""));

    await prisma.item.create({
        data: {
            title,
            status,
            templateId,
            inputText: inputText || null,
            tags: JSON.stringify(tags),
        },
    });

    revalidatePath("/production-os");
}

export async function updateItem(formData: FormData) {
    const itemId = String(formData.get("itemId") || "");
    if (!itemId) return;

    const title = String(formData.get("title") || "").trim();
    const status = String(formData.get("status") || "draft");
    const templateIdValue = String(formData.get("templateId") || "").trim();
    const templateId = templateIdValue ? templateIdValue : null;
    const inputText = String(formData.get("inputText") || "").trim();
    const tags = toTagArray(String(formData.get("tags") || ""));
    const kpiNote = String(formData.get("kpiNote") || "").trim();

    await prisma.item.update({
        where: { id: itemId },
        data: {
            title: title || undefined,
            status,
            templateId,
            inputText: inputText || null,
            tags: JSON.stringify(tags),
            kpiNote: kpiNote || null,
        },
    });

    revalidatePath(`/production-os/items/${itemId}`);
    revalidatePath("/production-os");
}

export async function createTemplate(formData: FormData) {
    const name = String(formData.get("name") || "").trim();
    if (!name) return;

    const format = String(formData.get("format") || "shorts").trim();
    const description = String(formData.get("description") || "").trim();
    const configRaw = String(formData.get("config") || "{}");
    const stepsRaw = String(formData.get("steps") || "[]");

    const config = safeJsonParse<Record<string, unknown>>(configRaw, {});
    const steps = safeJsonParse<ProductionStep[]>(stepsRaw, []);

    await prisma.template.create({
        data: {
            name,
            format,
            description: description || null,
            config: JSON.stringify(config),
            steps: JSON.stringify(steps),
        },
    });

    revalidatePath("/production-os/templates");
}

export async function createAsset(formData: FormData) {
    const file = formData.get("file") as File | null;
    if (!file) return;

    const tags = toTagArray(String(formData.get("tags") || ""));
    const role = String(formData.get("role") || "").trim();

    ensureDir(UPLOAD_DIR);
    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = sanitizeFileName(file.name || "asset");
    const filePath = path.join(UPLOAD_DIR, `${Date.now()}_${safeName}`);
    fs.writeFileSync(filePath, buffer);

    await prisma.asset.create({
        data: {
            type: getAssetType(file.name),
            fileName: safeName,
            filePath,
            fileSize: buffer.length,
            mimeType: getContentType(file.name),
            source: "production-os",
            metadata: JSON.stringify({
                tags,
                role: role || null,
                origin: "production-os",
            }),
        },
    });

    revalidatePath("/production-os/assets");
}

export async function linkAssetToItem(formData: FormData) {
    const itemId = String(formData.get("itemId") || "");
    const assetId = String(formData.get("assetId") || "");
    const role = String(formData.get("role") || "").trim();
    if (!itemId || !assetId) return;

    await prisma.itemAsset.upsert({
        where: {
            itemId_assetId: {
                itemId,
                assetId,
            },
        },
        update: {
            role: role || null,
        },
        create: {
            itemId,
            assetId,
            role: role || null,
        },
    });

    revalidatePath(`/production-os/items/${itemId}`);
}

export async function unlinkAssetFromItem(formData: FormData) {
    const itemId = String(formData.get("itemId") || "");
    const assetId = String(formData.get("assetId") || "");
    if (!itemId || !assetId) return;

    await prisma.itemAsset.delete({
        where: {
            itemId_assetId: {
                itemId,
                assetId,
            },
        },
    });

    revalidatePath(`/production-os/items/${itemId}`);
}

export async function addReference(formData: FormData) {
    const itemId = String(formData.get("itemId") || "");
    const label = String(formData.get("label") || "").trim();
    if (!itemId || !label) return;

    const url = String(formData.get("url") || "").trim();
    const notes = String(formData.get("notes") || "").trim();

    await prisma.reference.create({
        data: {
            itemId,
            label,
            url: url || null,
            notes: notes || null,
        },
    });

    revalidatePath(`/production-os/items/${itemId}`);
}

export async function deleteReference(formData: FormData) {
    const itemId = String(formData.get("itemId") || "");
    const referenceId = String(formData.get("referenceId") || "");
    if (!itemId || !referenceId) return;

    await prisma.reference.delete({ where: { id: referenceId } });
    revalidatePath(`/production-os/items/${itemId}`);
}

export async function updateArtifactKpi(formData: FormData) {
    const artifactId = String(formData.get("artifactId") || "");
    const itemId = String(formData.get("itemId") || "");
    if (!artifactId) return;

    const kpiNote = String(formData.get("kpiNote") || "").trim();
    await prisma.artifact.update({
        where: { id: artifactId },
        data: { kpiNote: kpiNote || null },
    });

    if (itemId) {
        revalidatePath(`/production-os/items/${itemId}`);
    }
}

function buildSnapshot(params: {
    item: {
        id: string;
        title: string;
        status: string;
        tags: string[];
        inputText?: string | null;
        kpiNote?: string | null;
    };
    template: {
        id: string;
        name: string;
        format: string;
        config: Record<string, unknown>;
        steps: ProductionStep[];
    } | null;
    assets: Array<{
        id: string;
        fileName: string;
        type: string;
        filePath: string;
        role?: string | null;
        notes?: string | null;
        metadata: Record<string, unknown>;
    }>;
    references: Array<{
        id: string;
        label: string;
        url?: string | null;
        notes?: string | null;
    }>;
}) {
    const steps = params.template?.steps ?? [];
    const snapshot: ProductionSnapshot = {
        version: 1,
        capturedAt: new Date().toISOString(),
        item: params.item,
        template: params.template,
        assets: params.assets,
        references: params.references,
        steps,
        params: {
            runner: "local",
        },
    };
    return snapshot;
}

export async function createJobRun(formData: FormData) {
    const itemId = String(formData.get("itemId") || "");
    if (!itemId) return;

    const templateIdRaw = String(formData.get("templateId") || "").trim();

    const item = await prisma.item.findUnique({
        where: { id: itemId },
        include: {
            template: true,
            assets: { include: { asset: true } },
            references: true,
        },
    });

    if (!item) return;

    const template = templateIdRaw
        ? await prisma.template.findUnique({ where: { id: templateIdRaw } })
        : item.template;

    if (!template) return;

    const tags = safeJsonParse<string[]>(item.tags || "[]", []);
    const config = safeJsonParse<Record<string, unknown>>(template.config, {});
    const steps = safeJsonParse<ProductionStep[]>(template.steps, []);

    const snapshot = buildSnapshot({
        item: {
            id: item.id,
            title: item.title,
            status: item.status,
            tags,
            inputText: item.inputText,
            kpiNote: item.kpiNote,
        },
        template: {
            id: template.id,
            name: template.name,
            format: template.format,
            config,
            steps,
        },
        assets: item.assets.map((entry) => ({
            id: entry.asset.id,
            fileName: entry.asset.fileName,
            type: entry.asset.type,
            filePath: entry.asset.filePath,
            role: entry.role,
            notes: entry.notes,
            metadata: safeJsonParse<Record<string, unknown>>(entry.asset.metadata || "{}", {}),
        })),
        references: item.references.map((ref) => ({
            id: ref.id,
            label: ref.label,
            url: ref.url,
            notes: ref.notes,
        })),
    });

    const jobRun = await prisma.jobRun.create({
        data: {
            itemId: item.id,
            templateId: template.id,
            status: "queued",
            inputSnapshot: JSON.stringify(snapshot),
            log: "",
        },
    });

    await executeJobRun(jobRun.id);

    revalidatePath(`/production-os/items/${item.id}`);
    revalidatePath("/production-os");
}

export async function rerunJobRun(formData: FormData) {
    const jobRunId = String(formData.get("jobRunId") || "");
    if (!jobRunId) return;

    const previous = await prisma.jobRun.findUnique({ where: { id: jobRunId } });
    if (!previous) return;

    const rerun = await prisma.jobRun.create({
        data: {
            itemId: previous.itemId,
            templateId: previous.templateId,
            status: "queued",
            inputSnapshot: previous.inputSnapshot,
            log: "",
            replayOfJobRunId: previous.id,
        },
    });

    await executeJobRun(rerun.id);

    revalidatePath(`/production-os/items/${previous.itemId}`);
    revalidatePath("/production-os");
}
