import { Suspense } from 'react';
import { prisma } from '@/lib/db';
import ProductionDashboard from '@/components/production/ProductionDashboard';
import { Film, Loader2 } from 'lucide-react';

// Loading component for Suspense
function ProductionLoading() {
    return (
        <div className="p-8 animate-fade-in">
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-4" />
                    <p className="text-gray-400">データを読み込んでいます...</p>
                </div>
            </div>
        </div>
    );
}

// Error fallback component
function ProductionError({ error }: { error?: string }) {
    return (
        <div className="p-8">
            <div className="card p-8 text-center border-red-500/30 bg-red-500/5">
                <div className="text-4xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold mb-2">データの取得に失敗しました</h2>
                <p className="text-gray-400 mb-4">{error || 'ネットワークエラーが発生しました'}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="btn btn-primary"
                >
                    再読み込み
                </button>
            </div>
        </div>
    );
}

async function getEpisodes() {
    try {
        const episodes = await prisma.productionEpisode.findMany({
            orderBy: { updatedAt: 'desc' },
            include: {
                idea: {
                    select: { id: true, title: true },
                },
                _count: {
                    select: { tasks: true, sources: true },
                },
            },
        });

        return episodes.map((ep) => ({
            ...ep,
            tags: JSON.parse(ep.tags),
        }));
    } catch (error) {
        console.error('Failed to fetch episodes:', error);
        return [];
    }
}

async function getIdeas() {
    try {
        const ideas = await prisma.idea.findMany({
            orderBy: { updatedAt: 'desc' },
            include: {
                _count: {
                    select: { productionEpisodes: true },
                },
            },
        });

        return ideas.map((idea) => ({
            ...idea,
            tags: JSON.parse(idea.tags),
        }));
    } catch (error) {
        console.error('Failed to fetch ideas:', error);
        return [];
    }
}

async function getStats() {
    try {
        const [
            totalIdeas,
            totalEpisodes,
            inProgress,
            published,
        ] = await Promise.all([
            prisma.idea.count(),
            prisma.productionEpisode.count(),
            prisma.productionEpisode.count({ where: { status: { notIn: ['published', 'archived'] } } }),
            prisma.productionEpisode.count({ where: { status: 'published' } }),
        ]);

        return { totalIdeas, totalEpisodes, inProgress, published };
    } catch (error) {
        console.error('Failed to fetch stats:', error);
        return { totalIdeas: 0, totalEpisodes: 0, inProgress: 0, published: 0 };
    }
}

async function ProductionContent() {
    const [episodes, ideas, stats] = await Promise.all([
        getEpisodes(),
        getIdeas(),
        getStats(),
    ]);

    return (
        <ProductionDashboard
            episodes={JSON.parse(JSON.stringify(episodes))}
            ideas={JSON.parse(JSON.stringify(ideas))}
            stats={stats}
        />
    );
}

export default function ProductionPage() {
    return (
        <Suspense fallback={<ProductionLoading />}>
            <ProductionContent />
        </Suspense>
    );
}
