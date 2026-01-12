import WorkspaceView from '@/components/workspace/WorkspaceView';
import { prisma } from '@/lib/db';

async function getIdeas() {
    return prisma.idea.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: { id: true, title: true, status: true, updatedAt: true },
    });
}

async function getEpisodes() {
    return prisma.productionEpisode.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: { id: true, title: true, status: true, updatedAt: true },
    });
}

export default async function CreatePage() {
    const [ideas, episodes] = await Promise.all([getIdeas(), getEpisodes()]);

    return (
        <WorkspaceView
            initialIdeas={JSON.parse(JSON.stringify(ideas))}
            initialEpisodes={JSON.parse(JSON.stringify(episodes))}
        />
    );
}
