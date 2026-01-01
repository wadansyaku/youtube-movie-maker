'use server';

import { prisma } from '@/lib/db';
import { parseToolUsage, serializeToolUsage } from '@/lib/ai-tool-usage';
import { requireUser } from '@/lib/auth-guard';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// ============================================
// Series Actions
// ============================================

async function ensureAuth() {
    await requireUser();
}

export async function createSeries(formData: FormData) {
    await ensureAuth();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    if (!title || title.trim().length === 0) {
        throw new Error('タイトルは必須です');
    }

    const series = await prisma.series.create({
        data: {
            title: title.trim(),
            description: description?.trim() || null,
            worldBible: {
                create: {
                    visualStyle: JSON.stringify({
                        colorPalette: ['#1a1a2e', '#16213e', '#0f3460', '#e94560'],
                        lightingStyle: 'cinematic',
                        cameraStyle: 'dynamic',
                        aspectRatio: '16:9',
                    }),
                    audioStyle: JSON.stringify({
                        genre: 'ambient',
                        tempo: 'moderate',
                        mood: 'atmospheric',
                    }),
                    characters: '[]',
                    settings: '[]',
                    rules: JSON.stringify({
                        mustInclude: [],
                        mustAvoid: [],
                        styleGuidelines: [],
                    }),
                },
            },
        },
    });

    revalidatePath('/');
    revalidatePath('/series');
    redirect(`/series/${series.id}`);
}

export async function updateSeries(id: string, formData: FormData) {
    await ensureAuth();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const status = formData.get('status') as string;

    if (!title || title.trim().length === 0) {
        throw new Error('タイトルは必須です');
    }

    await prisma.series.update({
        where: { id },
        data: {
            title: title.trim(),
            description: description?.trim() || null,
            status: status || 'draft',
        },
    });

    revalidatePath('/');
    revalidatePath('/series');
    revalidatePath(`/series/${id}`);
}

export async function deleteSeries(id: string) {
    await ensureAuth();
    await prisma.series.delete({
        where: { id },
    });

    revalidatePath('/');
    revalidatePath('/series');
    redirect('/series');
}

// ============================================
// World Bible Actions
// ============================================

export async function updateWorldBible(seriesId: string, formData: FormData) {
    await ensureAuth();
    const visualStyle = formData.get('visualStyle') as string;
    const audioStyle = formData.get('audioStyle') as string;
    const characters = formData.get('characters') as string;
    const settings = formData.get('settings') as string;
    const rules = formData.get('rules') as string;

    await prisma.worldBible.update({
        where: { seriesId },
        data: {
            visualStyle: visualStyle || '{}',
            audioStyle: audioStyle || '{}',
            characters: characters || '[]',
            settings: settings || '[]',
            rules: rules || '{}',
        },
    });

    revalidatePath(`/series/${seriesId}`);
    revalidatePath(`/series/${seriesId}/world-bible`);
}

// ============================================
// Episode Actions
// ============================================

export async function createEpisode(seriesId: string, formData: FormData) {
    await ensureAuth();
    const title = formData.get('title') as string;
    const synopsis = formData.get('synopsis') as string;

    if (!title || title.trim().length === 0) {
        throw new Error('タイトルは必須です');
    }

    // Get next episode number
    const lastEpisode = await prisma.productionEpisode.findFirst({
        where: {
            seriesId,
            episodeNumber: { not: null },
        },
        orderBy: { episodeNumber: 'desc' },
    });
    const episodeNumber = (lastEpisode?.episodeNumber || 0) + 1;

    const episode = await prisma.productionEpisode.create({
        data: {
            seriesId,
            episodeNumber,
            title: title.trim(),
            synopsis: synopsis?.trim() || null,
            status: 'scripting',
        },
    });

    revalidatePath(`/series/${seriesId}`);
    redirect(`/series/${seriesId}/episodes/${episode.id}`);
}

export async function createEpisodeIdea(seriesId: string, formData: FormData) {
    await ensureAuth();
    const title = formData.get('title') as string;
    const synopsis = formData.get('synopsis') as string;

    if (!title || title.trim().length === 0) {
        throw new Error('タイトルは必須です');
    }

    await prisma.idea.create({
        data: {
            seriesId,
            title: title.trim(),
            description: synopsis?.trim() || null,
            status: 'backlog',
            tags: '[]',
        },
    });

    revalidatePath(`/series/${seriesId}`);
}

