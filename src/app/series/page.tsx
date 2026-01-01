import Link from 'next/link';
import { prisma } from '@/lib/db';
import SeriesListView from '@/components/series/SeriesListView';

async function getSeries() {
    return prisma.series.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
            _count: { select: { productionEpisodes: true, promptPacks: true } },
        },
    });
}

export default async function SeriesPage() {
    const seriesList = await getSeries();

    // Serialize to avoid Date object issues in Client Component
    const plainSeriesList = JSON.parse(JSON.stringify(seriesList));

    return <SeriesListView seriesList={plainSeriesList} />;
}
