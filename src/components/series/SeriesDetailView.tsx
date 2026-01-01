'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getStatusLabel, getStatusColor, formatDate } from '@/lib/utils';
import RoadmapView from './RoadmapView';
import EpisodeListView from './EpisodeListView';
import { deleteSeries } from '@/app/actions';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import type {
    SeriesWithRelations,
    ProductionEpisodeWithRelations,
    WorldBible,
    PromptPackWithCounts
} from '@/types';

interface Props {
    series: SeriesWithRelations;
}

type TabType = 'overview' | 'roadmap' | 'episodes' | 'bible' | 'prompt-pack';

export default function SeriesDetailView({ series }: Props) {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const tabs: { key: TabType; label: string; icon: string }[] = [
        { key: 'overview', label: '概要', icon: '📊' },
        { key: 'roadmap', label: '構想・計画', icon: '💡' },
        { key: 'episodes', label: '制作・公開', icon: '🎬' },
        { key: 'bible', label: 'World Bible', icon: '📚' },
        { key: 'prompt-pack', label: 'PromptPack', icon: '📝' },
    ];

    const handleDelete = async () => {
        await deleteSeries(series.id);
        toast.success('シリーズを削除しました');
    };

    return (
        <div className="max-w-7xl mx-auto animate-fade-in">
            <ConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={handleDelete}
                title="シリーズを削除しますか？"
                description={`「${series.title}」とそのすべてのエピソード、アイデア、設定が完全に削除されます。この操作は取り消せません。`}
                confirmText="削除する"
                cancelText="キャンセル"
                variant="danger"
            />
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <div className="text-sm text-[var(--muted)] mb-2">
                        <Link href="/series" className="hover:text-white">シリーズ一覧</Link>
                        <span className="mx-2">/</span>
                        <span>{series.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold">{series.title}</h1>
                        <span className={`badge ${series.status === 'active' ? 'badge-success' : ''}`}>
                            {getStatusLabel(series.status)}
                        </span>
                    </div>
                    {series.description && (
                        <p className="text-[var(--muted)] mt-2 max-w-2xl">{series.description}</p>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--card-border)] mb-8">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-6 py-3 text-sm font-medium transition-all relative ${activeTab === tab.key
                            ? 'text-white'
                            : 'text-[var(--muted)] hover:text-white'
                            }`}
                    >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.label}
                        {activeTab === tab.key && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="card p-5">
                                <div className="text-sm text-[var(--muted)] mb-1">アイデア</div>
                                <div className="text-3xl font-bold">
                                    {series.ideas.length}
                                </div>
                            </div>
                            <div className="card p-5">
                                <div className="text-sm text-[var(--muted)] mb-1">制作中</div>
                                <div className="text-3xl font-bold">
                                    {series.productionEpisodes.filter(e => e.status !== 'published' && e.status !== 'archived').length}
                                </div>
                            </div>
                            <div className="card p-5">
                                <div className="text-sm text-[var(--muted)] mb-1">公開済み</div>
                                <div className="text-3xl font-bold text-primary-400">
                                    {series.productionEpisodes.filter(e => e.status === 'published').length}
                                </div>
                            </div>
                            <div className="card p-5">
                                <div className="text-sm text-[var(--muted)] mb-1">素材数</div>
                                <div className="text-3xl font-bold">
                                    {series.productionEpisodes.reduce((acc, e) => acc + (e._count?.episodeAssets || 0), 0)}
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity or Quick Actions - Placeholder */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="card p-6">
                                <h3 className="font-semibold mb-4 text-lg">クイックアクション</h3>
                                <div className="space-y-3">
                                    <button onClick={() => setActiveTab('roadmap')} className="w-full btn btn-secondary text-left flex items-center justify-between group">
                                        <span>💡 新しいアイデアを追加</span>
                                        <span className="text-[var(--muted)] group-hover:text-white">→</span>
                                    </button>
                                    <Link href={`/series/${series.id}/world-bible`} className="w-full btn btn-secondary text-left flex items-center justify-between group">
                                        <span>📚 World Bibleを編集</span>
                                        <span className="text-[var(--muted)] group-hover:text-white">→</span>
                                    </Link>
                                </div>
                            </div>

                            <div className="card p-6 border-accent-900/30">
                                <h3 className="font-semibold mb-4 text-accent-500">管理</h3>
                                <button
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="text-sm text-accent-500 hover:underline hover:text-accent-400 transition-colors"
                                >
                                    このシリーズを削除する
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'roadmap' && (
                    <RoadmapView
                        seriesId={series.id}
                        ideas={series.ideas}
                        worldBible={series.worldBible}
                    />
                )}

                {activeTab === 'episodes' && (
                    <EpisodeListView
                        seriesId={series.id}
                        episodes={series.productionEpisodes.filter(e => e.status !== 'archived')}
                    />
                )}

                {activeTab === 'bible' && (
                    <div className="text-center py-12">
                        <h3 className="text-xl font-semibold mb-4">World Bible</h3>
                        <p className="text-[var(--muted)] mb-6">世界観や設定の詳細はこちらで管理します</p>
                        <Link href={`/series/${series.id}/world-bible`} className="btn btn-primary">
                            World Bible エディタを開く
                        </Link>
                    </div>
                )}

                {activeTab === 'prompt-pack' && (
                    <div className="text-center py-12">
                        <h3 className="text-xl font-semibold mb-4">Prompt Pack</h3>
                        <p className="text-[var(--muted)] mb-6">AI生成用のプロンプトテンプレートはこちらで管理します</p>
                        <Link href={`/series/${series.id}/prompt-packs`} className="btn btn-primary">
                            PromptPack マネージャを開く
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
