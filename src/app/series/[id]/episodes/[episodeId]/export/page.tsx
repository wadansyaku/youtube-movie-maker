import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { parseToolUsage } from '@/lib/ai-tool-usage';
import ExportButton from '@/components/export/ExportButton';

interface Props {
    params: Promise<{ id: string; episodeId: string }>;
}

async function getEpisodeForExport(episodeId: string) {
    return prisma.productionEpisode.findUnique({
        where: { id: episodeId },
        include: {
            series: {
                include: { worldBible: true },
            },
            decisionLog: true,
            episodeAssets: {
                include: {
                    asset: {
                        include: {
                            assetTags: { include: { tag: true } },
                        },
                    },
                },
                orderBy: { orderIndex: 'asc' },
            },
        },
    });
}

export default async function ExportPage({ params }: Props) {
    const { id, episodeId } = await params;
    const episode = await getEpisodeForExport(episodeId);

    if (!episode) {
        notFound();
    }
    if (!episode.series) {
        notFound();
    }

    const series = episode.series;
    const exportEpisode = {
        ...episode,
        series,
    };

    const hasDecisionLog = !!episode.decisionLog;
    const hasAssets = episode.episodeAssets.length > 0;
    const decisionLogComplete = episode.decisionLog &&
        episode.decisionLog.editorialIntent.length >= 50 &&
        episode.decisionLog.humanContributions.length >= 100;

    const allChecksPass = hasDecisionLog && decisionLogComplete;

    return (
        <div className="p-8 animate-fade-in max-w-3xl">
            {/* Breadcrumb */}
            <div className="text-sm text-[var(--muted)] mb-4">
                <Link href="/series" className="hover:text-white">シリーズ</Link>
                <span className="mx-2">/</span>
                <Link href={`/series/${id}`} className="hover:text-white">{series.title}</Link>
                <span className="mx-2">/</span>
                <Link href={`/series/${id}/episodes/${episodeId}`} className="hover:text-white">
                    EP{episode.episodeNumber ?? "—"}
                </Link>
                <span className="mx-2">/</span>
                <span>エクスポート</span>
            </div>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <span>📤</span> YouTube投稿準備
                </h1>
                <p className="text-[var(--muted)] mt-1">
                    EP{episode.episodeNumber ?? "—"}: {episode.title}
                </p>
            </div>

            {/* Compliance Checklist */}
            <div className="card p-5 mb-6">
                <h2 className="font-semibold mb-4">✅ コンプライアンスチェック</h2>
                <div className="space-y-3">
                    <div className={`flex items-center gap-3 ${hasDecisionLog ? 'text-green-400' : 'text-accent-400'}`}>
                        <span>{hasDecisionLog ? '✓' : '○'}</span>
                        <span>Decision Log 作成済み</span>
                    </div>
                    <div className={`flex items-center gap-3 ${decisionLogComplete ? 'text-green-400' : 'text-accent-400'}`}>
                        <span>{decisionLogComplete ? '✓' : '○'}</span>
                        <span>編集意図 (50文字以上) + 人間の貢献 (100文字以上)</span>
                    </div>
                    <div className={`flex items-center gap-3 ${hasAssets ? 'text-green-400' : 'text-[var(--muted)]'}`}>
                        <span>{hasAssets ? '✓' : '−'}</span>
                        <span>素材登録済み ({episode.episodeAssets.length}件)</span>
                    </div>
                </div>

                {!allChecksPass && (
                    <div className="mt-4 bg-accent-900/20 border border-accent-800/50 rounded-lg p-3 text-sm">
                        <strong className="text-accent-400">⚠️ 必須項目が未完了</strong>
                        <p className="text-[var(--muted)] mt-1">
                            Decision Logを完成させてからエクスポートしてください。
                            <Link
                                href={`/series/${id}/episodes/${episodeId}`}
                                className="text-primary-400 hover:underline ml-1"
                            >
                                エピソード編集へ →
                            </Link>
                        </p>
                    </div>
                )}
            </div>

            {/* Export Preview */}
            <div className="card p-5 mb-6">
                <h2 className="font-semibold mb-4">📄 エクスポート内容プレビュー</h2>

                <div className="space-y-4">
                    {/* Metadata */}
                    <div>
                        <h3 className="text-sm font-medium mb-2 text-[var(--muted)]">metadata.json</h3>
                        <pre className="text-xs bg-[#0f0f14] p-3 rounded-lg overflow-auto max-h-40">
                            {JSON.stringify({
                                series: series.title,
                                episode: episode.episodeNumber,
                                title: episode.title,
                                synopsis: episode.synopsis,
                                status: episode.status,
                                createdAt: episode.createdAt,
                                exportedAt: new Date().toISOString(),
                            }, null, 2)}
                        </pre>
                    </div>

                    {/* Decision Log */}
                    {episode.decisionLog && (
                        <div>
                            <h3 className="text-sm font-medium mb-2 text-[var(--muted)]">decision_log.json</h3>
                            <pre className="text-xs bg-[#0f0f14] p-3 rounded-lg overflow-auto max-h-40">
                                {JSON.stringify({
                                    editorialIntent: episode.decisionLog.editorialIntent,
                                    differentiationPoints: episode.decisionLog.differentiationPoints,
                                    humanContributions: episode.decisionLog.humanContributions,
                                    aiToolUsage: parseToolUsage(episode.decisionLog.aiToolUsage).data,
                                }, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* Asset Manifest */}
                    <div>
                        <h3 className="text-sm font-medium mb-2 text-[var(--muted)]">asset_manifest.json</h3>
                        <pre className="text-xs bg-[#0f0f14] p-3 rounded-lg overflow-auto max-h-40">
                            {JSON.stringify({
                                totalAssets: episode.episodeAssets.length,
                                assets: episode.episodeAssets.map(({ asset, role, orderIndex }) => ({
                                    fileName: asset.fileName,
                                    type: asset.type,
                                    source: asset.source,
                                    role,
                                    orderIndex,
                                    generationParams: asset.source !== 'manual' ? JSON.parse(asset.generationParams) : null,
                                })),
                            }, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>

            {/* Export Actions */}
            <ExportButton
                episodeId={episodeId}
                seriesId={id}
                disabled={!allChecksPass}
                episode={exportEpisode}
            />

            {/* Originality Notice */}
            <div className="mt-6 glass rounded-xl p-5">
                <h3 className="font-medium mb-2">🎯 オリジナリティ担保について</h3>
                <p className="text-sm text-[var(--muted)]">
                    このエクスポートには、あなたの創造的判断を記録したDecision Logが含まれます。
                    YouTube収益化審査やコンテンツID紛争の際に、AIツール使用の透明性と
                    人間の創造的貢献を証明するために使用できます。
                </p>
            </div>
        </div>
    );
}
