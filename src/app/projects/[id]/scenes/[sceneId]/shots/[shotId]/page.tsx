"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Star,
    Check,
    Clock,
    FileVideo,
    Music,
    Image as ImageIcon,
    FileText,
    Wand2,
    ExternalLink,
    Plus,
    MessageSquare,
} from "lucide-react";
import { motion } from "framer-motion";

interface Asset {
    id: string;
    fileName: string;
    filePath: string;
    type: string;
    source: string;
    duration: number | null;
    generationRuns: {
        id: string;
        platform: string;
        modelVersion: string | null;
        prompt: string | null;
        costCredits: number | null;
        costUsd: number | null;
        createdAt: string;
    }[];
    reviews: {
        id: string;
        status: string;
        reviewer: { name: string | null };
    }[];
}

interface ShotAsset {
    shotId: string;
    assetId: string;
    role: string | null;
    asset: Asset;
}

interface Shot {
    id: string;
    name: string;
    description: string | null;
    orderIndex: number;
    durationSeconds: number | null;
    cameraMovement: string | null;
    heroAssetId: string | null;
    heroAsset: Asset | null;
    shotAssets: ShotAsset[];
    scene: {
        id: string;
        name: string;
        project: { id: string; name: string };
    };
}

const typeIcons: Record<string, React.ReactNode> = {
    video: <FileVideo size={20} className="text-blue-400" />,
    audio: <Music size={20} className="text-green-400" />,
    image: <ImageIcon size={20} className="text-amber-400" />,
    slides: <FileText size={20} className="text-indigo-400" />,
};

const platformColors: Record<string, string> = {
    runway: "bg-purple-500/20 text-purple-400",
    sora: "bg-cyan-500/20 text-cyan-400",
    veo: "bg-red-500/20 text-red-400",
    suno: "bg-orange-500/20 text-orange-400",
    dynamic_slides: "bg-indigo-500/20 text-indigo-400",
    manual: "bg-gray-500/20 text-gray-400",
};

