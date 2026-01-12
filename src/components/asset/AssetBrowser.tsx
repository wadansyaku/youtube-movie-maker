"use client";

import { useEffect, useMemo, useState } from "react";
import { getAssetTypeIcon, formatFileSize } from "@/lib/utils";
import { Folder, Eye, Search } from "lucide-react";
import AssetPreviewModal from "@/components/asset/AssetPreviewModal";

interface AssetBrowserProps {
    initialAssets: any[];
    tags: any[];
}

export default function AssetBrowser({ initialAssets, tags }: AssetBrowserProps) {
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [selectedCollection, setSelectedCollection] = useState("all");
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [previewAsset, setPreviewAsset] = useState<any>(null);

    const collections = [
        { id: "all", label: "All Assets" },
        { id: "ai-shorts", label: "AI Shorts" },
        { id: "manual", label: "Manual Uploads" },
        { id: "generated", label: "AI Generated" },
    ];

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(searchInput.trim().toLowerCase());
        }, 250);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const isImageAsset = (asset: any) =>
        asset.type === "image" || asset.type === "thumbnail" || (asset.mimeType || "").startsWith("image/");
    const isVideoAsset = (asset: any) =>
        asset.type === "video" || (asset.mimeType || "").startsWith("video/");
    const isAudioAsset = (asset: any) =>
        asset.type === "audio" || (asset.mimeType || "").startsWith("audio/");
    const isJsonAsset = (asset: any) =>
        asset.type === "script" || (asset.mimeType || "").includes("json") || (asset.fileName || "").endsWith(".json");

    const hasTagName = (asset: any, tagName: string) =>
        asset.assetTags?.some((at: any) => at.tag?.name === tagName);

    const getMetadata = (asset: any) => {
        try {
            const parsed = JSON.parse(asset.metadata || "{}");
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch {
            return {};
        }
    };

    const getThumbnailUrl = (asset: any) => {
        const metadata = getMetadata(asset);
        return metadata?.thumbnailPath ? `/api/assets/${asset.id}/thumbnail` : null;
    };

    const filteredAssets = useMemo(() => {
        return initialAssets.filter((asset) => {
            if (selectedTag && !asset.assetTags?.some((at: any) => at.tag.id === selectedTag)) {
                return false;
            }

            if (selectedCollection === "ai-shorts" && !(hasTagName(asset, "AI Shorts") || asset.source === "ai-shorts")) {
                return false;
            }
            if (selectedCollection === "manual" && asset.source !== "manual") {
                return false;
            }
            if (selectedCollection === "generated" && asset.source === "manual") {
                return false;
            }

            if (selectedType === "image" && !isImageAsset(asset)) return false;
            if (selectedType === "video" && !isVideoAsset(asset)) return false;
            if (selectedType === "audio" && !isAudioAsset(asset)) return false;
            if (selectedType === "json" && !isJsonAsset(asset)) return false;

            if (searchTerm) {
                const target = `${asset.fileName || ""} ${asset.filePath || ""}`.toLowerCase();
                if (!target.includes(searchTerm)) return false;
            }

            return true;
        });
    }, [initialAssets, selectedTag, selectedCollection, selectedType, searchTerm]);

    return (
        <div className="flex gap-6 h-[calc(100vh-200px)]">
            {/* Left Sidebar: Collections (Tags) */}
            <div className="w-64 flex-shrink-0 border-r border-white/10 pr-6 overflow-y-auto">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Collections</h3>
                {collections.map((collection) => (
                    <button
                        key={collection.id}
                        onClick={() => setSelectedCollection(collection.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 flex items-center gap-2 transition-colors ${selectedCollection === collection.id
                            ? "bg-primary-500/20 text-primary-400"
                            : "hover:bg-white/5 text-gray-400"
                            }`}
                    >
                        <Folder size={16} /> {collection.label}
                    </button>
                ))}

                <div className="mt-6">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Tags</h3>
                    <button
                        onClick={() => setSelectedTag(null)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 flex items-center gap-2 transition-colors ${!selectedTag
                            ? "bg-primary-500/20 text-primary-400"
                            : "hover:bg-white/5 text-gray-400"
                            }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-gray-600" />
                        All Tags
                    </button>
                    {tags.map(tag => (
                        <button
                            key={tag.id}
                            onClick={() => setSelectedTag(tag.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 flex items-center gap-2 transition-colors ${selectedTag === tag.id
                                ? "bg-primary-500/20 text-primary-400"
                                : "hover:bg-white/5 text-gray-400"
                                }`}
                        >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                            {tag.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content: Grid */}
            <div className="flex-1 overflow-y-auto">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="ファイル名で検索"
                            className="w-full rounded-lg border border-gray-800 bg-gray-950 py-2 pl-9 pr-3 text-sm text-white placeholder:text-gray-600"
                        />
                    </div>
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white"
                    >
                        <option value="all">すべて</option>
                        <option value="image">画像</option>
                        <option value="video">動画</option>
                        <option value="audio">音声</option>
                        <option value="json">JSON</option>
                    </select>
                    <div className="text-xs text-gray-500">
                        {filteredAssets.length} 件
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredAssets.map((asset) => {
                        const thumbnailUrl = getThumbnailUrl(asset);
                        return (
                            <div
                                key={asset.id}
                                onClick={() => setPreviewAsset(asset)}
                                className="card p-4 hover:border-primary-500/50 cursor-pointer group transition-all"
                            >
                                <div className="aspect-video bg-black/40 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                                    {isImageAsset(asset) ? (
                                        <img
                                            src={`/api/assets/${asset.id}/file`}
                                            alt={asset.fileName}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : isVideoAsset(asset) ? (
                                        thumbnailUrl ? (
                                            <img
                                                src={thumbnailUrl}
                                                alt={`${asset.fileName} thumbnail`}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <video
                                                src={`/api/assets/${asset.id}/file`}
                                                className="h-full w-full object-cover"
                                                muted
                                                playsInline
                                                preload="metadata"
                                            />
                                        )
                                    ) : (
                                        <div className="text-4xl opacity-50">{getAssetTypeIcon(asset.type)}</div>
                                    )}

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                        <Eye size={24} />
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate text-sm text-gray-200">{asset.fileName}</div>
                                        <div className="flex items-center justify-between mt-1">
                                            <div className="text-xs text-[var(--muted)]">
                                                {asset.fileSize ? formatFileSize(asset.fileSize) : 'Unknown size'}
                                            </div>
                                            {asset.source !== 'manual' && (
                                                <span className="text-[10px] uppercase tracking-wider bg-white/10 px-1.5 rounded text-gray-400">
                                                    {asset.source}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredAssets.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-gray-700 rounded-xl mx-4">
                        <Folder size={64} className="mx-auto mb-4 text-gray-600" />
                        <p className="text-gray-400 text-lg mb-2">素材がありません</p>
                        <p className="text-gray-500 text-sm mb-6">
                            上部のエリアにファイルをドラッグ&ドロップ、<br />
                            またはクリックしてアップロード
                        </p>
                    </div>
                )}
            </div>

            {previewAsset && (
                <AssetPreviewModal
                    asset={previewAsset}
                    isOpen={!!previewAsset}
                    onClose={() => setPreviewAsset(null)}
                />
            )}
        </div>
    );
}
