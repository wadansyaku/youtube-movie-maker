import DashboardView from '@/components/DashboardView';
import { prisma } from '@/lib/db';

async function getStats() {
    const [seriesCount, episodeCount, assetCount] = await Promise.all([
        prisma.series.count(),
        prisma.productionEpisode.count(),
        prisma.asset.count(),
    ]);
    return { seriesCount, episodeCount, assetCount };
}

async function getRecentSeries() {
    return prisma.series.findMany({
        take: 6,
        orderBy: { updatedAt: 'desc' },
        include: {
            _count: { select: { productionEpisodes: true } },
        },
    });
}

export default async function Dashboard() {
    const [stats, recentSeries] = await Promise.all([
        getStats(),
        getRecentSeries(),
    ]);

    // Serialize to avoid Date object issues in Client Component
    const plainRecentSeries = JSON.parse(JSON.stringify(recentSeries));

    return <DashboardView stats={stats} recentSeries={plainRecentSeries} />;
}
