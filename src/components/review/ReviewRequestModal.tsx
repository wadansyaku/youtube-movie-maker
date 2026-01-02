"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from "react";
import { X, User as UserIcon, Send } from "lucide-react";

interface User {
    id: string;
    name: string | null;
    image: string | null;
    email: string;
}

interface ReviewRequestModalProps {
    assetId: string;
    assetName: string;
    isOpen: boolean;
    onClose: () => void;
    currentUserId: string; // The user requesting the review
}

export default function ReviewRequestModal({ assetId, assetName, isOpen, onClose, currentUserId }: ReviewRequestModalProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedReviewerId, setSelectedReviewerId] = useState<string | null>(null);
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetch("/api/users")
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setUsers(data.filter((u: User) => u.id !== currentUserId));
                    }
                })
                .catch(err => console.error("Failed to fetch users", err));
        }
    }, [isOpen, currentUserId]);

    const handleSubmit = async () => {
        if (!selectedReviewerId) return;

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    assetId,
                    reviewerId: selectedReviewerId,
                    feedback: note // using 'feedback' field for initial request note
                })
            });

            if (res.ok) {
                alert("Review request sent!");
                onClose();
            } else {
                alert("Failed to send request.");
            }
        } catch (e) {
            console.error(e);
            alert("Error sending request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1a1a24] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Request Review</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Asset</label>
                        <div className="text-sm text-white font-medium truncate bg-white/5 p-3 rounded-lg border border-white/5">
                            {assetName}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Select Reviewer</label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {users.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => setSelectedReviewerId(user.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${selectedReviewerId === user.id
                                        ? "bg-indigo-600/20 border-indigo-500 text-white"
                                        : "bg-black/20 border-white/5 text-gray-400 hover:bg-white/5"
                                        }`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs">
                                        {user.image ? (
                                            <img
                                                src={user.image}
                                                alt={user.name || "Reviewer"}
                                                className="rounded-full"
                                            />
                                        ) : (
                                            <UserIcon size={14} />
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <div className="text-sm font-medium">{user.name || "Unknown"}</div>
                                        <div className="text-xs opacity-50">{user.email}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Message (Optional)</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white h-24 resize-none focus:border-indigo-500 outline-none transition-colors"
                            placeholder="Please review this cut..."
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                    <button onClick={onClose} className="btn text-gray-400 hover:text-white">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedReviewerId || isSubmitting}
                        className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Sending..." : <><Send size={16} /> Send Request</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
