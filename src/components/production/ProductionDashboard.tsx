'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, Reorder } from 'framer-motion';
import {
    Lightbulb,
    Film,
    CheckCircle2,
    Play,
    Plus,
    Filter,
    LayoutGrid,
    List,
    GripVertical,
} from 'lucide-react';
import { EpisodeStepGuide } from './EpisodeStepGuide';

interface Episode {
    id: string;
    title: string;
    variant: string;
    lane: string | null;
    status: string;
    updatedAt: string;
    idea?: { id: string; title: string } | null;
    _count?: { tasks: number; sources: number };
}

interface Idea {
    id: string;
    title: string;
    lane: string | null;
    status: string;
    updatedAt: string;
    _count?: { productionEpisodes: number };
}

interface Props {
    episodes: Episode[];
    ideas: Idea[];
    stats: {
        totalIdeas: number;
        totalEpisodes: number;
        inProgress: number;
        published: number;
    };
}

const EPISODE_STATUSES = [
    { key: 'scripting', label: '台本作成', color: 'bg-blue-500' },
    { key: 'voice', label: '音声収録', color: 'bg-purple-500' },
    { key: 'assets', label: '素材準備', color: 'bg-yellow-500' },
    { key: 'editing', label: '編集中', color: 'bg-orange-500' },
    { key: 'review', label: 'レビュー', color: 'bg-pink-500' },
    { key: 'scheduled', label: '公開予定', color: 'bg-cyan-500' },
    { key: 'published', label: '公開済', color: 'bg-green-500' },
];

const LANE_LABELS: Record<string, string> = {
    med_bio: 'Med/Bio',
    ai_news: 'AIニュース',
};

