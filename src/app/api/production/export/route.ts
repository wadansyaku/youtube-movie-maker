import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/production/export - Export episode data in various formats
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { episodeId, format, options } = body;

        if (!episodeId || !format) {
            return NextResponse.json(
                { error: 'episodeId and format are required' },
                { status: 400 }
            );
        }

        const episode = await prisma.productionEpisode.findUnique({
            where: { id: episodeId },
            include: {
                sources: true,
                generationPrompts: true,
            },
        });

        if (!episode) {
            return NextResponse.json(
                { error: 'Episode not found' },
                { status: 404 }
            );
        }

        let content = '';
        let filename = '';
        let mimeType = 'text/plain';

        const scriptContent = JSON.parse(episode.scriptContent);
        const ttsDictionary = JSON.parse(episode.ttsDictionary);
        const youtubeTags = JSON.parse(episode.youtubeTags);

        switch (format) {
            case 'script':
                // 台本.txt
                filename = `${episode.title}_台本.txt`;
                content = generateScriptExport(episode, scriptContent);
                break;

            case 'tts':
                // TTS用.txt (with optional dictionary header)
                filename = `${episode.title}_TTS.txt`;
                content = generateTTSExport(episode, ttsDictionary, options?.includeDictionary ?? true);
                break;

            case 'capcut':
                // CapCut編集メモ.md
                filename = `${episode.title}_CapCutメモ.md`;
                content = generateCapCutExport(episode, scriptContent);
                mimeType = 'text/markdown';
                break;

            case 'youtube_description':
                // YouTube説明文.txt
                filename = `${episode.title}_説明文.txt`;
                content = generateYouTubeDescriptionExport(episode, youtubeTags);
                break;

            case 'csv_sources':
                // Sources CSV
                filename = `${episode.title}_参考資料.csv`;
                content = generateSourcesCSV(episode);
                mimeType = 'text/csv';
                break;

            default:
                return NextResponse.json(
                    { error: `Unknown format: ${format}` },
                    { status: 400 }
                );
        }

        return NextResponse.json({
            filename,
            mimeType,
            content,
        });
    } catch (error) {
        console.error('Error exporting:', error);
        return NextResponse.json(
            { error: 'Failed to export' },
            { status: 500 }
        );
    }
}

// Helper functions for export generation

interface EpisodeData {
    title: string;
    variant: string;
    lane: string | null;
    targetAudience: string | null;
    targetDuration: number | null;
    purposeStatement: string | null;
    hookScript: string | null;
    ctaScript: string | null;
    pinnedComment: string | null;
    ttsText: string | null;
    slideOutline: string | null;
    youtubeTitle: string | null;
    youtubeDescription: string | null;
    sources: Array<{ type: string; title: string | null; url: string | null; notes: string | null }>;
}