export async function convertEpisodeIdea(ideaId: string, seriesId: string) {
    await ensureAuth();

    const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
    if (!idea) {
        throw new Error('Idea not found');
    }

    const lastEpisode = await prisma.productionEpisode.findFirst({
        where: {
            seriesId,
            episodeNumber: { not: null },
        },
        orderBy: { episodeNumber: 'desc' },
    });
    const episodeNumber = (lastEpisode?.episodeNumber || 0) + 1;

    await prisma.productionEpisode.create({
        data: {
            seriesId,
            episodeNumber,
            ideaId: idea.id,
            title: idea.title,
            synopsis: idea.description,
            status: 'scripting',
            lane: idea.lane || null,
        },
    });

    await prisma.idea.update({
        where: { id: idea.id },
        data: { status: 'selected' },
    });

    revalidatePath(`/series/${seriesId}`);
}

export async function updateEpisode(id: string, formData: FormData) {
    await ensureAuth();
    const title = formData.get('title') as string;
    const synopsis = formData.get('synopsis') as string;
    const status = formData.get('status') as string;

    const episode = await prisma.productionEpisode.update({
        where: { id },
        data: {
            title: title?.trim(),
            synopsis: synopsis?.trim() || null,
            status: status || 'scripting',
        },
    });

    if (episode.seriesId) {
        revalidatePath(`/series/${episode.seriesId}`);
        revalidatePath(`/series/${episode.seriesId}/episodes/${id}`);
    }
}

export async function deleteEpisode(id: string, seriesId: string) {
    await ensureAuth();
    await prisma.productionEpisode.delete({
        where: { id },
    });

    revalidatePath(`/series/${seriesId}`);
    redirect(`/series/${seriesId}`);
}
// ============================================
// Decision Log Actions
// ============================================

export async function saveDecisionLog(episodeId: string, formData: FormData) {
    await ensureAuth();
    const editorialIntent = formData.get('editorialIntent') as string;
    const differentiationPoints = formData.get('differentiationPoints') as string;
    const humanContributions = formData.get('humanContributions') as string;
    const aiToolUsage = formData.get('aiToolUsage') as string;

    // Validation
    if (!editorialIntent || editorialIntent.length < 50) {
        throw new Error('編集意図は50文字以上で入力してください');
    }
    if (!humanContributions || humanContributions.length < 100) {
        throw new Error('人間の貢献は100文字以上で入力してください');
    }

    const toolUsageParsed = parseToolUsage(aiToolUsage);
    if (toolUsageParsed.issue === 'invalid_json') {
        throw new Error('AIツール使用記録のJSONが不正です');
    }
    const normalizedToolUsage = serializeToolUsage(toolUsageParsed.data);

    const episode = await prisma.productionEpisode.findUnique({
        where: { id: episodeId },
        include: { decisionLog: true },
    });

    if (!episode) throw new Error('Episode not found');

    if (episode.decisionLog) {
        await prisma.decisionLog.update({
            where: { episodeId },
            data: {
                editorialIntent,
                differentiationPoints: differentiationPoints || null,
                humanContributions,
                aiToolUsage: normalizedToolUsage,
            },
        });
    } else {
        await prisma.decisionLog.create({
            data: {
                episodeId,
                editorialIntent,
                differentiationPoints: differentiationPoints || null,
                humanContributions,
                aiToolUsage: normalizedToolUsage,
            },
        });
    }

    revalidatePath(`/series/${episode.seriesId}/episodes/${episodeId}`);
}

// ============================================
// PromptPack Actions
// ============================================

export async function createPromptPack(seriesId: string, formData: FormData) {
    await ensureAuth();
    const name = formData.get('name') as string;
    const category = formData.get('category') as string;

    if (!name || name.trim().length === 0) {
        throw new Error('名前は必須です');
    }

    const promptPack = await prisma.promptPack.create({
        data: {
            seriesId,
            name: name.trim(),
            category: category || 'general',
        },
    });

    revalidatePath(`/series/${seriesId}/prompt-packs`);
    return promptPack;
}

export async function addPrompt(promptPackId: string, formData: FormData) {
    await ensureAuth();
    const type = formData.get('type') as string;
    const name = formData.get('name') as string;
    const content = formData.get('content') as string;
    const variables = formData.get('variables') as string;

    const prompt = await prisma.prompt.create({
        data: {
            promptPackId,
            type: type || 'general',
            name: name?.trim() || 'Untitled',
            content: content || '',
            variables: variables || '{}',
        },
    });

    const promptPack = await prisma.promptPack.findUnique({
        where: { id: promptPackId },
    });

    if (promptPack) {
        revalidatePath(`/series/${promptPack.seriesId}/prompt-packs`);
    }

    return prompt;
}

export async function deletePromptPack(id: string, seriesId: string) {
    await ensureAuth();
    await prisma.promptPack.delete({
        where: { id },
    });

    revalidatePath(`/series/${seriesId}/prompt-packs`);
}
