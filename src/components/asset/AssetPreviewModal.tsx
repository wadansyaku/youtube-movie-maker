"use client";

import { useMemo, useState, useEffect } from "react";
import { X, Download, MessageSquare } from "lucide-react";
import { getAssetTypeIcon, formatDate, formatFileSize } from "@/lib/utils";
import ReviewRequestModal from "@/components/review/ReviewRequestModal";
import FeedbackPanel from "@/components/review/FeedbackPanel";

interface AssetPreviewModalProps {
    asset: any;
    isOpen: boolean;
    onClose: () => void;
}

import AnnotationLayer from "@/components/review/AnnotationLayer";

export default function AssetPreviewModal({ asset, isOpen, onClose }: AssetPreviewModalProps) {
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [showAnnotations, setShowAnnotations] = useState(false);
    const [jsonPreview, setJsonPreview] = useState<string | null>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    const assetUrl = useMemo(() => {
        if (!asset?.id) return "";
        return `/api/assets/${asset.id}/file`;
    }, [asset?.id]);
    const isImage = !!asset && (asset.type === "image" || asset.type === "thumbnail" || (asset.mimeType || "").startsWith("image/"));
    const isVideo = !!asset && (asset.type === "video" || (asset.mimeType || "").startsWith("video/"));
    const isAudio = !!asset && (asset.type === "audio" || (asset.mimeType || "").startsWith("audio/"));
    const isJson = !!asset && (asset.type === "script" || (asset.mimeType || "").includes("json") || (asset.fileName || "").endsWith(".json"));
    const isVisible = Boolean(isOpen && asset);

    useEffect(() => {
        let active = true;

        if (!isVisible || !isJson) {
            setJsonPreview(null);
            setPreviewError(null);
            return;
        }

        setIsLoadingPreview(true);
        setPreviewError(null);

        fetch(assetUrl)
            .then((res) => {
                if (!res.ok) {
                    throw new Error("プレビューを取得できませんでした");
                }
                return res.text();
            })
            .then((text) => {
                if (!active) return;
                try {
                    const parsed = JSON.parse(text);
                    setJsonPreview(JSON.stringify(parsed, null, 2));
                } catch {
                    setJsonPreview(text);
                }
            })
            .catch((error) => {
                if (!active) return;
                setPreviewError(error instanceof Error ? error.message : "プレビューに失敗しました");
                setJsonPreview(null);
            })
            .finally(() => {
                if (!active) return;
                setIsLoadingPreview(false);
            });

        return () => {
            active = false;
        };
    }, [assetUrl, isJson, isVisible]);

    const handleAddAnnotation = (x: number, y: number, time: number) => {
        console.log("Annotation added at:", { x, y, time });
        // In a real app, this would open a popover to enter a comment
        setShowFeedback(true); // Open feedback panel to show where comment would go
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1a1a24] w-full max-w-6xl h-[85vh] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row">

                {/* Main Content (Preview) */}
                <div className="flex-1 flex flex-col min-w-0 bg-black/40 relative">
                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                        <button
                            onClick={() => setShowAnnotations(!showAnnotations)}
                            className={`p-2 rounded-full transition-colors ${showAnnotations ? "bg-indigo-600 text-white" : "bg-black/50 text-gray-400 hover:bg-black/80 hover:text-white"}`}
                            title="Toggle Annotations"
                        >
                            <span className="sr-only">Annotate</span>
                            <div className="w-5 h-5 border-2 border-current rounded-sm flex items-center justify-center text-[10px] font-bold">+</div>
                        </button>
                        <button
                            onClick={() => setShowFeedback(!showFeedback)}
                            className={`p-2 rounded-full transition-colors ${showFeedback ? "bg-indigo-600 text-white" : "bg-black/50 text-gray-400 hover:bg-black/80 hover:text-white"}`}
                            title="Toggle Feedback"
                        >
                            <MessageSquare size={20} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full bg-black/50 text-gray-400 hover:bg-black/80 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative">
                        {isImage && (
                            <img
                                src={assetUrl}
                                alt={asset.fileName}
                                className="max-h-full max-w-full rounded-lg object-contain shadow-xl"
                            />
                        )}

                        {isVideo && (
                            <video
                                src={assetUrl}
                                controls
                                className="max-h-full max-w-full rounded-lg shadow-xl"
                            />
                        )}

                        {isAudio && (
                            <div className="w-full max-w-xl rounded-lg border border-white/10 bg-black/40 p-6 text-center">
                                <div className="mb-4 text-4xl text-gray-500">{getAssetTypeIcon(asset.type)}</div>
                                <audio src={assetUrl} controls className="w-full" />
                            </div>
                        )}

                        {isJson && (
                            <div className="w-full max-w-3xl rounded-lg border border-white/10 bg-black/40 p-4 text-left text-xs text-gray-300">
                                {isLoadingPreview && <p className="text-gray-500">読み込み中...</p>}
                                {previewError && <p className="text-red-300">{previewError}</p>}
                                {jsonPreview && (
                                    <pre className="max-h-[55vh] overflow-auto whitespace-pre-wrap break-words">
                                        {jsonPreview}
                                    </pre>
                                )}
                            </div>
                        )}

                        {!isImage && !isVideo && !isAudio && !isJson && (
                            <div className="text-center space-y-4 relative z-0">
                                {getAssetTypeIcon(asset.type)}
                                <p className="text-gray-500 text-sm">プレビューに対応していません</p>
                                <p className="text-xs text-gray-700 font-mono">{asset.filePath}</p>
                            </div>
                        )}

                        {/* Annotation Layer Overlay */}
                        {showAnnotations && (
                            <div className="absolute inset-0 z-10">
                                <AnnotationLayer
                                    assetId={asset.id}
                                    onAddAnnotation={handleAddAnnotation}
                                    currentTime={0} // Mock current time
                                    width={100} // Mock dimensions
                                    height={100}
                                />
                            </div>
                        )}
                    </div>

                    {/* Metadata Footer (visible if feedback panel is closed or large screen) */}
                    <div className="p-6 border-t border-white/10 bg-[#1a1a24]">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-white max-w-lg truncate">{asset.fileName}</h3>
                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                    <span>{formatFileSize(asset.fileSize || 0)}</span>
                                    <span>•</span>
                                    <span>{formatDate(asset.createdAt)}</span>
                                    <span>•</span>
                                    <span className="uppercase">{asset.source}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsReviewOpen(true)}
                                    className="btn bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2"
                                >
                                    <MessageSquare size={16} /> Request Review
                                </button>
                                <a
                                    href={`${assetUrl}?download=1`}
                                    className="btn btn-primary flex items-center gap-2"
                                >
                                    <Download size={16} /> Download
                                </a>
                            </div>
                        </div>

                        {asset.generationParams && asset.generationParams !== "{}" && (
                            <div className="mt-4 p-3 bg-black/30 rounded-lg border border-white/5 font-mono text-xs text-gray-400 overflow-x-auto">
                                <pre>{JSON.stringify(JSON.parse(asset.generationParams), null, 2)}</pre>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar: Feedback Panel */}
                {showFeedback && (
                    <div className="w-full md:w-96 border-l border-white/10 bg-[#1a1a24] flex flex-col">
                        <FeedbackPanel assetId={asset.id} />
                    </div>
                )}
            </div>

            <ReviewRequestModal
                assetId={asset.id}
                assetName={asset.fileName}
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                currentUserId="admin-user"
            />
        </div>
    );
}
