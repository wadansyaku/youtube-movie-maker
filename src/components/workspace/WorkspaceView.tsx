'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDate, getStatusLabel } from '@/lib/utils';
import { Calendar, Image as ImageIcon, Lightbulb, Loader2, Sparkles, Video, ChevronDown, ChevronUp } from 'lucide-react';

type Idea = {
    id: string;
    title: string;
    status: string;
    updatedAt: string;
};

type Episode = {
    id: string;
    title: string;
    status: string;
    updatedAt: string;
};

interface Props {
    initialIdeas: Idea[];
    initialEpisodes: Episode[];
}

export default function WorkspaceView({ initialIdeas, initialEpisodes }: Props) {
    const [ideas, setIdeas] = useState<Idea[]>(initialIdeas);
    const [episodes, setEpisodes] = useState<Episode[]>(initialEpisodes);
    const [ideaTitle, setIdeaTitle] = useState('');
    const [episodeTitle, setEpisodeTitle] = useState('');
    const [ideaLoading, setIdeaLoading] = useState(false);
    const [episodeLoading, setEpisodeLoading] = useState(false);
    const [deletingIdeaIds, setDeletingIdeaIds] = useState<Set<string>>(new Set());
    const [deletingEpisodeIds, setDeletingEpisodeIds] = useState<Set<string>>(new Set());
    const [confirmIdeaId, setConfirmIdeaId] = useState<string | null>(null);
    const [confirmEpisodeId, setConfirmEpisodeId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showIdeas, setShowIdeas] = useState(true);
    const [showEpisodes, setShowEpisodes] = useState(true);

    const isEmptyWorkspace = ideas.length === 0 && episodes.length === 0;

    const handleCreateIdea = async () => {
        const title = ideaTitle.trim();
        if (!title || ideaLoading) return;
        setIdeaLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/production/ideas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'アイデアの作成に失敗しました');
            }

            const data = await res.json();
            setIdeas((prev) => [
                { id: data.id, title: data.title, status: data.status, updatedAt: data.updatedAt },
                ...prev,
            ]);
            setIdeaTitle('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'アイデアの作成に失敗しました');
        } finally {
            setIdeaLoading(false);
        }
    };

    const handleCreateEpisode = async (titleValue?: string, ideaId?: string) => {
        const title = (titleValue ?? episodeTitle).trim();
        if (!title || episodeLoading) return;
        setEpisodeLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/production/episodes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    ideaId: ideaId || null,
                    status: 'scripting',
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || '投稿の作成に失敗しました');
            }

            const data = await res.json();
            setEpisodes((prev) => [
                { id: data.id, title: data.title, status: data.status, updatedAt: data.updatedAt },
                ...prev,
            ]);
            if (!ideaId) {
                setEpisodeTitle('');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '投稿の作成に失敗しました');
        } finally {
            setEpisodeLoading(false);
        }
    };

    const handleDeleteIdea = async (ideaId: string) => {
        setError(null);
        setConfirmIdeaId(null);
        setDeletingIdeaIds((prev) => new Set(prev).add(ideaId));

        try {
            const res = await fetch(`/api/production/ideas/${ideaId}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'アイデアの削除に失敗しました');
            }
            setIdeas((prev) => prev.filter((idea) => idea.id !== ideaId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'アイデアの削除に失敗しました');
        } finally {
            setDeletingIdeaIds((prev) => {
                const next = new Set(prev);
                next.delete(ideaId);
                return next;
            });
        }
    };

    const handleDeleteEpisode = async (episodeId: string) => {
        setError(null);
        setConfirmEpisodeId(null);
        setDeletingEpisodeIds((prev) => new Set(prev).add(episodeId));

        try {
            const res = await fetch(`/api/production/episodes/${episodeId}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || '投稿の削除に失敗しました');
            }
            setEpisodes((prev) => prev.filter((episode) => episode.id !== episodeId));
        } catch (err) {
            setError(err instanceof Error ? err.message : '投稿の削除に失敗しました');
        } finally {
            setDeletingEpisodeIds((prev) => {
                const next = new Set(prev);
                next.delete(episodeId);
                return next;
            });
        }
    };

    return (
        <div className="p-6 animate-fade-in space-y-8">
            <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">ワークスペース</h1>
                    <p className="text-sm text-gray-400">
                        アイデア → 投稿管理 → 動画編集のシンプルな流れにまとめました。
                    </p>
                </div>
                <Link
                    href="/create/ai"
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                >
                    <Sparkles className="h-4 w-4" />
                    AIでアイデア/投稿を作る
                </Link>
            </header>

            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            {isEmptyWorkspace && (
                <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-8 text-center">
                    <p className="text-sm text-indigo-200">はじめてのショート動画を作りましょう</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">今すぐショート動画を作る</h2>
                    <p className="mt-2 text-sm text-gray-400">
                        テーマを入力するだけで、企画→台本→素材まで一気に作成できます。
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-3">
                        <Link
                            href="/create/ai"
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                        >
                            <Sparkles className="h-4 w-4" />
                            AIでショートを作る
                        </Link>
                        <Link
                            href="/studio"
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:border-gray-500"
                        >
                            スタジオを開く
                        </Link>
                    </div>
                </div>
            )}

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="card p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <Lightbulb className="h-5 w-5 text-amber-300" />
                            <h2 className="font-semibold">アイデア</h2>
                        </div>
                        <button
                            onClick={() => setShowIdeas((prev) => !prev)}
                            className="text-xs text-gray-400 hover:text-gray-200"
                        >
                            {showIdeas ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <input
                            value={ideaTitle}
                            onChange={(e) => setIdeaTitle(e.target.value)}
                            placeholder="アイデアのタイトル"
                            className="flex-1 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder:text-gray-600"
                        />
                        <button
                            onClick={handleCreateIdea}
                            disabled={ideaLoading}
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-50"
                        >
                            {ideaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '追加'}
                        </button>
                    </div>

                    {showIdeas && (
                        <div className="space-y-2">
                            {ideas.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-gray-800 bg-gray-950 px-4 py-6 text-center text-sm text-gray-400">
                                    <p className="text-sm text-gray-300">まだアイデアがありません。</p>
                                    <p className="mt-2 text-xs text-gray-500">
                                        テーマからAIで一気にアイデアを作ると早いです。
                                    </p>
                                    <Link
                                        href="/create/ai"
                                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-500"
                                    >
                                        <Sparkles className="h-3 w-3" />
                                        AIでアイデアを作る
                                    </Link>
                                </div>
                            ) : (
                                ideas.slice(0, 6).map((idea) => (
                                    <div
                                        key={idea.id}
                                        className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-2"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm text-white truncate">{idea.title}</p>
                                            <p className="text-xs text-gray-500">
                                                {getStatusLabel(idea.status)} · {formatDate(idea.updatedAt)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleCreateEpisode(idea.title, idea.id)}
                                                className="text-xs text-indigo-300 hover:text-indigo-200 whitespace-nowrap"
                                            >
                                                投稿にする
                                            </button>
                                            {confirmIdeaId === idea.id ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleDeleteIdea(idea.id)}
                                                        disabled={deletingIdeaIds.has(idea.id)}
                                                        className="text-xs text-red-200 hover:text-red-100 whitespace-nowrap disabled:opacity-50"
                                                    >
                                                        削除確定
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmIdeaId(null)}
                                                        className="text-xs text-gray-400 hover:text-gray-200 whitespace-nowrap"
                                                    >
                                                        キャンセル
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setConfirmEpisodeId(null);
                                                        setConfirmIdeaId(idea.id);
                                                    }}
                                                    disabled={deletingIdeaIds.has(idea.id)}
                                                    className="text-xs text-red-300 hover:text-red-200 whitespace-nowrap disabled:opacity-50"
                                                >
                                                    削除
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="card p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <Calendar className="h-5 w-5 text-indigo-300" />
                            <h2 className="font-semibold">投稿</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href="/production" className="text-xs text-indigo-300 hover:text-indigo-200">
                                詳細管理 →
                            </Link>
                            <button
                                onClick={() => setShowEpisodes((prev) => !prev)}
                                className="text-xs text-gray-400 hover:text-gray-200"
                            >
                                {showEpisodes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <input
                            value={episodeTitle}
                            onChange={(e) => setEpisodeTitle(e.target.value)}
                            placeholder="投稿タイトル"
                            className="flex-1 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder:text-gray-600"
                        />
                        <button
                            onClick={() => handleCreateEpisode()}
                            disabled={episodeLoading}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                        >
                            {episodeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '追加'}
                        </button>
                    </div>

                    {showEpisodes && (
                        <div className="space-y-2">
                            {episodes.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-gray-800 bg-gray-950 px-4 py-6 text-center text-sm text-gray-400">
                                    <p className="text-sm text-gray-300">まだ投稿がありません。</p>
                                    <p className="mt-2 text-xs text-gray-500">
                                        スタジオで台本や素材を整えると、投稿作成がスムーズです。
                                    </p>
                                    <Link
                                        href="/studio"
                                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-xs font-medium text-gray-100 hover:bg-gray-700"
                                    >
                                        スタジオを開く
                                    </Link>
                                </div>
                            ) : (
                                episodes.slice(0, 6).map((episode) => (
                                    <div
                                        key={episode.id}
                                        className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-2"
                                    >
                                        <Link
                                            href={`/production/episodes/${episode.id}`}
                                            className="min-w-0 flex-1 hover:text-white"
                                        >
                                            <p className="text-sm text-white truncate">{episode.title}</p>
                                            <p className="text-xs text-gray-500">
                                                {getStatusLabel(episode.status)} · {formatDate(episode.updatedAt)}
                                            </p>
                                        </Link>
                                        <div className="ml-3 flex items-center gap-2">
                                            <Link
                                                href={`/production/episodes/${episode.id}`}
                                                className="text-xs text-gray-500 hover:text-gray-300"
                                            >
                                                →
                                            </Link>
                                            {confirmEpisodeId === episode.id ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleDeleteEpisode(episode.id)}
                                                        disabled={deletingEpisodeIds.has(episode.id)}
                                                        className="text-xs text-red-200 hover:text-red-100 disabled:opacity-50"
                                                    >
                                                        削除確定
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmEpisodeId(null)}
                                                        className="text-xs text-gray-400 hover:text-gray-200"
                                                    >
                                                        キャンセル
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setConfirmIdeaId(null);
                                                        setConfirmEpisodeId(episode.id);
                                                    }}
                                                    disabled={deletingEpisodeIds.has(episode.id)}
                                                    className="text-xs text-red-300 hover:text-red-200 disabled:opacity-50"
                                                >
                                                    削除
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Link
                    href="/studio"
                    className="group flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/60 p-4 hover:border-indigo-500/60"
                >
                    <div>
                        <p className="text-sm text-gray-400">制作スタジオ</p>
                        <h3 className="text-lg font-semibold text-white">動画制作を始める</h3>
                    </div>
                    <Video className="h-6 w-6 text-indigo-300 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                    href="/assets"
                    className="group flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/60 p-4 hover:border-indigo-500/60"
                >
                    <div>
                        <p className="text-sm text-gray-400">素材管理</p>
                        <h3 className="text-lg font-semibold text-white">素材ライブラリ</h3>
                    </div>
                    <ImageIcon className="h-6 w-6 text-indigo-300 group-hover:translate-x-1 transition-transform" />
                </Link>
            </section>
        </div>
    );
}
