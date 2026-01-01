'use client';

import Link from 'next/link';
import { formatDate, getStatusLabel, getStatusColor } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Props {
    seriesList: any[];
}

export default function SeriesListView({ seriesList }: Props) {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="p-8"
        >
            {/* Header */}
            <motion.div variants={item} className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">シリーズ一覧</h1>
                    <p className="text-[var(--muted)] text-sm mt-1">
                        World Bibleで一貫した世界観を管理
                    </p>
                </div>
                <Link href="/series/new" className="btn btn-primary shadow-lg shadow-primary-500/20">
                    ＋ 新規シリーズ
                </Link>
            </motion.div>

            {/* Series Grid */}
            {seriesList.length === 0 ? (
                <motion.div variants={item} className="card p-12 text-center border-dashed bg-transparent border-white/10">
                    <div className="text-6xl mb-6 opacity-30">🎬</div>
                    <h2 className="text-xl font-semibold mb-3">シリーズを作成しましょう</h2>
                    <p className="text-[var(--muted)] mb-8 max-w-md mx-auto">
                        シリーズは動画コンテンツをまとめる単位です。
                        World Bibleで世界観を定義し、一貫性のあるコンテンツを制作できます。
                    </p>
                    <Link href="/series/new" className="btn btn-primary">
                        最初のシリーズを作成
                    </Link>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {seriesList.map((series) => (
                        <Link
                            key={series.id}
                            href={`/series/${series.id}`}
                        >
                            <motion.div
                                variants={item}
                                whileHover={{ y: -5, scale: 1.01 }}
                                className="card p-6 hover:shadow-2xl hover:shadow-black/50 hover:border-primary-500/30 group transition-all h-full"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl bg-white/5 p-2 rounded-lg">🎬</span>
                                        <h3 className="font-bold text-lg group-hover:text-primary-400 transition-colors">
                                            {series.title}
                                        </h3>
                                    </div>
                                    <span className={`badge ${series.status === 'active' ? 'badge-success' : ''}`}>
                                        {getStatusLabel(series.status)}
                                    </span>
                                </div>

                                <p className="text-sm text-[var(--muted)] line-clamp-3 mb-6 min-h-[3rem]">
                                    {series.description || '説明を追加...'}
                                </p>

                                <div className="flex items-center gap-4 text-xs text-[var(--muted)] pt-4 border-t border-[var(--card-border)]">
                                    <span className="flex items-center gap-1"><span className="text-white/40">📺</span> {series._count.productionEpisodes} EP</span>
                                    <span className="w-px h-3 bg-white/10"></span>
                                    <span className="flex items-center gap-1"><span className="text-white/40">📝</span> {series._count.promptPacks} PromptPacks</span>
                                </div>

                                <div className="mt-3 text-xs text-[var(--muted)] text-right">
                                    {formatDate(series.updatedAt)}
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
