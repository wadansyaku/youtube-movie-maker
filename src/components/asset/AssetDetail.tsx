"use client";

import { useState, useEffect } from "react";
import {
    X,
    Download,
    Share2,
    Edit2,
    Trash2,
    Clock,
    Tag,
    FileVideo,
    Music,
    Image as ImageIcon,
    History,
    MessageSquare,
    CheckCircle,
    XCircle,
    AlertCircle,
    ChevronRight,
    ExternalLink,
    Wand2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AssetVersion {
    id: string;
    fileName: string;
    version: number;
    createdAt: string;
}

interface GenerationRun {
    id: string;
    platform: string;
    modelVersion: string | null;
    prompt: string | null;
    negativePrompt: string | null;
    parameters: string;
    status: string;
    costCredits: number | null;
    generationTimeSeconds: number | null;
    createdAt: string;
}

interface Review {
    id: string;
    status: string;
    feedback: string | null;
    createdAt: string;
    reviewer: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
    };
    annotations: {
        id: string;
        timecodeStart: number | null;
        timecodeEnd: number | null;
        comment: string;
    }[];
}

interface Asset {
    id: string;
    fileName: string;
    filePath: string;
    type: string;
    source: string;
    fileSize: number | null;
    mimeType: string | null;
    duration: number | null;
    resolution: string | null;
    version: number;
    status: string;
    licenseType: string | null;
    creditRequired: string | null;
    metadata: string;
    generationParams: string;
    createdAt: string;
    updatedAt: string;
    parentAsset: AssetVersion | null;
    childVersions: AssetVersion[];
    generationRuns: GenerationRun[];
    reviews: Review[];
    assetTags: { tag: { id: string; name: string; color: string } }[];
}

interface AssetDetailProps {
    isOpen: boolean;
    onClose: () => void;
    assetId: string | null;
    onEdit?: (asset: Asset) => void;
    onDelete?: (assetId: string) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
    video: <FileVideo size={24} className="text-blue-400" />,
    audio: <Music size={24} className="text-green-400" />,
    image: <ImageIcon size={24} className="text-amber-400" />,
};

const platformColors: Record<string, string> = {
    runway: "bg-purple-500/20 text-purple-400",
    sora: "bg-cyan-500/20 text-cyan-400",
    veo: "bg-red-500/20 text-red-400",
    suno: "bg-orange-500/20 text-orange-400",
    manual: "bg-gray-500/20 text-gray-400",
};

const reviewStatusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    pending: { icon: <Clock size={16} />, color: "text-yellow-400" },
    approved: { icon: <CheckCircle size={16} />, color: "text-green-400" },
    rejected: { icon: <XCircle size={16} />, color: "text-red-400" },
    revision_requested: { icon: <AlertCircle size={16} />, color: "text-orange-400" },
};

