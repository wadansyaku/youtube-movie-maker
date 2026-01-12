import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatDate, getStatusLabel, getStatusColor } from '@/lib/utils';

async function getEpisodes() {
    try {
        return await prisma.productionEpisode.findMany({
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                title: true,
                status: true,
                updatedAt: true,
                idea: {
                    select: { id: true, title: true },
                },
                _count: {
                    select: { tasks: true, sources: true },
                },
            },
        });
    } catch (error) {
        console.error('Failed to fetch episodes:', error);
        return [];
    }
}

export default async function ProductionPage() {
    const episodes = await getEpisodes();

    return (
        <div className="p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">投稿管理</h1>
                    <p className="text-sm text-gray-400 mt-1">公開状況と編集タスクを一覧で確認</p>
                </div>
                <Link href="/create" className="btn btn-secondary">
                    ワークスペースへ
                </Link>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800 text-sm text-gray-400">
                    エピソード一覧
                </div>

                {episodes.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">
                        <p>まだエピソードがありません</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-800">
                        {episodes.map((episode) => (
                            <Link
                                key={episode.id}
                                href={`/production/episodes/${episode.id}`}
                                className="block px-4 py-4 hover:bg-gray-800/40 transition-colors"
                            >
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div className="min-w-0">
                                        <p className="text-white font-medium truncate">{episode.title}</p>
                                        <p className="text-xs text-gray-500 mt-1 truncate">
                                            {episode.idea?.title ? `アイデア: ${episode.idea.title}` : 'アイデア: なし'}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                        <span className="flex items-center gap-2">
                                            <span className={`status-dot ${getStatusColor(episode.status)}`} />
                                            {getStatusLabel(episode.status)}
                                        </span>
                                        <span>更新: {formatDate(episode.updatedAt)}</span>
                                        <span>タスク {episode._count?.tasks ?? 0}</span>
                                        <span>ソース {episode._count?.sources ?? 0}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
