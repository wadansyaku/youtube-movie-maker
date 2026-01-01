'use client';

import Link from 'next/link';
import { formatDate, getStatusColor } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { DashboardStats, Series } from '@/types';

interface RecentSeries extends Series {
    _count?: {
        productionEpisodes: number;
    };
}

interface Props {
    stats: {
        seriesCount: number;
        episodeCount: number;
        assetCount: number;
    };
    recentSeries: RecentSeries[];
}

export default function DashboardView({ stats, recentSeries }: Props) {
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
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                        ダッシュボード
                    </h1>
                    <p className="text-[var(--muted)] text-sm mt-1">
                        World Bible駆動の動画制作パイプライン
                    </p>
                </div>
                <Link href="/series/new" className="btn btn-primary shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-shadow">
                    ＋ 新規シリーズ
                </Link>
            </motion.div>

            {/* Stats */}
            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="card p-6 bg-gradient-to-br from-white/[0.08] to-transparent border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl rotate-12 group-hover:scale-110 transition-transform">🎬</div>
                    <div className="text-4xl font-bold gradient-text mb-2">{stats.seriesCount}</div>
                    <div className="text-sm text-[var(--muted)] uppercase tracking-wider font-semibold">Series</div>
                </div>
                <div className="card p-6 bg-gradient-to-br from-white/[0.08] to-transparent border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl rotate-12 group-hover:scale-110 transition-transform">📺</div>
                    <div className="text-4xl font-bold gradient-text mb-2">{stats.episodeCount}</div>
                    <div className="text-sm text-[var(--muted)] uppercase tracking-wider font-semibold">Episodes</div>
                </div>
                <div className="card p-6 bg-gradient-to-br from-white/[0.08] to-transparent border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl rotate-12 group-hover:scale-110 transition-transform">📁</div>
                    <div className="text-4xl font-bold gradient-text mb-2">{stats.assetCount}</div>
                    <div className="text-sm text-[var(--muted)] uppercase tracking-wider font-semibold">Assets</div>
                </div>
            </motion.div>

            {/* Recent Series */}
            <motion.div variants={item}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
                        最近のシリーズ
                    </h2>
                    <Link href="/series" className="text-sm text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1 group">
                        すべて表示
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                </div>

                {recentSeries.length === 0 ? (
                    <div className="card p-12 text-center border-dashed border-white/10 bg-transparent">
                        <div className="text-5xl mb-4 grayscale opacity-50">🎬</div>
                        <p className="text-[var(--muted)] mb-6">まだシリーズがありません</p>
                        <Link href="/series/new" className="btn btn-primary">
                            最初のシリーズを作成
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recentSeries.map((series) => (
                            <Link
                                key={series.id}
                                href={`/series/${series.id}`}
                            >
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    className="card p-6 hover:shadow-2xl hover:shadow-black/50 hover:border-primary-500/30 group transition-all h-full flex flex-col"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <h3 className="font-bold text-lg truncate pr-4 group-hover:text-primary-300 transition-colors">
                                            {series.title}
                                        </h3>
                                        <div className={`status-dot ${getStatusColor(series.status)} shadow-sm shadow-current`} />
                                    </div>
                                    <p className="text-sm text-[var(--muted)] line-clamp-3 mb-6 flex-1">
                                        {series.description || '説明なし'}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-4 border-t border-white/5">
                                        <span className="flex items-center gap-1">
                                            <span className="text-white/40">📺</span>
                                            {series._count?.productionEpisodes ?? 0} EP
                                        </span>
                                        <span>{formatDate(series.updatedAt)}</span>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Human-in-the-Loop Reminder */}
            <motion.div variants={item} className="mt-12">
                <div className="glass rounded-xl p-8 relative overflow-hidden border border-accent-500/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex items-start gap-6 relative z-10">
                        <div className="text-4xl bg-white/5 p-3 rounded-2xl">🎯</div>
                        <div>
                            <h3 className="font-bold text-lg mb-2 text-white">Human-in-the-Loop 必須設計</h3>
                            <p className="text-sm text-[var(--muted)] leading-relaxed max-w-2xl">
                                このアプリケーションは「AIと人間の共創」を支援します。<br />
                                AIによる効率化だけでなく、<span className="text-accent-400 font-medium">Decision Log</span> を通じて
                                あなたの編集意図と創造的判断を確実に記録に残しましょう。
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
