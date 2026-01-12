import path from "path";
import fs from "fs/promises";
import { spawn } from "child_process";

const PROJECT_ROOT = process.cwd();
const THUMBNAIL_RELATIVE_DIR = path.posix.join("data", "assets", "thumbnails");
const THUMBNAIL_DIR = path.join(PROJECT_ROOT, THUMBNAIL_RELATIVE_DIR);

const resolveAssetPath = (filePath?: string | null): string | null => {
    if (!filePath || typeof filePath !== "string") return null;
    const trimmed = filePath.trim();
    if (!trimmed) return null;
    if (/^(https?:|s3:)/i.test(trimmed)) return null;

    const candidates: string[] = [];
    if (path.isAbsolute(trimmed)) {
        candidates.push(path.resolve(trimmed));
        candidates.push(path.resolve(PROJECT_ROOT, trimmed.replace(/^\/+/, "")));
    } else {
        candidates.push(path.resolve(PROJECT_ROOT, trimmed.replace(/^\/+/, "")));
    }

    for (const candidate of candidates) {
        const relative = path.relative(PROJECT_ROOT, candidate);
        if (relative.startsWith("..") || path.isAbsolute(relative)) continue;
        return candidate;
    }

    return null;
};

const runFfmpeg = (inputPath: string, outputPath: string) => {
    return new Promise<void>((resolve, reject) => {
        const args = ["-y", "-ss", "1", "-i", inputPath, "-frames:v", "1", "-q:v", "2", outputPath];
        const processRef = spawn("ffmpeg", args, { stdio: "ignore" });
        processRef.on("error", reject);
        processRef.on("close", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`ffmpeg exited with code ${code}`));
            }
        });
    });
};

export async function createVideoThumbnail(
    assetId: string,
    filePath: string | null | undefined
) {
    const inputPath = resolveAssetPath(filePath);
    if (!inputPath) return null;

    await fs.mkdir(THUMBNAIL_DIR, { recursive: true });
    const fileName = `${assetId}.jpg`;
    const outputPath = path.join(THUMBNAIL_DIR, fileName);

    try {
        await runFfmpeg(inputPath, outputPath);
    } catch (error) {
        console.warn("Failed to generate thumbnail:", error);
        return null;
    }

    return path.posix.join(THUMBNAIL_RELATIVE_DIR, fileName);
}
