'use client';

import { useState } from 'react';
import { createEpisodeIdea } from '@/app/actions';
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { Episode, WorldBible } from '@/types';

interface Props {
    seriesId: string;
    episodes: Episode[];
    worldBible?: WorldBible | null;
}

export default function RoadmapView({ seriesId, episodes, worldBible }: Props) {
    const [isCreating, setIsCreating] = useState(false);

    // Parse World Bible data safely
    const rules = worldBible?.rules ? JSON.parse(worldBible.rules) : null;
    const visualStyle = worldBible?.visualStyle ? JSON.parse(worldBible.visualStyle) : null;

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold">💡 シリーズ構想・アイデア</h2>
                    <p className="text-[var(--muted)] text-sm">
                        エピソード番号を振る前のアイデア段階を管理します。
                    </p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="btn btn-primary"
                >
                    ＋ アイデアを追加
                </button>
            </div>

            <AnimatePresence>
                {isCreating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="card w-full max-w-4xl p-0 bg-[#161620] shadow-2xl flex overflow-hidden max-h-[90vh]"
                        >
                            {/* Left: Input Form */}
                            <div className="flex-1 p-6 overflow-y-auto">
                                <h3 className="text-lg font-bold mb-4">新しいアイデア</h3>
                                <form action={async (formData) => {
                                    await createEpisodeIdea(seriesId, formData);
                                    setIsCreating(false);
                                    toast.success("アイデアを追加しました");
                                }}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm mb-1">タイトル / コンセプト</label>
                                            <input
                                                type="text"
                                                name="title"
                                                className="input"
                                                placeholder="例: 主人公の過去編、温泉回など"
                                                autoFocus
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm mb-1">メモ (オプショナル)</label>
                                            <textarea
                                                name="synopsis"
                                                className="textarea h-32"
                                                placeholder="やりたいこと、構成案など"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsCreating(false)}
                                                className="btn btn-secondary"
                                            >
                                                キャンセル
                                            </button>
                                            <button type="submit" className="btn btn-primary">
                                                追加する
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            {/* Right: World Bible Context */}
                            <div className="w-80 bg-[#0f0f14] border-l border-white/5 p-6 overflow-y-auto hidden md:block">
                                <h4 className="text-sm font-bold text-[var(--muted)] uppercase tracking-wider mb-4">World Bible Context</h4>

                                {rules && (
                                    <div className="mb-6">
                                        <h5 className="text-xs font-semibold text-accent-400 mb-2">ルール</h5>
                                        <ul className="space-y-2">
                                            {rules.mustInclude?.slice(0, 3).map((item: string, i: number) => (
                                                <li key={i} className="text-xs text-white/80 flex items-start gap-2">
                                                    <span className="text-green-400">✓</span> {item}
                                                </li>
                                            ))}
                                            {rules.mustAvoid?.slice(0, 3).map((item: string, i: number) => (
                                                <li key={i} className="text-xs text-white/80 flex items-start gap-2">
                                                    <span className="text-red-400">×</span> {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {visualStyle && (
                                    <div>
                                        <h5 className="text-xs font-semibold text-blue-400 mb-2">ビジュアルスタイル</h5>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {visualStyle.colorPalette?.map((color: string, i: number) => (
                                                <div key={i} className="w-6 h-6 rounded-full border border-white/10" style={{ backgroundColor: color }} title={color} />
                                            ))}
                                        </div>
                                        <p className="text-xs text-[var(--muted)]">
                                            Lighting: {visualStyle.lightingStyle}
                                        </p>
                                    </div>
                                )}

                                <div className="mt-8 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                    <p className="text-xs text-blue-300">
                                        💡 ヒント: シリーズの一貫性を保つため、これらのルールを意識してアイデアを練りましょう。
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {episodes.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-[var(--muted)] border border-dashed border-white/10 rounded-xl">
                        <div className="text-4xl mb-3">💡</div>
                        <p>まだアイデアがありません。</p>
                        <button onClick={() => setIsCreating(true)} className="text-primary-400 hover:underline mt-2">
                            最初のアイデアを追加する
                        </button>
                    </div>
                ) : (
                    episodes.map((episode) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={episode.id}
                            className="card p-5 group hover:border-primary-500/30 transition-colors relative flex flex-col h-full"
                        >
                            <h3 className="font-bold mb-2 pr-8">{episode.title}</h3>
                            <p className="text-sm text-[var(--muted)] line-clamp-3 mb-4 min-h-[3rem]">
                                {episode.synopsis || "メモなし"}
                            </p>

                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                <div className="text-xs text-[var(--muted)] flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-yellow-500/50"></span>
                                    Planning
                                </div>
                                <form action={async () => {
                                    // In a real app we might want to confirm first, but for MVP speed:
                                    const { convertEpisodeIdea } = await import('@/app/actions'); // Dynamic import to avoid circular dep issues if any, though here it's fine.
                                    await convertEpisodeIdea(episode.id, seriesId);
                                    toast.success("エピソードの制作を開始しました！", {
                                        description: `${episode.title} を制作リストに移動しました。`
                                    });
                                }}>
                                    <button
                                        type="submit"
                                        className="text-xs bg-primary-500/10 text-primary-400 px-3 py-1.5 rounded-md hover:bg-primary-500 hover:text-white transition-all font-medium border border-primary-500/20"
                                    >
                                        制作開始 →
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
