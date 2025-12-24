import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatDate, getStatusLabel, getAssetTypeIcon } from '@/lib/utils';
import { deleteEpisode, updateEpisode } from '@/app/actions';
import DecisionLogEditor from '@/components/episode/DecisionLogEditor';
import EpisodeSceneManager from '@/components/episode/EpisodeSceneManager';

interface Props {
    params: Promise<{ id: string; episodeId: string }>;
}

async function getEpisode(episodeId: string) {
    return prisma.episode.findUnique({
        where: { id: episodeId },
        include: {
            series: {
                include: { worldBible: true },
            },
            decisionLog: true,
            scenes: {
                include: {
                    shots: {
                        orderBy: { orderIndex: 'asc' },
                    },
                },
                orderBy: { orderIndex: 'asc' },
            },
            episodeAssets: {
                include: { asset: true },
                orderBy: { orderIndex: 'asc' },
            },
        },
    });
}

export default async function EpisodeWorkspacePage({ params }: Props) {
    const { id, episodeId } = await params;
    const episode = await getEpisode(episodeId);

    if (!episode) {
        notFound();
    }

    const deleteAction = deleteEpisode.bind(null, episodeId, id);

    return (
        <div className="p-8 animate-fade-in">
            {/* Breadcrumb */}
            <div className="text-sm text-[var(--muted)] mb-4">
                <Link href="/series" className="hover:text-white">シリーズ</Link>
                <span className="mx-2">/</span>
                <Link href={`/series/${id}`} className="hover:text-white">{episode.series.title}</Link>
                <span className="mx-2">/</span>
                <span>EP{episode.episodeNumber}: {episode.title}</span>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl font-bold text-primary-400">EP{episode.episodeNumber}</span>
                        <h1 className="text-2xl font-bold">{episode.title}</h1>
                        <span className="badge">{getStatusLabel(episode.status)}</span>
                    </div>
                    {episode.synopsis && (
                        <p className="text-[var(--muted)]">{episode.synopsis}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/series/${id}/episodes/${episodeId}/export`} className="btn btn-primary">
                        📤 エクスポート
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Left Column - Scenes & Assets */}
                <div className="space-y-6">
                    <EpisodeSceneManager
                        episodeId={episodeId}
                        initialScenes={episode.scenes}
                    />

                    {/* Asset Library */}
                    <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-700">
                            <h2 className="text-lg font-semibold text-white mb-1">素材ライブラリ</h2>
                            <Link
                                href={`/assets?episodeId=${episodeId}`}
                                className="text-sm text-primary-400 hover:underline"
                            >
                                素材を追加 →
                            </Link>
                        </div>

                        {episode.episodeAssets.length === 0 ? (
                            <div className="card p-8 text-center">
                                <div className="text-3xl mb-2">📂</div>
                                <p className="text-[var(--muted)] text-sm mb-3">まだ素材がありません</p>
                                <Link href="/assets" className="btn btn-secondary text-sm">
                                    素材ライブラリへ
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {episode.episodeAssets.map(({ asset, role, orderIndex }) => (
                                    <div key={asset.id} className="card p-3 flex items-center gap-3">
                                        <div className="text-2xl">{getAssetTypeIcon(asset.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{asset.fileName}</div>
                                            <div className="text-xs text-[var(--muted)]">
                                                {role && <span className="badge mr-2">{role}</span>}
                                                {asset.source !== 'manual' && (
                                                    <span className="text-primary-400">{asset.source}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-xs text-[var(--muted)]">#{orderIndex + 1}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Episode Status */}
                        <div className="mt-6 p-4 border-t border-gray-700">
                            <h3 className="text-sm font-medium mb-3">ステータス更新</h3>
                            <form action={updateEpisode.bind(null, episodeId)}>
                                <input type="hidden" name="title" value={episode.title} />
                                <input type="hidden" name="synopsis" value={episode.synopsis || ''} />
                                <div className="flex gap-2">
                                    <select name="status" defaultValue={episode.status} className="input flex-1">
                                        <option value="draft">下書き</option>
                                        <option value="in_progress">制作中</option>
                                        <option value="review">レビュー</option>
                                        <option value="ready">公開準備完了</option>
                                        <option value="published">公開済み</option>
                                    </select>
                                    <button type="submit" className="btn btn-secondary">更新</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Right Column - Decision Log */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-lg font-semibold">📝 制作ログ (Decision Log)</h2>
                        <span className="badge badge-warning">必須</span>
                    </div>

                    <DecisionLogEditor
                        episodeId={episodeId}
                        decisionLog={episode.decisionLog}
                    />
                </div>
            </div>

            {/* World Bible Reference */}
            {episode.series.worldBible && (
                <div className="mt-8 glass rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <span>📚</span> ワールドバイブル (World Bible)
                        </h3>
                        <Link
                            href={`/series/${id}/world-bible`}
                            className="text-sm text-primary-400 hover:text-primary-300 hover:underline transition-colors"
                        >
                            編集する →
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#0f0f14]/50 p-4 rounded-lg border border-white/5">
                            <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider block mb-2">ビジュアルスタイル</span>
                            <div className="text-sm jp-text opacity-90">
                                {(() => {
                                    try {
                                        const v = JSON.parse(episode.series.worldBible.visualStyle);
                                        return (
                                            <ul className="space-y-1 list-disc list-inside">
                                                {v.colorPalette && <li>パレット: {v.colorPalette.join(', ')}</li>}
                                                {v.lightingStyle && <li>ライティング: {v.lightingStyle}</li>}
                                                {v.cameraStyle && <li>カメラ: {v.cameraStyle}</li>}
                                            </ul>
                                        );
                                    } catch { return "設定なし"; }
                                })()}
                            </div>
                        </div>
                        <div className="bg-[#0f0f14]/50 p-4 rounded-lg border border-white/5">
                            <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider block mb-2">オーディオスタイル</span>
                            <div className="text-sm jp-text opacity-90">
                                {(() => {
                                    try {
                                        const a = JSON.parse(episode.series.worldBible.audioStyle);
                                        return (
                                            <ul className="space-y-1 list-disc list-inside">
                                                {a.genre && <li>ジャンル: {a.genre}</li>}
                                                {a.mood && <li>ムード: {a.mood}</li>}
                                                {a.tempo && <li>テンポ: {a.tempo}</li>}
                                            </ul>
                                        );
                                    } catch { return "設定なし"; }
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Episode */}
            <div className="mt-8 pt-6 border-t border-[var(--card-border)]">
                <form action={deleteAction}>
                    <button type="submit" className="text-sm text-accent-500 hover:underline">
                        このエピソードを削除
                    </button>
                </form>
            </div>
        </div>
    );
}
