'use client';

import { useState } from 'react';
import { parseToolUsage } from '@/lib/ai-tool-usage';

interface Episode {
    id: string;
    episodeNumber: number | null;
    title: string;
    synopsis: string | null;
    status: string;
    createdAt: Date;
    series: {
        title: string;
        worldBible: {
            visualStyle: string;
            audioStyle: string;
        } | null;
    };
    decisionLog: {
        editorialIntent: string;
        differentiationPoints: string | null;
        humanContributions: string;
        aiToolUsage: string;
    } | null;
    episodeAssets: {
        asset: {
            fileName: string;
            type: string;
            source: string;
            generationParams: string;
        };
        role: string | null;
        orderIndex: number;
    }[];
}

interface Props {
    episodeId: string;
    seriesId: string;
    disabled: boolean;
    episode: Episode;
}

export default function ExportButton({ episodeId, seriesId, disabled, episode }: Props) {
    const [exporting, setExporting] = useState(false);
    const [exported, setExported] = useState(false);

    const handleExport = async () => {
        if (disabled) return;

        setExporting(true);
        try {
            // Prepare export data
            const exportData = {
                metadata: {
                    series: episode.series.title,
                    episode: episode.episodeNumber,
                    title: episode.title,
                    synopsis: episode.synopsis,
                    status: episode.status,
                    createdAt: episode.createdAt,
                    exportedAt: new Date().toISOString(),
                },
                decisionLog: episode.decisionLog ? {
                    editorialIntent: episode.decisionLog.editorialIntent,
                    differentiationPoints: episode.decisionLog.differentiationPoints,
                    humanContributions: episode.decisionLog.humanContributions,
                    aiToolUsage: parseToolUsage(episode.decisionLog.aiToolUsage).data,
                } : null,
                assetManifest: {
                    totalAssets: episode.episodeAssets.length,
                    assets: episode.episodeAssets.map(({ asset, role, orderIndex }) => ({
                        fileName: asset.fileName,
                        type: asset.type,
                        source: asset.source,
                        role,
                        orderIndex,
                        generationParams: asset.source !== 'manual' ? JSON.parse(asset.generationParams) : null,
                    })),
                },
                worldBible: episode.series.worldBible ? {
                    visualStyle: JSON.parse(episode.series.worldBible.visualStyle),
                    audioStyle: JSON.parse(episode.series.worldBible.audioStyle),
                } : null,
                compliance: {
                    hasDecisionLog: !!episode.decisionLog,
                    aiToolsUsed: Array.from(new Set(episode.episodeAssets
                        .filter(ea => ea.asset.source !== 'manual')
                        .map(ea => ea.asset.source))),
                    humanContributionLength: episode.decisionLog?.humanContributions.length || 0,
                    exportTimestamp: new Date().toISOString(),
                },
            };

            // Create and download JSON file
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `EP${episode.episodeNumber ?? 'Draft'}_${episode.title.replace(/[^a-zA-Z0-9]/g, '_')}_export.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setExported(true);
            setTimeout(() => setExported(false), 3000);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <button
                onClick={handleExport}
                disabled={disabled || exporting}
                className={`btn ${disabled ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-primary'} w-full py-3`}
            >
                {exporting ? '⏳ エクスポート中...' : exported ? '✓ エクスポート完了！' : '📥 JSONエクスポートを実行'}
            </button>

            {disabled && (
                <p className="text-xs text-center text-[var(--muted)]">
                    Decision Logを完成させてください
                </p>
            )}

            {exported && (
                <p className="text-xs text-center text-green-400">
                    ダウンロードフォルダにエクスポートファイルが保存されました
                </p>
            )}
        </div>
    );
}
