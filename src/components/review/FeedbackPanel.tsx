"use client";

import { useState, useEffect } from "react";
import { Send, CheckCircle, XCircle, AlertCircle, User as UserIcon, Clock } from "lucide-react";
const STATUS_LABELS = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    revision_requested: "Revision Requested",
};

const STATUS_COLORS = {
    pending: "bg-gray-500",
    approved: "bg-green-500",
    rejected: "bg-red-500",
    revision_requested: "bg-yellow-500",
};

interface Review {
    id: string;
    status: string;
    feedback: string | null;
    reviewer: {
        name: string | null;
        image: string | null;
    };
    createdAt: string;
}

export default function FeedbackPanel({ assetId }: { assetId: string }) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState("");

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reviews?assetId=${assetId}`);
            const data = await res.json();
            if (data.reviews) {
                setReviews(data.reviews);
            }
        } catch (error) {
            console.error("Failed to fetch reviews", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [assetId]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved": return <span className="text-green-400 flex items-center gap-1 text-xs"><CheckCircle size={12} /> Approved</span>;
            case "rejected": return <span className="text-red-400 flex items-center gap-1 text-xs"><XCircle size={12} /> Rejected</span>;
            case "revision_requested": return <span className="text-yellow-400 flex items-center gap-1 text-xs"><AlertCircle size={12} /> Revision</span>;
            default: return <span className="text-gray-400 flex items-center gap-1 text-xs"><Clock size={12} /> Pending</span>;
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-white/10">
                <h3 className="font-bold text-white">Feedback & Reviews</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="text-center text-gray-500 text-sm mt-10">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm mt-10">No reviews yet.</div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="bg-white/5 rounded-lg p-3 border border-white/5 space-y-2">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs text-white">
                                        {review.reviewer.image ? <img src={review.reviewer.image} className="rounded-full" /> : <UserIcon size={12} />}
                                    </div>
                                    <span className="text-sm font-medium text-white">{review.reviewer.name || "Unknown"}</span>
                                </div>
                                <span className="text-[10px] text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                            </div>

                            <div className="pl-8">
                                <div className="mb-2">{getStatusBadge(review.status)}</div>
                                {review.feedback && (
                                    <p className="text-sm text-gray-300">{review.feedback}</p>
                                )}
                            </div>

                            {/* Action Buttons for Reviewer (Mocked logic: show if status is pending) */}
                            {review.status === "pending" && (
                                <div className="flex gap-2 pt-2 mt-2 border-t border-white/5 pl-8">
                                    <ActionButtons reviewId={review.id} onUpdate={fetchReviews} />
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Quick Comment Input (For general comments, not strictly linked to a specific review in this simple UI) */}
            <div className="p-4 border-t border-white/10 bg-black/20">
                <div className="relative">
                    <input
                        type="text"
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full bg-black/50 border border-white/10 rounded-full py-2 px-4 pr-10 text-sm text-white focus:border-indigo-500 outline-none"
                    />
                    <button className="absolute right-1 top-1 p-1.5 text-indigo-400 hover:text-white rounded-full">
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function ActionButtons({ reviewId, onUpdate }: { reviewId: string, onUpdate: () => void }) {
    const handleUpdate = async (status: string) => {
        await fetch("/api/reviews", {
            method: "PATCH",
            body: JSON.stringify({ id: reviewId, status, feedback: "Updated via Quick Action" }) // Simplified feedback
        });
        onUpdate();
    };

    return (
        <>
            <button onClick={() => handleUpdate("approved")} className="text-xs px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded hover:bg-green-500/20">Approve</button>
            <button onClick={() => handleUpdate("revision_requested")} className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded hover:bg-yellow-500/20">Request Changes</button>
        </>
    );
}