export default function AssetDetail({
    isOpen,
    onClose,
    assetId,
    onEdit,
    onDelete,
}: AssetDetailProps) {
    const [asset, setAsset] = useState<Asset | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"details" | "versions" | "reviews">("details");

    useEffect(() => {
        if (isOpen && assetId) {
            fetchAsset();
        }
    }, [isOpen, assetId]);

    const fetchAsset = async () => {
        if (!assetId) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/assets/${assetId}`);
            const data = await res.json();
            setAsset(data);
        } catch (error) {
            console.error("Failed to fetch asset:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatFileSize = (bytes: number | null): string => {
        if (!bytes) return "-";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const formatDuration = (seconds: number | null): string => {
        if (!seconds) return "-";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const latestRun = asset?.generationRuns[0];
    const latestReview = asset?.reviews[0];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    <motion.div
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-gray-900 border-l border-gray-700 z-50 flex flex-col"
                    >
                        {isLoading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
                            </div>
                        ) : asset ? (
                            <>
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
                                    <div className="flex items-center gap-3">
                                        {typeIcons[asset.type] || typeIcons.video}
                                        <div>
                                            <h2 className="text-lg font-semibold text-white">{asset.fileName}</h2>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`px-2 py-0.5 rounded text-xs ${platformColors[asset.source] || platformColors.manual}`}>
                                                    {asset.source}
                                                </span>
                                                <span className="text-xs text-gray-500">v{asset.version}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                                            <Download size={18} />
                                        </button>
                                        <button
                                            onClick={() => onEdit?.(asset)}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm("Are you sure you want to delete this asset?")) {
                                                    onDelete?.(asset.id);
                                                    onClose();
                                                }
                                            }}
                                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex items-center gap-4 px-6 border-b border-gray-700">
                                    {(["details", "versions", "reviews"] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab
                                                    ? "text-indigo-400 border-indigo-400"
                                                    : "text-gray-400 border-transparent hover:text-white"
                                                }`}
                                        >
                                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                            {tab === "versions" && asset.childVersions.length > 0 && (
                                                <span className="ml-1 px-1.5 py-0.5 bg-gray-700 rounded text-xs">
                                                    {asset.childVersions.length + 1}
                                                </span>
                                            )}
                                            {tab === "reviews" && asset.reviews.length > 0 && (
                                                <span className="ml-1 px-1.5 py-0.5 bg-gray-700 rounded text-xs">
                                                    {asset.reviews.length}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    {activeTab === "details" && (
                                        <div className="space-y-6">
                                            {/* Preview placeholder */}
                                            <div className="aspect-video bg-gray-800 rounded-xl flex items-center justify-center">
                                                {typeIcons[asset.type]}
                                            </div>

                                            {/* File Info */}
                                            <div className="bg-gray-800/50 rounded-xl p-4">
                                                <h3 className="text-sm font-medium text-gray-300 mb-3">File Information</h3>
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <div>
                                                        <span className="text-gray-500">Type</span>
                                                        <p className="text-white capitalize">{asset.type}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Size</span>
                                                        <p className="text-white">{formatFileSize(asset.fileSize)}</p>
                                                    </div>
                                                    {asset.duration && (
                                                        <div>
                                                            <span className="text-gray-500">Duration</span>
                                                            <p className="text-white">{formatDuration(asset.duration)}</p>
                                                        </div>
                                                    )}
                                                    {asset.resolution && (
                                                        <div>
                                                            <span className="text-gray-500">Resolution</span>
                                                            <p className="text-white">{asset.resolution}</p>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="text-gray-500">Created</span>
                                                        <p className="text-white">{formatDate(asset.createdAt)}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Status</span>
                                                        <p className="text-white capitalize">{asset.status}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Generation Info */}
                                            {latestRun && (
                                                <div className="bg-gray-800/50 rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Wand2 size={16} className="text-indigo-400" />
                                                        <h3 className="text-sm font-medium text-gray-300">Generation Details</h3>
                                                    </div>
                                                    <div className="space-y-3 text-sm">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-gray-500">Platform</span>
                                                            <span className={`px-2 py-0.5 rounded text-xs ${platformColors[latestRun.platform]}`}>
                                                                {latestRun.platform}
                                                            </span>
                                                        </div>
                                                        {latestRun.modelVersion && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-500">Model</span>
                                                                <span className="text-white">{latestRun.modelVersion}</span>
                                                            </div>
                                                        )}
                                                        {latestRun.prompt && (
                                                            <div>
                                                                <span className="text-gray-500 block mb-1">Prompt</span>
                                                                <p className="text-white text-sm bg-gray-900 rounded-lg p-3">
                                                                    {latestRun.prompt}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {latestRun.costCredits && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-500">Cost</span>
                                                                <span className="text-white">{latestRun.costCredits} credits</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Tags */}
                                            {asset.assetTags.length > 0 && (
                                                <div className="bg-gray-800/50 rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Tag size={16} className="text-gray-400" />
                                                        <h3 className="text-sm font-medium text-gray-300">Tags</h3>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {asset.assetTags.map((at) => (
                                                            <span
                                                                key={at.tag.id}
                                                                className="px-2 py-1 rounded text-sm"
                                                                style={{
                                                                    backgroundColor: `${at.tag.color}20`,
                                                                    color: at.tag.color,
                                                                }}
                                                            >
                                                                {at.tag.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* License */}
                                            {(asset.licenseType || asset.creditRequired) && (
                                                <div className="bg-gray-800/50 rounded-xl p-4">
                                                    <h3 className="text-sm font-medium text-gray-300 mb-3">License</h3>
                                                    <div className="space-y-2 text-sm">
                                                        {asset.licenseType && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-500">Type</span>
                                                                <span className="text-white capitalize">{asset.licenseType.replace("_", " ")}</span>
                                                            </div>
                                                        )}
                                                        {asset.creditRequired && (
                                                            <div>
                                                                <span className="text-gray-500 block mb-1">Attribution</span>
                                                                <p className="text-white">{asset.creditRequired}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === "versions" && (
                                        <div className="space-y-4">
                                            {/* Current version */}
                                            <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-xl p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                            v{asset.version}
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium">{asset.fileName}</p>
                                                            <p className="text-sm text-gray-400">{formatDate(asset.createdAt)}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-indigo-400 bg-indigo-600/30 px-2 py-1 rounded">
                                                        Current
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Parent version */}
                                            {asset.parentAsset && (
                                                <div className="bg-gray-800/50 rounded-xl p-4 cursor-pointer hover:bg-gray-800 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 text-sm font-medium">
                                                                v{asset.parentAsset.version}
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-300">{asset.parentAsset.fileName}</p>
                                                                <p className="text-sm text-gray-500">Parent version</p>
                                                            </div>
                                                        </div>
                                                        <ChevronRight size={18} className="text-gray-500" />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Child versions */}
                                            {asset.childVersions.map((child) => (
                                                <div
                                                    key={child.id}
                                                    className="bg-gray-800/50 rounded-xl p-4 cursor-pointer hover:bg-gray-800 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 text-sm font-medium">
                                                                v{child.version}
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-300">{child.fileName}</p>
                                                                <p className="text-sm text-gray-500">{formatDate(child.createdAt)}</p>
                                                            </div>
                                                        </div>
                                                        <ChevronRight size={18} className="text-gray-500" />
                                                    </div>
                                                </div>
                                            ))}

                                            {asset.childVersions.length === 0 && !asset.parentAsset && (
                                                <div className="text-center py-8 text-gray-500">
                                                    <History size={32} className="mx-auto mb-2" />
                                                    <p>No version history</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === "reviews" && (
                                        <div className="space-y-4">
                                            {asset.reviews.length === 0 ? (
                                                <div className="text-center py-8 text-gray-500">
                                                    <MessageSquare size={32} className="mx-auto mb-2" />
                                                    <p>No reviews yet</p>
                                                    <button className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors">
                                                        Request Review
                                                    </button>
                                                </div>
                                            ) : (
                                                asset.reviews.map((review) => (
                                                    <div key={review.id} className="bg-gray-800/50 rounded-xl p-4">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                {review.reviewer.image ? (
                                                                    <img
                                                                        src={review.reviewer.image}
                                                                        alt={review.reviewer.name || ""}
                                                                        className="w-8 h-8 rounded-full"
                                                                    />
                                                                ) : (
                                                                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 text-sm">
                                                                        {review.reviewer.name?.[0] || "?"}
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <p className="text-white text-sm">{review.reviewer.name || review.reviewer.email}</p>
                                                                    <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                                                                </div>
                                                            </div>
                                                            <div className={`flex items-center gap-1 ${reviewStatusConfig[review.status]?.color || "text-gray-400"}`}>
                                                                {reviewStatusConfig[review.status]?.icon}
                                                                <span className="text-sm capitalize">{review.status.replace("_", " ")}</span>
                                                            </div>
                                                        </div>
                                                        {review.feedback && (
                                                            <p className="text-gray-300 text-sm">{review.feedback}</p>
                                                        )}
                                                        {review.annotations.length > 0 && (
                                                            <div className="mt-3 pt-3 border-t border-gray-700">
                                                                <p className="text-xs text-gray-500 mb-2">
                                                                    {review.annotations.length} annotation{review.annotations.length !== 1 ? "s" : ""}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-500">
                                Asset not found
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
