'use client';

import Link from 'next/link';
import { createEpisode, deleteEpisode } from '@/app/actions';
import { getStatusLabel, getStatusColor, formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { EpisodeWithRelations } from '@/types';
import ScriptGenerator from '@/components/ai/ScriptGenerator';
import { Sparkles, FileText } from 'lucide-react';

interface Props {
    seriesId: string;
    episodes: EpisodeWithRelations[];
}

export default function EpisodeListView({ seriesId, episodes }: Props) {
    const [isCreating, setIsCreating] = useState(false);
    const [useAI, setUseAI] = useState(false);
    const [aiTitle, setAiTitle] = useState('');
    const [aiSynopsis, setAiSynopsis] = useState('');

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold">🎬 制作エピソード</h2>
                    <p className="text-[var(--muted)] text-sm">
                        制作が進行中、または完了したエピソードの一覧です。
                    </p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="btn btn-primary"
                >
                    ＋ エピソードを追加
                </button>
            </div>

            <AnimatePresence>
                {isCreating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => { setIsCreating(false); setUseAI(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="card w-full max-w-2xl p-6 bg-[#161620] shadow-2xl max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold mb-4">新しいエピソード</h3>

                            {/* Mode Toggle */}
                            <div className="flex gap-2 mb-6">
                                <button
                                    type="button"
                                    onClick={() => setUseAI(false)}
                                    className={`flex-1 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${!useAI
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    <FileText size={16} />
                                    手動入力
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUseAI(true)}
                                    className={`flex-1 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${useAI
                                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    <Sparkles size={16} />
                                    AIでスクリプト生成
                                </button>
                            </div>

                            {useAI ? (
                                /* AI Script Generator Mode */
                                <ScriptGenerator
                                    seriesId={seriesId}
                                    onScriptGenerated={(script) => {
                                        setAiTitle(script.title);
                                        setAiSynopsis(script.synopsis);
                                    }}
                                    onCreateEpisode={async (title, synopsis) => {
                                        const formData = new FormData();
                                        formData.set('title', title);
                                        formData.set('synopsis', synopsis);
                                        await createEpisode(seriesId, formData);
                                        setIsCreating(false);
                                        setUseAI(false);
                                        setAiTitle('');
                                        setAiSynopsis('');
                                    }}
                                />
                            ) : (
                                /* Manual Input Mode */
                                <form action={async (formData) => {
                                    await createEpisode(seriesId, formData);
                                    setIsCreating(false);
                                }}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm mb-1">タイトル</label>
                                            <input
                                                type="text"
                                                name="title"
                                                className="input"
                                                placeholder="エピソードタイトル"
                                                required
                                                autoFocus
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm mb-1">あらすじ (オプショナル)</label>
                                            <textarea
                                                name="synopsis"
                                                className="textarea"
                                                placeholder="簡単なあらすじ"
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
                                                作成する
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {episodes.length === 0 ? (
                <div className="card p-12 text-center text-[var(--muted)] border border-dashed border-white/10 rounded-xl">
                    <div className="text-4xl mb-3">🎬</div>
                    <p>エピソードがまだありません</p>
                    <button onClick={() => setIsCreating(true)} className="text-primary-400 hover:underline mt-2">
                        最初のエピソードを作成する
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {episodes.map((episode) => (
                        <motion.div
                            key={episode.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            layout
                        >
                            <Link
                                href={`/series/${seriesId}/episodes/${episode.id}`}
                                className="card p-4 flex items-center gap-4 hover:border-primary-500/50 group transition-all relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                <div className="w-12 h-12 rounded-lg bg-[#2a2a3a] flex flex-col items-center justify-center font-bold border border-white/5 group-hover:border-primary-500/30 transition-colors z-10">
                                    <span className="text-[10px] text-[var(--muted)]/70 uppercase">EP</span>
                                    <span className="text-lg leading-none">{episode.episodeNumber}</span>
                                </div>

                                <div className="flex-1 min-w-0 z-10">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg truncate group-hover:text-primary-400 transition-colors">
                                            {episode.title}
                                        </h3>
                                        {!episode.decisionLog && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                                ⚠ Decision Log未完了
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-[var(--muted)] flex items-center gap-3 mt-1">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(episode.status)}`} />
                                            <span>{getStatusLabel(episode.status)}</span>
                                        </div>
                                        <span className="w-px h-3 bg-white/10" />
                                        <span>{episode._count?.episodeAssets ?? 0} 素材</span>
                                        <span className="w-px h-3 bg-white/10" />
                                        <span>Last updated: {formatDate(episode.updatedAt)}</span>
                                    </div>
                                </div>

                                <div className="z-10 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--muted)] group-hover:text-white transform translate-x-2 group-hover:translate-x-0 transition-transform">
                                    編集 →
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
