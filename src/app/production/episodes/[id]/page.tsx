import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import EpisodeDetailView from '@/components/production/EpisodeDetailView';

interface PageProps {
    params: Promise<{ id: string }>;
}

async function getEpisode(id: string) {
    const episode = await prisma.productionEpisode.findUnique({
        where: { id },
        include: {
            idea: true,
            parentEpisode: {
                select: { id: true, title: true, variant: true },
            },
            childVariants: {
                select: { id: true, title: true, variant: true, status: true },
            },
            tasks: {
                orderBy: [{ status: 'asc' }, { priority: 'desc' }],
            },
            sources: {
                orderBy: { createdAt: 'desc' },
            },
            generationPrompts: {
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    if (!episode) return null;

    return {
        ...episode,
        tags: JSON.parse(episode.tags),
        youtubeTags: JSON.parse(episode.youtubeTags),
        ttsDictionary: JSON.parse(episode.ttsDictionary),
        scriptContent: JSON.parse(episode.scriptContent),
        originalityChecks: JSON.parse(episode.originalityChecks),
        idea: episode.idea ? {
            ...episode.idea,
            tags: JSON.parse(episode.idea.tags),
        } : null,
        tasks: episode.tasks.map((t) => ({
            ...t,
            tags: JSON.parse(t.tags),
        })),
        sources: episode.sources.map((s) => ({
            ...s,
            tags: JSON.parse(s.tags),
        })),
    };
}

async function getTemplates(lane: string | null, variant: string) {
    const laneFilters = lane ? [{ lane }, { lane: null }] : [{ lane: null }];

    const templates = await prisma.productionTemplate.findMany({
        where: {
            OR: laneFilters,
            type: variant === 'shorts' ? 'shorts_script' : 'long_script',
        },
        orderBy: { isDefault: 'desc' },
    });

    return templates.map((t) => ({
        ...t,
        content: JSON.parse(t.content),
        variables: JSON.parse(t.variables),
    }));
}

export default async function EpisodeDetailPage({ params }: PageProps) {
    const { id } = await params;
    const episode = await getEpisode(id);

    if (!episode) {
        notFound();
    }

    const templates = await getTemplates(episode.lane, episode.variant);

    return (
        <EpisodeDetailView
            episode={JSON.parse(JSON.stringify(episode))}
            templates={JSON.parse(JSON.stringify(templates))}
        />
    );
}