export default function ShotDetailPage({
    params,
}: {
    params: Promise<{ id: string; sceneId: string; shotId: string }>;
}) {
    const { id: projectId, sceneId, shotId } = use(params);
    const router = useRouter();
    const [shot, setShot] = useState<Shot | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSettingHero, setIsSettingHero] = useState<string | null>(null);

    useEffect(() => {
        fetchShot();
    }, [shotId]);

    const fetchShot = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(
                `/api/projects/${projectId}/scenes/${sceneId}/shots/${shotId}`
            );
            if (!res.ok) {
                router.push(`/projects/${projectId}`);
                return;
            }
            const data = await res.json();
            setShot(data);
        } catch (error) {
            console.error("Failed to fetch shot:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetHero = async (assetId: string) => {
        setIsSettingHero(assetId);
        try {
            const res = await fetch(
                `/api/projects/${projectId}/scenes/${sceneId}/shots/${shotId}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ heroAssetId: assetId }),
                }
            );
            if (res.ok) {
                const updated = await res.json();
                setShot((prev) =>
                    prev
                        ? {
                            ...prev,
                            heroAssetId: updated.heroAssetId,
                            heroAsset: updated.heroAsset,
                        }
                        : null
                );
            }
        } catch (error) {
            console.error("Failed to set hero:", error);
        } finally {
            setIsSettingHero(null);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
            </div>
        );
    }

    if (!shot) return null;

    return (
        <div className="min-h-screen bg-gray-950 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                    <Link href={`/projects/${projectId}`} className="hover:text-white">
                        {shot.scene.project.name}
                    </Link>
                    <span>/</span>
                    <span>{shot.scene.name}</span>
                    <span>/</span>
                    <span className="text-white">{shot.name}</span>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/projects/${projectId}`}
                            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{shot.name}</h1>
                            {shot.description && (
                                <p className="text-gray-400 mt-1">{shot.description}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                        {shot.durationSeconds && (
                            <div className="flex items-center gap-1">
                                <Clock size={16} />
                                <span>{shot.durationSeconds}s</span>
                            </div>
                        )}
                        {shot.cameraMovement && (
                            <span className="px-2 py-1 bg-gray-800 rounded text-gray-300">
                                {shot.cameraMovement}
                            </span>
                        )}
                    </div>
                </div>

                {/* Hero Asset Section */}
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Star size={20} className="text-yellow-400" />
                        <h2 className="text-lg font-semibold text-white">Hero Asset</h2>
                    </div>

                    {shot.heroAsset ? (
                        <div className="flex items-start gap-4">
                            <div className="w-48 h-28 bg-gray-800 rounded-lg flex items-center justify-center">
                                {typeIcons[shot.heroAsset.type] || typeIcons.video}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-medium text-white">
                                        {shot.heroAsset.fileName}
                                    </h3>
                                    <span
                                        className={`px-2 py-0.5 rounded text-xs ${platformColors[shot.heroAsset.source] ||
                                            platformColors.manual
                                            }`}
                                    >
                                        {shot.heroAsset.source}
                                    </span>
                                </div>
                                {shot.heroAsset.generationRuns[0]?.prompt && (
                                    <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                                        {shot.heroAsset.generationRuns[0].prompt}
                                    </p>
                                )}
                                <button
                                    onClick={() => handleSetHero("")}
                                    className="text-sm text-red-400 hover:text-red-300"
                                >
                                    Hero解除
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Star size={32} className="mx-auto text-gray-600 mb-2" />
                            <p className="text-gray-400">
                                下のアセット候補からHeroを選択してください
                            </p>
                        </div>
                    )}
                </div>

                {/* Asset Candidates Grid */}
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white">アセット候補</h2>
                        <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-400 hover:text-indigo-300 hover:bg-gray-800 rounded-lg transition-colors">
                            <Plus size={16} />
                            アセットを追加
                        </button>
                    </div>

                    {shot.shotAssets.length === 0 ? (
                        <div className="text-center py-12">
                            <ImageIcon size={48} className="mx-auto text-gray-600 mb-4" />
                            <p className="text-gray-400 mb-4">まだアセットがありません</p>
                            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                                アセットをアップロード
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {shot.shotAssets.map(({ asset }) => {
                                const isHero = shot.heroAssetId === asset.id;
                                const latestRun = asset.generationRuns[0];
                                const latestReview = asset.reviews[0];

                                return (
                                    <motion.div
                                        key={asset.id}
                                        layout
                                        className={`relative bg-gray-800 rounded-xl overflow-hidden border-2 transition-colors ${isHero
                                                ? "border-yellow-500"
                                                : "border-transparent hover:border-gray-600"
                                            }`}
                                    >
                                        {/* Preview */}
                                        <div className="aspect-video bg-gray-900 flex items-center justify-center">
                                            {typeIcons[asset.type] || typeIcons.video}
                                        </div>

                                        {/* Info */}
                                        <div className="p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-medium text-white text-sm truncate">
                                                    {asset.fileName}
                                                </h3>
                                                <span
                                                    className={`px-1.5 py-0.5 rounded text-xs ${platformColors[asset.source] || platformColors.manual
                                                        }`}
                                                >
                                                    {asset.source}
                                                </span>
                                            </div>

                                            {latestRun?.prompt && (
                                                <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                                                    {latestRun.prompt}
                                                </p>
                                            )}

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {latestReview && (
                                                        <span
                                                            className={`text-xs ${latestReview.status === "approved"
                                                                    ? "text-green-400"
                                                                    : latestReview.status === "rejected"
                                                                        ? "text-red-400"
                                                                        : "text-yellow-400"
                                                                }`}
                                                        >
                                                            {latestReview.status}
                                                        </span>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => !isHero && handleSetHero(asset.id)}
                                                    disabled={isSettingHero === asset.id || isHero}
                                                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${isHero
                                                            ? "bg-yellow-500/20 text-yellow-400"
                                                            : "bg-gray-700 hover:bg-indigo-600 text-gray-300 hover:text-white"
                                                        }`}
                                                >
                                                    {isHero ? (
                                                        <>
                                                            <Check size={12} /> Hero
                                                        </>
                                                    ) : isSettingHero === asset.id ? (
                                                        "..."
                                                    ) : (
                                                        <>
                                                            <Star size={12} /> Set Hero
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Hero Badge */}
                                        {isHero && (
                                            <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-0.5 rounded text-xs font-medium">
                                                HERO
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Generation History */}
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mt-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Wand2 size={20} className="text-indigo-400" />
                        <h2 className="text-lg font-semibold text-white">Generation History</h2>
                    </div>

                    <div className="space-y-3">
                        {shot.shotAssets.flatMap(({ asset }) =>
                            asset.generationRuns.map((run) => (
                                <div
                                    key={run.id}
                                    className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg"
                                >
                                    <span
                                        className={`px-2 py-0.5 rounded text-xs ${platformColors[run.platform] || platformColors.manual
                                            }`}
                                    >
                                        {run.platform}
                                    </span>
                                    <span className="text-sm text-gray-300 flex-1 truncate">
                                        {run.prompt || "No prompt"}
                                    </span>
                                    {run.costCredits && (
                                        <span className="text-xs text-gray-500">
                                            {run.costCredits} credits
                                        </span>
                                    )}
                                    {run.costUsd && (
                                        <span className="text-xs text-green-400">
                                            ${run.costUsd.toFixed(2)}
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-500">
                                        {new Date(run.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            ))
                        )}
                        {shot.shotAssets.every((sa) => sa.asset.generationRuns.length === 0) && (
                            <p className="text-center text-gray-500 py-4">
                                No generation runs yet
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
