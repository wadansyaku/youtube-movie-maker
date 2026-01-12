'use server';

import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir } from 'fs/promises';
import { join, posix } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createVideoThumbnail } from '@/lib/video-thumbnails';

// ============================================
// Asset Actions
// ============================================

const ASSETS_RELATIVE_DIR = posix.join('data', 'assets');
const ASSETS_DIR = join(process.cwd(), ASSETS_RELATIVE_DIR);

async function ensureAuth() {
    await requireUser();
}

export async function createAsset(formData: FormData) {
    await ensureAuth();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const source = formData.get('source') as string || 'manual';
    const generationParams = formData.get('generationParams') as string || '{}';
    const metadata = formData.get('metadata') as string || '{}';

    const parseJson = (value: string) => {
        try {
            const parsed = JSON.parse(value);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch {
            return {};
        }
    };

    if (!file) {
        throw new Error('ファイルが必要です');
    }

    // Ensure assets directory exists
    await mkdir(ASSETS_DIR, { recursive: true });

    // Generate unique filename
    const ext = file.name.split('.').pop();
    const uniqueName = `${uuidv4()}.${ext}`;
    const filePath = join(ASSETS_DIR, uniqueName);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Determine type from extension if not provided
    let assetType = type;
    if (!assetType) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (['mp4', 'mov', 'webm', 'avi'].includes(ext || '')) assetType = 'video';
        else if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '')) assetType = 'audio';
        else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) assetType = 'image';
        else assetType = 'other';
    }

    const metadataObj = parseJson(metadata);
    const asset = await prisma.asset.create({
        data: {
            type: assetType,
            fileName: file.name,
            filePath: posix.join(ASSETS_RELATIVE_DIR, uniqueName),
            fileSize: file.size,
            mimeType: file.type,
            source,
            generationParams,
            metadata: JSON.stringify(metadataObj),
        },
    });

    if (assetType === 'video') {
        const thumbnailPath = await createVideoThumbnail(asset.id, asset.filePath);
        if (thumbnailPath) {
            await prisma.asset.update({
                where: { id: asset.id },
                data: {
                    metadata: JSON.stringify({
                        ...metadataObj,
                        thumbnailPath,
                    }),
                },
            });
        }
    }

    revalidatePath('/assets');
    return asset;
}

export async function deleteAsset(id: string) {
    await ensureAuth();
    await prisma.asset.delete({
        where: { id },
    });
    revalidatePath('/assets');
}

export async function addTagToAsset(assetId: string, tagName: string) {
    await ensureAuth();
    // Find or create tag
    let tag = await prisma.tag.findUnique({
        where: { name: tagName },
    });

    if (!tag) {
        tag = await prisma.tag.create({
            data: { name: tagName },
        });
    }

    // Create association
    await prisma.assetTag.upsert({
        where: {
            assetId_tagId: { assetId, tagId: tag.id },
        },
        create: { assetId, tagId: tag.id },
        update: {},
    });

    revalidatePath('/assets');
}

export async function removeTagFromAsset(assetId: string, tagId: string) {
    await ensureAuth();
    await prisma.assetTag.delete({
        where: {
            assetId_tagId: { assetId, tagId },
        },
    });
    revalidatePath('/assets');
}

export async function linkAssetToEpisode(
    assetId: string,
    episodeId: string,
    role: string,
    orderIndex: number
) {
    await ensureAuth();
    await prisma.episodeAsset.upsert({
        where: {
            episodeId_assetId: { episodeId, assetId },
        },
        create: { episodeId, assetId, role, orderIndex },
        update: { role, orderIndex },
    });

    const episode = await prisma.productionEpisode.findUnique({
        where: { id: episodeId },
    });

    if (episode) {
        revalidatePath(`/series/${episode.seriesId}/episodes/${episodeId}`);
    }
    revalidatePath('/assets');
}

export async function unlinkAssetFromEpisode(assetId: string, episodeId: string) {
    await ensureAuth();
    await prisma.episodeAsset.delete({
        where: {
            episodeId_assetId: { episodeId, assetId },
        },
    });

    const episode = await prisma.productionEpisode.findUnique({
        where: { id: episodeId },
    });

    if (episode) {
        revalidatePath(`/series/${episode.seriesId}/episodes/${episodeId}`);
    }
    revalidatePath('/assets');
}
