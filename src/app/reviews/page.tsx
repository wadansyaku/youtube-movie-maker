"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    MessageSquare,
    Plus,
    Filter,
    Play,
    Pause,
    Send,
    Trash2,
    FileVideo,
    Image as ImageIcon,
    Music,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Annotation {
    id: string;
    timecodeStart: number | null;
    timecodeEnd: number | null;
    comment: string;
    createdAt: string;
}

interface Review {
    id: string;
    assetId: string;
    reviewerId: string;
    status: string;
    feedback: string | null;
    revisionTemplate: string | null;
    createdAt: string;
    updatedAt: string;
    asset: {
        id: string;
        fileName: string;
        type: string;
        filePath: string;
        duration: number | null;
    };
    reviewer: {
        id: string;
        name: string | null;
        image: string | null;
    };
    annotations: Annotation[];
}

const statusConfig = {
    pending: {
        icon: Clock,
        color: "text-yellow-400",
        bg: "bg-yellow-500/20",
        label: "レビュー待ち",
    },
    approved: {
        icon: CheckCircle,
        color: "text-green-400",
        bg: "bg-green-500/20",
        label: "承認",
    },
    rejected: {
        icon: XCircle,
        color: "text-red-400",
        bg: "bg-red-500/20",
        label: "却下",
    },
    revision_requested: {
        icon: AlertCircle,
        color: "text-orange-400",
        bg: "bg-orange-500/20",
        label: "修正依頼",
    },
};

const typeIcons: Record<string, React.ReactNode> = {
    video: <FileVideo size={16} className="text-blue-400" />,
    audio: <Music size={16} className="text-green-400" />,
    image: <ImageIcon size={16} className="text-amber-400" />,
};

