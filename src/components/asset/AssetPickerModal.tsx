"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import AssetPreviewModal from "@/components/asset/AssetPreviewModal";

type AssetRecord = {
    id: string;
    fileName: string;
    filePath: string;
    type: string;
    source: string;
    fileSize?: number | null;
    mimeType?: string | null;
    createdAt?: string;
    assetTags?: Array<{ tag: { id: string; name: string } }>;
};

type AssetTypeFilter = "all" | "audio" | "video" | "image" | "script";

interface AssetPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (asset: AssetRecord) => void;
    title?: string;
    filterType?: AssetTypeFilter;
    initialSearch?: string;
    suggestedTerms?: string[];
}

export default function AssetPickerModal({
    isOpen,
    onClose,
    onSelect,
    title = "素材を選択",
    filterType = "all",
    initialSearch = "",
    suggestedTerms = [],
}: AssetPickerModalProps) {
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [assets, setAssets] = useState<AssetRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewAsset, setPreviewAsset] = useState<AssetRecord | null>(null);

    const effectiveType = useMemo(() => filterType, [filterType]);
    const suggestionList = useMemo(() => suggestedTerms.filter(Boolean), [suggestedTerms]);

    useEffect(() => {
        if (!isOpen) return;
        const preset = initialSearch.trim();
        setSearchInput(preset);
        setSearchTerm(preset);
    }, [isOpen, initialSearch]);

    useEffect(() => {
        const timer = setTimeout(() => setSearchTerm(searchInput.trim()), 250);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (effectiveType !== "all") params.set("type", effectiveType);
        if (searchTerm) params.set("search", searchTerm);
        params.set("limit", "80");

        fetch(`/api/assets?${params.toString()}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error("素材の取得に失敗しました");
                }
                return res.json();
            })
            .then((data) => {
                setAssets(Array.isArray(data.assets) ? data.assets : []);
            })
            .catch((err) => {
                setError(err instanceof Error ? err.message : "素材の取得に失敗しました");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [effectiveType, searchTerm, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-4xl rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
                    <div>
                        <h3 className="text-sm font-semibold text-white">{title}</h3>
                        <p className="text-xs text-gray-500">検索して即挿入できます</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            <input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="素材名で検索"
                                className="w-full rounded-lg border border-gray-800 bg-black/40 py-2 pl-9 pr-3 text-sm text-white placeholder:text-gray-600"
                            />
                        </div>
                        <span className="rounded-full border border-gray-800 px-3 py-1 text-xs text-gray-400">
                            タイプ: {effectiveType === "all" ? "すべて" : effectiveType}
                        </span>
                        <span className="text-xs text-gray-500">{assets.length}件</span>
                    </div>
                    {suggestionList.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] text-gray-500">おすすめ:</span>
                            {suggestionList.map((term) => (
                                <button
                                    key={term}
                                    onClick={() => {
                                        setSearchInput(term);
                                        setSearchTerm(term);
                                    }}
                                    className="rounded-full border border-gray-800 px-2 py-1 text-[11px] text-gray-300 hover:border-indigo-500/60 hover:text-white"
                                >
                                    {term}
                                </button>
                            ))}
                        </div>
                    )}

                    {error && (
                        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                            {error}
                        </div>
                    )}

                    <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-gray-800">
                        {loading ? (
                            <div className="p-6 text-center text-sm text-gray-500">読み込み中...</div>
                        ) : assets.length === 0 ? (
                            <div className="p-6 text-center text-sm text-gray-500">該当する素材がありません</div>
                        ) : (
                            <div className="divide-y divide-gray-800">
                                {assets.map((asset) => (
                                    <div key={asset.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                                        <div className="min-w-[220px] flex-1">
                                            <p className="text-sm text-white">{asset.fileName}</p>
                                            <p className="text-[11px] text-gray-500">
                                                {asset.type} · {asset.source || "manual"}
                                                {asset.fileSize ? ` · ${formatFileSize(asset.fileSize)}` : ""}
                                            </p>
                                            <p className="text-[11px] text-gray-600 truncate">{asset.filePath}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setPreviewAsset(asset)}
                                                className="rounded-lg border border-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:border-gray-600"
                                            >
                                                プレビュー
                                            </button>
                                            <button
                                                onClick={() => onSelect(asset)}
                                                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-500"
                                            >
                                                挿入
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
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
