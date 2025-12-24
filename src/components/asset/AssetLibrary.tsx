"use client";

import { useState, useEffect } from "react";
import {
    Search,
    Filter,
    Grid,
    List,
    Image as ImageIcon,
    FileVideo,
    Music,
    FileText,
    MoreVertical,
    Eye,
    Download,
    Trash2,
    Tag,
    Clock,
    Upload,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FileUpload from "./FileUpload";

interface Asset {
    id: string;
    fileName: string;
    filePath: string;
    type: string;
    source: string;
    fileSize: number | null;
    duration: number | null;
    resolution: string | null;
    status: string;
    version: number;
    createdAt: string;
    assetTags: { tag: { id: string; name: string; color: string } }[];
    generationRuns: {
        id: string;
        platform: string;
        prompt: string | null;
        modelVersion: string | null;
    }[];
    reviews: {
        id: string;
        status: string;
        reviewer: { name: string | null; image: string | null } | null;
    }[];
    _count: {
        projectAssets: number;
        shotAssets: number;
        childVersions: number;
    };
}

interface AssetLibraryProps {
    projectId?: string;
    onAssetSelect?: (asset: Asset) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
    video: <FileVideo size={20} className="text-blue-400" />,
    audio: <Music size={20} className="text-green-400" />,
    image: <ImageIcon size={20} className="text-amber-400" />,
    slides: <FileText size={20} className="text-indigo-400" />,
};

const sourceLabels: Record<string, { label: string; color: string }> = {
    runway: { label: "Runway", color: "bg-purple-500/20 text-purple-400" },
    sora: { label: "Sora", color: "bg-cyan-500/20 text-cyan-400" },
    veo: { label: "Veo", color: "bg-red-500/20 text-red-400" },
    suno: { label: "Suno", color: "bg-orange-500/20 text-orange-400" },
    dynamic_slides: { label: "Dynamic Slides", color: "bg-indigo-500/20 text-indigo-400" },
    manual: { label: "Manual", color: "bg-gray-500/20 text-gray-400" },
};

const reviewStatusColors: Record<string, string> = {
    pending: "border-yellow-500",
    approved: "border-green-500",
    rejected: "border-red-500",
    revision_requested: "border-orange-500",
};

export default function AssetLibrary({
    projectId,
    onAssetSelect,
}: AssetLibraryProps) {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [sourceFilter, setSourceFilter] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [showUpload, setShowUpload] = useState(false);
    const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchAssets();
    }, [projectId, typeFilter, sourceFilter, searchQuery]);

    const fetchAssets = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (projectId) params.append("projectId", projectId);
            if (typeFilter) params.append("type", typeFilter);
            if (sourceFilter) params.append("source", sourceFilter);
            if (searchQuery) params.append("search", searchQuery);

            const res = await fetch(`/api/assets?${params}`);
            const data = await res.json();
            setAssets(data.assets || []);
        } catch (error) {
            console.error("Failed to fetch assets:", error);
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
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const toggleAssetSelection = (assetId: string) => {
        setSelectedAssets((prev) => {
            const next = new Set(prev);
            if (next.has(assetId)) {
                next.delete(assetId);
            } else {
                next.add(assetId);
            }
            return next;
        });
    };

    const handleUploadComplete = async (
        files: { key: string; name: string; type: string; size: number }[]
    ) => {
        // Create assets for uploaded files
        for (const file of files) {
            try {
                await fetch("/api/assets", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fileName: file.name,
                        filePath: file.key,
                        type: file.type,
                        source: "manual",
                        fileSize: file.size,
                        projectId,
                    }),
                });
            } catch (error) {
                console.error("Failed to create asset:", error);
            }
        }

        setShowUpload(false);
        fetchAssets();
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Asset Library</h2>
                <button
                    onClick={() => setShowUpload(!showUpload)}
                    className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                    <Upload size={18} />
                    Import Assets
                </button>
            </div>

            {/* Upload Section */}
            <AnimatePresence>
                {showUpload && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-900 border border-gray-700 rounded-xl p-4"
                    >
                        <FileUpload
                            onUploadComplete={handleUploadComplete}
                            projectId={projectId}
                            allowedTypes={["video", "audio", "image"]}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-400" />
                    <select
                        value={typeFilter || ""}
                        onChange={(e) => setTypeFilter(e.target.value || null)}
                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Types</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="image">Image</option>
                        <option value="slides">Slides</option>
                    </select>
                    <select
                        value={sourceFilter || ""}
                        onChange={(e) => setSourceFilter(e.target.value || null)}
                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Sources</option>
                        <option value="runway">Runway</option>
                        <option value="sora">Sora</option>
                        <option value="veo">Veo</option>
                        <option value="suno">Suno</option>
                        <option value="dynamic_slides">Dynamic Slides</option>
                        <option value="manual">Manual</option>
                    </select>
                </div>

                <div className="flex items-center gap-1 ml-auto">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
                            }`}
                    >
                        <Grid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
                            }`}
                    >
                        <List size={20} />
                    </button>
                </div>
            </div>

            {/* Selected Actions */}
            {selectedAssets.size > 0 && (
                <div className="flex items-center gap-4 p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-lg">
                    <span className="text-sm text-white">
                        {selectedAssets.size} selected
                    </span>
                    <button className="text-sm text-gray-300 hover:text-white">
                        Add to Shot
                    </button>
                    <button className="text-sm text-gray-300 hover:text-white">
                        Request Review
                    </button>
                    <button className="text-sm text-red-400 hover:text-red-300">
                        Delete
                    </button>
                    <button
                        onClick={() => setSelectedAssets(new Set())}
                        className="text-sm text-gray-400 hover:text-white ml-auto"
                    >
                        Clear selection
                    </button>
                </div>
            )}

            {/* Asset Grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="aspect-video bg-gray-800 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : assets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <ImageIcon size={48} className="mb-4" />
                    <p className="text-lg">No assets found</p>
                    <p className="text-sm mt-2">Import assets to get started</p>
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {assets.map((asset) => (
                        <motion.div
                            key={asset.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => onAssetSelect?.(asset)}
                            className={`group relative bg-gray-800 border rounded-xl overflow-hidden cursor-pointer transition-all hover:border-indigo-500 ${selectedAssets.has(asset.id)
                                    ? "border-indigo-500 ring-2 ring-indigo-500/50"
                                    : asset.reviews[0]
                                        ? reviewStatusColors[asset.reviews[0].status] || "border-gray-700"
                                        : "border-gray-700"
                                }`}
                        >
                            {/* Thumbnail */}
                            <div className="aspect-video bg-gray-900 flex items-center justify-center">
                                {typeIcons[asset.type] || typeIcons.image}
                            </div>

                            {/* Selection Checkbox */}
                            <div
                                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleAssetSelection(asset.id);
                                }}
                            >
                                <div
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedAssets.has(asset.id)
                                            ? "bg-indigo-600 border-indigo-600"
                                            : "border-white/50 bg-black/50"
                                        }`}
                                >
                                    {selectedAssets.has(asset.id) && (
                                        <span className="text-white text-xs">✓</span>
                                    )}
                                </div>
                            </div>

                            {/* Source Badge */}
                            {asset.source && sourceLabels[asset.source] && (
                                <div
                                    className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs ${sourceLabels[asset.source].color
                                        }`}
                                >
                                    {sourceLabels[asset.source].label}
                                </div>
                            )}

                            {/* Info */}
                            <div className="p-3">
                                <p className="text-sm text-white truncate">{asset.fileName}</p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                    <span>{formatFileSize(asset.fileSize)}</span>
                                    {asset.duration && (
                                        <>
                                            <span>•</span>
                                            <span>{formatDuration(asset.duration)}</span>
                                        </>
                                    )}
                                </div>
                                {asset.assetTags.length > 0 && (
                                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                                        {asset.assetTags.slice(0, 3).map((at) => (
                                            <span
                                                key={at.tag.id}
                                                className="px-1.5 py-0.5 text-xs rounded"
                                                style={{
                                                    backgroundColor: `${at.tag.color}20`,
                                                    color: at.tag.color,
                                                }}
                                            >
                                                {at.tag.name}
                                            </span>
                                        ))}
                                        {asset.assetTags.length > 3 && (
                                            <span className="text-xs text-gray-500">
                                                +{asset.assetTags.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                    <table className="w-full">
                        <thead className="bg-gray-900">
                            <tr>
                                <th className="w-8 p-3"></th>
                                <th className="text-left p-3 text-gray-400 font-medium">Name</th>
                                <th className="text-left p-3 text-gray-400 font-medium">Type</th>
                                <th className="text-left p-3 text-gray-400 font-medium">Source</th>
                                <th className="text-left p-3 text-gray-400 font-medium">Size</th>
                                <th className="text-left p-3 text-gray-400 font-medium">Duration</th>
                                <th className="text-left p-3 text-gray-400 font-medium">Created</th>
                                <th className="w-10 p-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.map((asset) => (
                                <tr
                                    key={asset.id}
                                    onClick={() => onAssetSelect?.(asset)}
                                    className={`border-t border-gray-700 hover:bg-gray-750 cursor-pointer ${selectedAssets.has(asset.id) ? "bg-indigo-600/10" : ""
                                        }`}
                                >
                                    <td className="p-3">
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleAssetSelection(asset.id);
                                            }}
                                            className={`w-4 h-4 rounded border flex items-center justify-center ${selectedAssets.has(asset.id)
                                                    ? "bg-indigo-600 border-indigo-600"
                                                    : "border-gray-500"
                                                }`}
                                        >
                                            {selectedAssets.has(asset.id) && (
                                                <span className="text-white text-[10px]">✓</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            {typeIcons[asset.type]}
                                            <span className="text-white">{asset.fileName}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-gray-300 capitalize">{asset.type}</td>
                                    <td className="p-3">
                                        {sourceLabels[asset.source] && (
                                            <span className={`px-2 py-0.5 rounded text-xs ${sourceLabels[asset.source].color}`}>
                                                {sourceLabels[asset.source].label}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3 text-gray-400">{formatFileSize(asset.fileSize)}</td>
                                    <td className="p-3 text-gray-400">{formatDuration(asset.duration)}</td>
                                    <td className="p-3 text-gray-500 text-sm">{formatDate(asset.createdAt)}</td>
                                    <td className="p-3">
                                        <button className="p-1 text-gray-400 hover:text-white">
                                            <MoreVertical size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
