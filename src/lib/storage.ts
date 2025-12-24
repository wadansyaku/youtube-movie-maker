import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// S3-compatible storage client
// Works with AWS S3, Cloudflare R2, MinIO, etc.
const s3Client = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "creativeflow-assets";

export interface UploadResult {
    key: string;
    url: string;
    size: number;
    contentType: string;
}

/**
 * Generate a unique file key with optional prefix
 */
export function generateFileKey(
    fileName: string,
    prefix?: string
): string {
    const ext = fileName.split(".").pop() || "";
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    const sanitizedName = fileName
        .replace(/[^a-zA-Z0-9.-]/g, "_")
        .toLowerCase();

    const parts = [prefix, `${timestamp}_${uniqueId}`, sanitizedName].filter(Boolean);
    return parts.join("/");
}

/**
 * Upload a file to S3-compatible storage
 */
export async function uploadFile(
    file: Buffer,
    fileName: string,
    contentType: string,
    prefix?: string
): Promise<UploadResult> {
    const key = generateFileKey(fileName, prefix);

    await s3Client.send(
        new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: file,
            ContentType: contentType,
            CacheControl: "public, max-age=31536000",
        })
    );

    const url = await getSignedDownloadUrl(key);

    return {
        key,
        url,
        size: file.length,
        contentType,
    };
}

/**
 * Get a signed URL for downloading a file
 */
export async function getSignedDownloadUrl(
    key: string,
    expiresIn: number = 3600
): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Get a signed URL for uploading a file directly from the client
 */
export async function getSignedUploadUrl(
    fileName: string,
    contentType: string,
    prefix?: string,
    expiresIn: number = 3600
): Promise<{ key: string; uploadUrl: string }> {
    const key = generateFileKey(fileName, prefix);

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

    return { key, uploadUrl };
}

/**
 * Delete a file from storage
 */
export async function deleteFile(key: string): Promise<void> {
    await s3Client.send(
        new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        })
    );
}

/**
 * Get content type from file extension
 */
export function getContentType(fileName: string): string {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
        // Video
        mp4: "video/mp4",
        webm: "video/webm",
        mov: "video/quicktime",
        avi: "video/x-msvideo",
        mkv: "video/x-matroska",
        // Audio
        mp3: "audio/mpeg",
        wav: "audio/wav",
        ogg: "audio/ogg",
        m4a: "audio/mp4",
        flac: "audio/flac",
        // Image
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        svg: "image/svg+xml",
        // Other
        json: "application/json",
        pdf: "application/pdf",
        zip: "application/zip",
    };

    return contentTypes[ext || ""] || "application/octet-stream";
}

/**
 * Validate file type against allowed types
 */
export function validateFileType(
    fileName: string,
    allowedTypes: ("video" | "audio" | "image")[]
): boolean {
    const ext = fileName.split(".").pop()?.toLowerCase();

    const typeMapping: Record<string, "video" | "audio" | "image"> = {
        mp4: "video",
        webm: "video",
        mov: "video",
        avi: "video",
        mkv: "video",
        mp3: "audio",
        wav: "audio",
        ogg: "audio",
        m4a: "audio",
        flac: "audio",
        jpg: "image",
        jpeg: "image",
        png: "image",
        gif: "image",
        webp: "image",
    };

    const fileType = typeMapping[ext || ""];
    return fileType ? allowedTypes.includes(fileType) : false;
}

/**
 * Get asset type from file extension
 */
export function getAssetType(fileName: string): "video" | "audio" | "image" | "slides" | "other" {
    const ext = fileName.split(".").pop()?.toLowerCase();

    const videoExts = ["mp4", "webm", "mov", "avi", "mkv"];
    const audioExts = ["mp3", "wav", "ogg", "m4a", "flac"];
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
    const slideExts = ["zip"];

    if (videoExts.includes(ext || "")) return "video";
    if (audioExts.includes(ext || "")) return "audio";
    if (imageExts.includes(ext || "")) return "image";
    if (slideExts.includes(ext || "")) return "slides";
    return "other";
}
