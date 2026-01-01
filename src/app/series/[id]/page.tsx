import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import SeriesDetailView from '@/components/series/SeriesDetailView';

interface Props {
    params: Promise<{ id: string }>;
}

async function getSeries(id: string) {
    const series = await prisma.series.findUnique({
        where: { id },
        include: {
            worldBible: true,
            productionEpisodes: {
                orderBy: { episodeNumber: 'asc' },
                include: {
                    decisionLog: true,
                    _count: { select: { episodeAssets: true } },
                },
            },
            ideas: {
                orderBy: { updatedAt: 'desc' },
            },
            promptPacks: {
                include: { _count: { select: { prompts: true } } },
            },
        },
    });
    return series;
}

export default async function SeriesDetailPage({ params }: Props) {
    const { id } = await params;
    const series = await getSeries(id);

    if (!series) {
        notFound();
    }

    // Safety: Next.js warns/errors when passing Date objects to client components.
    // We serialize it to ensure it's a plain object (Dates become strings).
    // The Client Component's utils (formatDate) already handle string | Date.
    const plainSeries = JSON.parse(JSON.stringify(series));

    return <SeriesDetailView series={plainSeries} />;
}