export default function ProductionDashboard({ episodes: initialEpisodes, ideas, stats }: Props) {
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [filterLane, setFilterLane] = useState<string | null>(null);
    const [episodes, setEpisodes] = useState(initialEpisodes);
    const [draggedEpisode, setDraggedEpisode] = useState<Episode | null>(null);
    const [dropTargetStatus, setDropTargetStatus] = useState<string | null>(null);
    const [statusError, setStatusError] = useState<string | null>(null);

    const filteredEpisodes = filterLane
        ? episodes.filter((ep) => ep.lane === filterLane)
        : episodes;

    const groupedByStatus = EPISODE_STATUSES.map((status) => ({
        ...status,
        episodes: filteredEpisodes.filter((ep) => ep.status === status.key),
    }));

    // Handle drag start
    const handleDragStart = (episode: Episode) => {
        setDraggedEpisode(episode);
    };

    // Handle drag over column
    const handleDragOver = (e: React.DragEvent, statusKey: string) => {
        e.preventDefault();
        setDropTargetStatus(statusKey);
    };

    // Handle drag leave
    const handleDragLeave = () => {
        setDropTargetStatus(null);
    };

    // Handle drop
    const handleDrop = useCallback(async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        setDropTargetStatus(null);

        if (!draggedEpisode || draggedEpisode.status === newStatus) {
            setDraggedEpisode(null);
            return;
        }

        // Optimistic update
        setEpisodes(prev =>
            prev.map(ep =>
                ep.id === draggedEpisode.id
                    ? { ...ep, status: newStatus }
                    : ep
            )
        );

        // API call to update status
        try {
            const res = await fetch(`/api/production/episodes/${draggedEpisode.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                // Revert on failure
                setEpisodes(prev =>
                    prev.map(ep =>
                        ep.id === draggedEpisode.id
                            ? { ...ep, status: draggedEpisode.status }
                            : ep
                    )
                );
                // Show user-friendly error
                setStatusError(`ステータス更新に失敗しました: ${errorData.error || res.statusText}`);
                setTimeout(() => setStatusError(null), 5000);
            }
        } catch (error) {
            // Revert on error
            setEpisodes(prev =>
                prev.map(ep =>
                    ep.id === draggedEpisode.id
                        ? { ...ep, status: draggedEpisode.status }
                        : ep
                )
            );
            // Show user-friendly error
            setStatusError('ネットワークエラー: ステータスを更新できませんでした');
            setTimeout(() => setStatusError(null), 5000);
        }

        setDraggedEpisode(null);
    }, [draggedEpisode]);

    return (
        <div className="p-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                        YouTube制作管理
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        企画→台本→編集→公開のワークフロー
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/production/episodes/new"
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} />
                        新規エピソード
                    </Link>
                </div>
            </div>

            {/* Error Toast */}
            {statusError && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-red-500/90 text-white rounded-lg shadow-xl flex items-center gap-3 animate-fade-in">
                    <span className="text-lg">⚠️</span>
                    <span>{statusError}</span>
                    <button
                        onClick={() => setStatusError(null)}
                        className="ml-2 text-white/70 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                    icon={<Lightbulb size={24} />}
                    label="アイデア"
                    value={stats.totalIdeas}
                    color="from-yellow-500/20 to-orange-500/10"
                />
                <StatCard
                    icon={<Film size={24} />}
                    label="エピソード"
                    value={stats.totalEpisodes}
                    color="from-blue-500/20 to-indigo-500/10"
                />
                <StatCard
                    icon={<Play size={24} />}
                    label="制作中"
                    value={stats.inProgress}
                    color="from-purple-500/20 to-pink-500/10"
                />
                <StatCard
                    icon={<CheckCircle2 size={24} />}
                    label="公開済"
                    value={stats.published}
                    color="from-green-500/20 to-emerald-500/10"
                />
            </div>

            {/* Workflow Guide - show only if there are episodes */}
            {filteredEpisodes.length > 0 && (
                <div className="mb-6 p-4 bg-gray-900/30 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-400">
                        <span>📊</span>
                        <span>制作ステータス分布</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {groupedByStatus.map((column) => (
                            <div key={column.key} className="flex-1">
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                    <span>{column.label}</span>
                                    <span>{column.episodes.length}</span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${column.color} transition-all`}
                                        style={{
                                            width: `${filteredEpisodes.length > 0
                                                ? (column.episodes.length / filteredEpisodes.length) * 100
                                                : 0}%`
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter & View Toggle */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-400" />
                    <select
                        value={filterLane || ''}
                        onChange={(e) => setFilterLane(e.target.value || null)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
                    >
                        <option value="">すべてのレーン</option>
                        <option value="med_bio">Med/Bio解説</option>
                        <option value="ai_news">AIニュース</option>
                    </select>
                </div>
                <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}
                    >
                        <List size={18} />
                    </button>
                </div>
            </div>

            {/* Kanban View with D&D */}
            {viewMode === 'kanban' ? (
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {groupedByStatus.map((column) => (
                        <div
                            key={column.key}
                            onDragOver={(e) => handleDragOver(e, column.key)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, column.key)}
                            className={`flex-shrink-0 w-72 rounded-xl p-3 border transition-all ${dropTargetStatus === column.key
                                ? 'bg-indigo-500/10 border-indigo-500/50'
                                : 'bg-gray-900/50 border-gray-800'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-4 px-2">
                                <div className={`w-2 h-2 rounded-full ${column.color}`} />
                                <h3 className="font-medium text-sm">{column.label}</h3>
                                <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                                    {column.episodes.length}
                                </span>
                            </div>
                            <div className="space-y-2 min-h-[100px]">
                                {column.episodes.map((episode) => (
                                    <motion.div
                                        key={episode.id}
                                        draggable
                                        onDragStart={() => handleDragStart(episode)}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        whileHover={{ scale: 1.02 }}
                                        className={`cursor-grab active:cursor-grabbing ${draggedEpisode?.id === episode.id ? 'opacity-50' : ''
                                            }`}
                                    >
                                        <Link
                                            href={`/production/episodes/${episode.id}`}
                                            className="block p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-indigo-500/50 transition-colors"
                                            onClick={(e) => {
                                                if (draggedEpisode) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-1 text-gray-500 mb-2">
                                                <GripVertical size={12} />
                                            </div>
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h4 className="font-medium text-sm line-clamp-2">{episode.title}</h4>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${episode.variant === 'shorts' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                    {episode.variant === 'shorts' ? 'Shorts' : '長尺'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span className={`px-1.5 py-0.5 rounded ${episode.lane === 'med_bio' ? 'bg-emerald-500/10 text-emerald-400' : episode.lane === 'ai_news' ? 'bg-violet-500/10 text-violet-400' : 'bg-gray-500/10 text-gray-400'}`}>
                                                    {episode.lane ? (LANE_LABELS[episode.lane] || episode.lane) : "未分類"}
                                                </span>
                                                {episode._count && (
                                                    <span>{episode._count.tasks} タスク</span>
                                                )}
                                            </div>
                                            {/* Mini Step Progress */}
                                            <div className="mt-2">
                                                <EpisodeStepGuide currentStatus={episode.status} compact />
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                                {column.episodes.length === 0 && (
                                    <div className="text-center py-8 text-gray-600 text-sm border-2 border-dashed border-gray-700 rounded-lg">
                                        ドロップしてステータスを変更
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* List View */
                <div className="space-y-2">
                    {filteredEpisodes.map((episode) => (
                        <Link
                            key={episode.id}
                            href={`/production/episodes/${episode.id}`}
                            className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-indigo-500/50 transition-colors"
                        >
                            <div className={`w-2 h-2 rounded-full ${EPISODE_STATUSES.find((s) => s.key === episode.status)?.color || 'bg-gray-500'}`} />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium truncate">{episode.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <span>{episode.lane ? (LANE_LABELS[episode.lane] || episode.lane) : "未分類"}</span>
                                    <span>•</span>
                                    <span>{episode.variant === 'shorts' ? 'Shorts' : '長尺'}</span>
                                </div>
                            </div>
                            <div className="hidden md:block w-48">
                                <EpisodeStepGuide currentStatus={episode.status} compact />
                            </div>
                            <span className="text-sm text-gray-400">
                                {EPISODE_STATUSES.find((s) => s.key === episode.status)?.label}
                            </span>
                        </Link>
                    ))}
                    {filteredEpisodes.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            エピソードがありません
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: string;
}) {
    return (
        <div className={`p-4 rounded-xl bg-gradient-to-br ${color} border border-white/5`}>
            <div className="flex items-center gap-3">
                <div className="text-white/70">{icon}</div>
                <div>
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-xs text-gray-400">{label}</div>
                </div>
            </div>
        </div>
    );
}
