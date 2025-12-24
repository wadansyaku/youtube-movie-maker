"use client";

import { useState, useEffect } from "react";
import { X, Play, Image as ImageIcon, Music, FileText, Download, MessageSquare, CheckCircle, XCircle, AlertCircle } from "lucide-react";
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

    if (!isOpen || !asset) return null;

    const handleAddAnnotation = (x: number, y: number, time: number) => {
        console.log("Annotation added at:", { x, y, time });
        // In a real app, this would open a popover to enter a comment
        setShowFeedback(true); // Open feedback panel to show where comment would go
    };

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
                        {/* Placeholder for actual media player */}
                        <div className="text-center space-y-4 relative z-0">
                            {getAssetTypeIcon(asset.type)}
                            <p className="text-gray-500 text-sm">Preview functionality would play/render actual file here</p>
                            <p className="text-xs text-gray-700 font-mono">{asset.filePath}</p>
                        </div>

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
                                <button className="btn btn-primary flex items-center gap-2">
                                    <Download size={16} /> Download
                                </button>
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
