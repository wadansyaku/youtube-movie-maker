import Link from 'next/link';
import { prisma } from '@/lib/db';
import AssetUploader from '@/components/asset/AssetUploader';
import AssetBrowser from '@/components/asset/AssetBrowser';

async function getAssets() {
    const assets = await prisma.asset.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            assetTags: {
                include: { tag: true },
            },
            episodeAssets: {
                include: {
                    episode: { include: { series: true } },
                },
            },
        },
    });
    return JSON.parse(JSON.stringify(assets)); // Serialize for client component
}

async function getTags() {
    const tags = await prisma.tag.findMany({
        orderBy: { name: 'asc' },
    });
    return JSON.parse(JSON.stringify(tags)); // Serialize for client component
}

export default async function AssetsPage() {
    const [assets, tags] = await Promise.all([getAssets(), getTags()]);

    return (
        <div className="max-w-[1600px] mx-auto animate-fade-in px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">Asset Library</h1>
                    <p className="text-[var(--muted)] text-sm mt-1">
                        Central repository for all project media
                    </p>
                </div>
                <div className="flex gap-4">
                    {/* Stats could go here */}
                </div>
            </div>

            {/* Upload Section - Collapsible or dedicated area */}
            <div className="mb-6">
                <AssetUploader />
            </div>

            {/* Browser Interface */}
            <AssetBrowser initialAssets={assets} tags={tags} />
        </div>
    );
}


