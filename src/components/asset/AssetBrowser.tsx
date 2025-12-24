"use client";

import { useState } from "react";
import { getAssetTypeIcon, formatDate, formatFileSize } from "@/lib/utils";
import Link from "next/link";
import { X, Play, Image as ImageIcon, Music, FileText, Folder, Eye, Download, MessageSquare } from "lucide-react";
import AssetPreviewModal from "@/components/asset/AssetPreviewModal";

interface AssetBrowserProps {
    initialAssets: any[];
    tags: any[];
}

export default function AssetBrowser({ initialAssets, tags }: AssetBrowserProps) {
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [previewAsset, setPreviewAsset] = useState<any>(null);


    // Filter Filter
    const filteredAssets = selectedTag
        ? initialAssets.filter(a => a.assetTags.some((at: any) => at.tag.id === selectedTag))
        : initialAssets;

    return (
        <div className="flex gap-6 h-[calc(100vh-200px)]">
            {/* Left Sidebar: Collections (Tags) */}
            <div className="w-64 flex-shrink-0 border-r border-white/10 pr-6 overflow-y-auto">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Collections</h3>
                <button
                    onClick={() => setSelectedTag(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 flex items-center gap-2 transition-colors ${!selectedTag ? "bg-primary-500/20 text-primary-400" : "hover:bg-white/5 text-gray-400"
                        }`}
                >
                    <Folder size={16} /> All Assets
                </button>
                {tags.map(tag => (
                    <button
                        key={tag.id}
                        onClick={() => setSelectedTag(tag.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 flex items-center gap-2 transition-colors ${selectedTag === tag.id ? "bg-primary-500/20 text-primary-400" : "hover:bg-white/5 text-gray-400"
                            }`}
                    >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                        {tag.name}
                    </button>
                ))}
            </div>

            {/* Main Content: Grid */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredAssets.map((asset) => (
                        <div
                            key={asset.id}
                            onClick={() => setPreviewAsset(asset)}
                            className="card p-4 hover:border-primary-500/50 cursor-pointer group transition-all"
                        >
                            <div className="aspect-video bg-black/40 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                                {asset.type === 'image' || asset.type === 'video' ? (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-700">
                                        {/* In real app, render <img src={asset.filePath} /> if accessible */}
                                        {getAssetTypeIcon(asset.type)}
                                    </div>
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
                    ))}
                </div>

                {filteredAssets.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        <Folder size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No assets found in this collection</p>
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
