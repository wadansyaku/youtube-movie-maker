import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import WorldBibleEditor from '@/components/series/WorldBibleEditor';

interface Props {
    params: Promise<{ id: string }>;
}

async function getSeriesWithWorldBible(id: string) {
    return prisma.series.findUnique({
        where: { id },
        include: { worldBible: true },
    });
}

export default async function WorldBiblePage({ params }: Props) {
    const { id } = await params;
    const series = await getSeriesWithWorldBible(id);

    if (!series || !series.worldBible) {
        notFound();
    }

    return (
        <WorldBibleEditor
            seriesId={series.id}
            seriesTitle={series.title}
            worldBible={series.worldBible}
        />
    );
}