function generateScriptExport(episode: EpisodeData, scriptContent: Record<string, unknown>): string {
    const lines: string[] = [];

    lines.push(`# ${episode.title}`);
    lines.push(`バリアント: ${episode.variant === 'long' ? '長尺' : 'Shorts'}`);
    const laneLabel = episode.lane === 'med_bio'
        ? 'Med/Bio解説'
        : episode.lane === 'ai_news'
            ? 'AIニュース'
            : '未分類';
    lines.push(`レーン: ${laneLabel}`);
    lines.push('');

    if (episode.targetAudience) {
        lines.push(`対象: ${episode.targetAudience}`);
    }
    if (episode.targetDuration) {
        const mins = Math.floor(episode.targetDuration / 60);
        const secs = episode.targetDuration % 60;
        lines.push(`想定尺: ${mins}:${secs.toString().padStart(2, '0')}`);
    }
    if (episode.purposeStatement) {
        lines.push(`目的: ${episode.purposeStatement}`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');

    // Hook
    if (episode.hookScript) {
        lines.push('## フック (0:00-0:15)');
        lines.push(episode.hookScript);
        lines.push('');
    }

    // Main script content
    if (scriptContent && typeof scriptContent === 'object') {
        const structure = (scriptContent as Record<string, unknown>).structure as Array<{ section: string; content?: string }> | undefined;
        if (structure && Array.isArray(structure)) {
            for (const section of structure) {
                lines.push(`## ${section.section}`);
                lines.push(section.content || '(内容未入力)');
                lines.push('');
            }
        }
    }

    // CTA
    if (episode.ctaScript) {
        lines.push('## CTA');
        lines.push(episode.ctaScript);
        lines.push('');
    }

    // Pinned comment
    if (episode.pinnedComment) {
        lines.push('---');
        lines.push('## 固定コメント案');
        lines.push(episode.pinnedComment);
    }

    return lines.join('\n');
}

function generateTTSExport(
    episode: EpisodeData,
    dictionary: Array<{ term: string; reading: string }>,
    includeDictionary: boolean
): string {
    const lines: string[] = [];

    if (includeDictionary && dictionary && dictionary.length > 0) {
        lines.push('【読み辞書】');
        for (const entry of dictionary) {
            lines.push(`${entry.term} → ${entry.reading}`);
        }
        lines.push('');
        lines.push('---');
        lines.push('');
    }

    lines.push('【TTS原稿】');
    lines.push('');

    if (episode.ttsText) {
        lines.push(episode.ttsText);
    } else {
        // Fallback to hook + script
        if (episode.hookScript) {
            lines.push(episode.hookScript);
            lines.push('');
        }
    }

    return lines.join('\n');
}

function generateCapCutExport(episode: EpisodeData, scriptContent: Record<string, unknown>): string {
    const lines: string[] = [];

    lines.push(`# CapCut編集メモ: ${episode.title}`);
    lines.push('');
    lines.push('## 基本情報');
    lines.push(`- バリアント: ${episode.variant === 'long' ? '長尺' : 'Shorts'}`);
    if (episode.targetDuration) {
        const mins = Math.floor(episode.targetDuration / 60);
        const secs = episode.targetDuration % 60;
        lines.push(`- 目標尺: ${mins}:${secs.toString().padStart(2, '0')}`);
    }
    lines.push('');

    lines.push('## カット割り');
    lines.push('');

    // Script structure as cuts
    if (scriptContent?.structure && Array.isArray(scriptContent.structure)) {
        const structure = scriptContent.structure as Array<{ section: string; time?: string; description?: string }>;
        for (const section of structure) {
            lines.push(`### ${section.section} ${section.time || ''}`);
            lines.push(`- 内容: ${section.description || '(要確認)'}`);
            lines.push('- 字幕: ');
            lines.push('- 挿絵/スライド: ');
            lines.push('');
        }
    }

    lines.push('## スライド/図解構成');
    if (episode.slideOutline) {
        lines.push(episode.slideOutline);
    } else {
        lines.push('(未設定)');
    }
    lines.push('');

    lines.push('## 音楽/効果音');
    lines.push('- BGM: ');
    lines.push('- 効果音: ');

    return lines.join('\n');
}

function generateYouTubeDescriptionExport(episode: EpisodeData, youtubeTags: string[]): string {
    const lines: string[] = [];

    // Title suggestion
    if (episode.youtubeTitle) {
        lines.push(`【タイトル案】${episode.youtubeTitle}`);
        lines.push('');
        lines.push('---');
        lines.push('');
    }

    // Description
    if (episode.youtubeDescription) {
        lines.push(episode.youtubeDescription);
    } else {
        lines.push(`${episode.title}について解説します。`);
    }
    lines.push('');

    // Sources as references
    if (episode.sources && episode.sources.length > 0) {
        lines.push('📚 参考資料');
        for (const source of episode.sources) {
            if (source.url) {
                lines.push(`- ${source.title || 'リンク'}: ${source.url}`);
            }
        }
        lines.push('');
    }

    // Tags
    if (youtubeTags && youtubeTags.length > 0) {
        lines.push('---');
        lines.push(youtubeTags.map((t: string) => `#${t}`).join(' '));
    }

    return lines.join('\n');
}

function generateSourcesCSV(episode: EpisodeData): string {
    const lines: string[] = [];
    lines.push('type,title,url,notes');

    for (const source of episode.sources) {
        const row = [
            source.type,
            `"${(source.title || '').replace(/"/g, '""')}"`,
            source.url || '',
            `"${(source.notes || '').replace(/"/g, '""')}"`,
        ];
        lines.push(row.join(','));
    }

    return lines.join('\n');
}
