import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { prisma } from "@/lib/db";
import { createRenderJob, updateRenderJob } from "@/lib/remotion/render-queue";
import { VideoConfig } from "@/remotion/types/video";
import { createVideoThumbnail } from "@/lib/video-thumbnails";

export const runtime = "nodejs";

type RenderRequest = {
    config: VideoConfig;
};

const getEntryPoint = () => path.join(process.cwd(), "src", "remotion", "index.ts");

const loadBundler = () => import(/* webpackIgnore: true */ "@remotion/bundler");
const loadRenderer = () => import(/* webpackIgnore: true */ "@remotion/renderer");

const ensureDir = async (dir: string) => {
    await fs.mkdir(dir, { recursive: true });
};

const slugify = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);

const renderVideo = async (jobId: string, config: VideoConfig) => {
    try {
        await updateRenderJob(jobId, { status: "rendering", progress: 0, message: "準備中" });

        const bundler = await loadBundler();
        const renderer = await loadRenderer();

        const serveUrl = await bundler.bundle({
            entryPoint: getEntryPoint(),
        });

        const composition = await renderer.selectComposition({
            serveUrl,
            id: "MedicalShorts",
            inputProps: config,
        });

        const fps = composition.fps || 30;
        const durationInFrames = Math.max(1, Math.round((config.duration || 1) * fps));
        const outputDir = path.join(process.cwd(), "data", "assets", "renders");
        await ensureDir(outputDir);

        const safeTitle = slugify(config.title || "shorts");
        const fileName = `${safeTitle || "shorts"}-${Date.now()}.mp4`;
        const outputPath = path.join(outputDir, fileName);
        const relativePath = path.posix.join("data", "assets", "renders", fileName);

        await updateRenderJob(jobId, { message: "動画作成中" });

        let lastProgress = -1;
        await renderer.renderMedia({
            composition: {
                ...composition,
                durationInFrames,
            },
            serveUrl,
            codec: "h264",
            outputLocation: outputPath,
            inputProps: config,
            onProgress: (progress) => {
                const percent = Math.round(progress.progress * 100);
                if (percent === lastProgress) return;
                lastProgress = percent;
                void updateRenderJob(jobId, { progress: percent });
            },
        });

        const stats = await fs.stat(outputPath);

        const metadata = {
            kind: "shorts-render",
            title: config.title,
            themeLabel: config.themeLabel,
        };
        const asset = await prisma.asset.create({
            data: {
                type: "video",
                fileName,
                filePath: relativePath,
                source: "remotion",
                fileSize: stats.size,
                mimeType: "video/mp4",
                metadata: JSON.stringify(metadata),
                generationParams: JSON.stringify({
                    inputProps: config,
                }),
                status: "active",
                version: 1,
            },
        });

        const thumbnailPath = await createVideoThumbnail(asset.id, asset.filePath);
        if (thumbnailPath) {
            await prisma.asset.update({
                where: { id: asset.id },
                data: {
                    metadata: JSON.stringify({
                        ...metadata,
                        thumbnailPath,
                    }),
                },
            });
        }

        await updateRenderJob(jobId, {
            status: "completed",
            progress: 100,
            assetId: asset.id,
            filePath: relativePath,
            message: "完了",
        });
    } catch (error) {
        console.error("Render failed:", error);
        try {
            await updateRenderJob(jobId, {
                status: "failed",
                error: error instanceof Error ? error.message : "動画作成に失敗しました",
            });
        } catch (updateError) {
            console.error("Failed to update render job status:", updateError);
        }
    }
};

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as RenderRequest;
        const config = body?.config;

        if (!config) {
            return NextResponse.json({ error: "config is required" }, { status: 400 });
        }

        const job = await createRenderJob();
        void renderVideo(job.id, config);

        return NextResponse.json({ jobId: job.id });
    } catch (error) {
        console.error("Failed to start render:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to start render" },
            { status: 500 }
        );
    }
}