const revisionTemplates = [
    "色味調整が必要",
    "動きのタイミング修正",
    "解像度/品質の向上",
    "音声レベル調整",
    "構図の変更",
    "長さの調整",
    "その他",
];

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [newComment, setNewComment] = useState("");
    const [timecodeStart, setTimecodeStart] = useState("");
    const [timecodeEnd, setTimecodeEnd] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, [statusFilter]);

    const fetchReviews = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append("status", statusFilter);

            const res = await fetch(`/api/reviews?${params}`);
            const data = await res.json();
            setReviews(data.reviews || []);
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (reviewId: string, newStatus: string, template?: string) => {
        try {
            const res = await fetch(`/api/reviews/${reviewId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: newStatus,
                    revisionTemplate: template || null,
                }),
            });

            if (res.ok) {
                fetchReviews();
                if (selectedReview?.id === reviewId) {
                    const updated = await res.json();
                    setSelectedReview(updated);
                }
            }
        } catch (error) {
            console.error("Failed to update review:", error);
        }
    };

    const handleAddAnnotation = async () => {
        if (!selectedReview || !newComment.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/reviews/${selectedReview.id}/annotations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    comment: newComment,
                    timecodeStart: timecodeStart ? parseFloat(timecodeStart) : null,
                    timecodeEnd: timecodeEnd ? parseFloat(timecodeEnd) : null,
                }),
            });

            if (res.ok) {
                setNewComment("");
                setTimecodeStart("");
                setTimecodeEnd("");
                // Refresh review details
                const reviewRes = await fetch(`/api/reviews/${selectedReview.id}`);
                const updated = await reviewRes.json();
                setSelectedReview(updated);
            }
        } catch (error) {
            console.error("Failed to add annotation:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAnnotation = async (annotationId: string) => {
        if (!selectedReview) return;

        try {
            await fetch(`/api/reviews/${selectedReview.id}/annotations`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ annotationIds: [annotationId] }),
            });

            // Refresh review details
            const reviewRes = await fetch(`/api/reviews/${selectedReview.id}`);
            const updated = await reviewRes.json();
            setSelectedReview(updated);
        } catch (error) {
            console.error("Failed to delete annotation:", error);
        }
    };

    const formatTimecode = (seconds: number | null) => {
        if (seconds === null) return "--:--";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("ja-JP", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Reviews</h1>
                        <p className="text-gray-400 mt-1">アセットレビューと承認管理</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
                <Filter size={18} className="text-gray-400" />
                <div className="flex items-center gap-2">
                    {["", "pending", "approved", "rejected", "revision_requested"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${statusFilter === status
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                }`}
                        >
                            {status === ""
                                ? "すべて"
                                : statusConfig[status as keyof typeof statusConfig]?.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Reviews List */}
                <div className="lg:col-span-2 space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="bg-gray-900 border border-gray-700 rounded-xl p-12 text-center">
                            <MessageSquare size={48} className="mx-auto text-gray-600 mb-4" />
                            <p className="text-gray-400">レビューがありません</p>
                        </div>
                    ) : (
                        reviews.map((review) => {
                            const config = statusConfig[review.status as keyof typeof statusConfig];
                            const StatusIcon = config?.icon || Clock;

                            return (
                                <motion.div
                                    key={review.id}
                                    layout
                                    onClick={() => setSelectedReview(review)}
                                    className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-colors ${selectedReview?.id === review.id
                                        ? "border-indigo-500"
                                        : "border-gray-700 hover:border-gray-600"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
                                            {typeIcons[review.asset.type] || typeIcons.video}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium text-white truncate">
                                                    {review.asset.fileName}
                                                </h3>
                                                <span
                                                    className={`px-2 py-0.5 rounded text-xs ${config?.bg} ${config?.color}`}
                                                >
                                                    {config?.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                by {review.reviewer.name || "Unknown"} • {formatDate(review.createdAt)}
                                            </p>
                                            {review.annotations.length > 0 && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    <MessageSquare size={12} className="inline mr-1" />
                                                    {review.annotations.length} コメント
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStatusChange(review.id, "approved");
                                                }}
                                                className="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-800 rounded-lg"
                                                title="承認"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStatusChange(review.id, "rejected");
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg"
                                                title="却下"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>

                {/* Review Detail Panel */}
                <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                    {selectedReview ? (
                        <div className="h-full flex flex-col">
                            {/* Header */}
                            <div className="p-4 border-b border-gray-700">
                                <h3 className="font-medium text-white truncate">
                                    {selectedReview.asset.fileName}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {selectedReview.asset.duration
                                        ? `${formatTimecode(selectedReview.asset.duration)}`
                                        : "静止画"}
                                </p>
                            </div>

                            {/* Status Actions */}
                            <div className="p-4 border-b border-gray-700">
                                <p className="text-sm text-gray-400 mb-2">ステータス変更</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleStatusChange(selectedReview.id, "approved")}
                                        className="flex items-center justify-center gap-2 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30"
                                    >
                                        <CheckCircle size={16} /> 承認
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(selectedReview.id, "rejected")}
                                        className="flex items-center justify-center gap-2 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30"
                                    >
                                        <XCircle size={16} /> 却下
                                    </button>
                                </div>

                                {/* Revision Templates */}
                                <div className="mt-3">
                                    <p className="text-xs text-gray-500 mb-2">修正依頼テンプレート</p>
                                    <div className="flex flex-wrap gap-2">
                                        {revisionTemplates.map((template) => (
                                            <button
                                                key={template}
                                                onClick={() =>
                                                    handleStatusChange(selectedReview.id, "revision_requested", template)
                                                }
                                                className="px-2 py-1 text-xs bg-orange-600/20 text-orange-400 rounded hover:bg-orange-600/30"
                                            >
                                                {template}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Annotations */}
                            <div className="flex-1 overflow-y-auto p-4">
                                <p className="text-sm text-gray-400 mb-3">
                                    タイムコードコメント ({selectedReview.annotations.length})
                                </p>

                                <div className="space-y-3">
                                    {selectedReview.annotations.map((annotation) => (
                                        <div
                                            key={annotation.id}
                                            className="bg-gray-800 rounded-lg p-3"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs text-indigo-400 font-mono">
                                                    {formatTimecode(annotation.timecodeStart)}
                                                    {annotation.timecodeEnd &&
                                                        ` - ${formatTimecode(annotation.timecodeEnd)}`}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteAnnotation(annotation.id)}
                                                    className="p-1 text-gray-500 hover:text-red-400"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-300">{annotation.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Add Annotation */}
                            <div className="p-4 border-t border-gray-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="開始"
                                        value={timecodeStart}
                                        onChange={(e) => setTimecodeStart(e.target.value)}
                                        className="w-16 px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
                                    />
                                    <span className="text-gray-500">-</span>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="終了"
                                        value={timecodeEnd}
                                        onChange={(e) => setTimecodeEnd(e.target.value)}
                                        className="w-16 px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
                                    />
                                    <span className="text-gray-500 text-xs">秒</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="コメントを追加..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddAnnotation()}
                                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
                                    />
                                    <button
                                        onClick={handleAddAnnotation}
                                        disabled={isSubmitting || !newComment.trim()}
                                        className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 text-white rounded-lg"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center p-8">
                            <div className="text-center">
                                <MessageSquare size={32} className="mx-auto text-gray-600 mb-2" />
                                <p className="text-gray-500">レビューを選択してください</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
