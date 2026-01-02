"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Plus,
    Folder,
    Link,
    Image as ImageIcon,
    FileVideo,
    ExternalLink,
    Trash2,
    Edit2,
    MoreVertical,
    X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ReferenceItem {
    id: string;
    filePath: string | null;
    externalUrl: string | null;
    notes: string | null;
    createdAt: string;
}

interface ReferenceSet {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    items: ReferenceItem[];
}

interface ReferenceManagerProps {
    projectId: string;
}

export default function ReferenceManager({ projectId }: ReferenceManagerProps) {
    const [referenceSets, setReferenceSets] = useState<ReferenceSet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newSetName, setNewSetName] = useState("");
    const [expandedSet, setExpandedSet] = useState<string | null>(null);
    const [showAddItem, setShowAddItem] = useState<string | null>(null);
    const [newItemUrl, setNewItemUrl] = useState("");
    const [newItemNotes, setNewItemNotes] = useState("");

    const fetchReferenceSets = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/references`);
            const data = await res.json();
            setReferenceSets(data);
        } catch (error) {
            console.error("Failed to fetch reference sets:", error);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchReferenceSets();
    }, [fetchReferenceSets]);

    const handleCreateSet = async () => {
        if (!newSetName.trim()) return;

        try {
            const res = await fetch(`/api/projects/${projectId}/references`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newSetName.trim() }),
            });
            const newSet = await res.json();
            setReferenceSets([newSet, ...referenceSets]);
            setNewSetName("");
            setShowCreateForm(false);
            setExpandedSet(newSet.id);
        } catch (error) {
            console.error("Failed to create reference set:", error);
        }
    };

    const handleDeleteSet = async (setId: string) => {
        if (!confirm("Are you sure you want to delete this reference set?")) return;

        try {
            await fetch(`/api/projects/${projectId}/references/${setId}`, {
                method: "DELETE",
            });
            setReferenceSets(referenceSets.filter((s) => s.id !== setId));
        } catch (error) {
            console.error("Failed to delete reference set:", error);
        }
    };

    const handleAddItem = async (setId: string) => {
        if (!newItemUrl.trim()) return;

        try {
            const res = await fetch(`/api/projects/${projectId}/references/${setId}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    externalUrl: newItemUrl.trim(),
                    notes: newItemNotes.trim() || null,
                }),
            });
            const newItem = await res.json();

            setReferenceSets(
                referenceSets.map((s) =>
                    s.id === setId ? { ...s, items: [newItem, ...s.items] } : s
                )
            );
            setNewItemUrl("");
            setNewItemNotes("");
            setShowAddItem(null);
        } catch (error) {
            console.error("Failed to add reference item:", error);
        }
    };

    const handleDeleteItem = async (setId: string, itemId: string) => {
        try {
            await fetch(`/api/projects/${projectId}/references/${setId}/items`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemIds: [itemId] }),
            });

            setReferenceSets(
                referenceSets.map((s) =>
                    s.id === setId ? { ...s, items: s.items.filter((i) => i.id !== itemId) } : s
                )
            );
        } catch (error) {
            console.error("Failed to delete reference item:", error);
        }
    };

    const getPreviewIcon = (item: ReferenceItem) => {
        if (item.externalUrl) {
            const url = item.externalUrl.toLowerCase();
            if (url.includes("youtube") || url.includes("vimeo")) {
                return <FileVideo size={16} className="text-blue-400" />;
            }
            if (url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
                return <ImageIcon size={16} className="text-amber-400" />;
            }
            return <ExternalLink size={16} className="text-gray-400" />;
        }
        return <ImageIcon size={16} className="text-amber-400" />;
    };

    return (
        <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center gap-2">
                    <Folder size={18} className="text-amber-400" />
                    <h3 className="font-medium text-white">Reference Sets</h3>
                    <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded">
                        {referenceSets.length}
                    </span>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-1 px-2 py-1 text-sm text-indigo-400 hover:text-indigo-300 hover:bg-gray-700 rounded transition-colors"
                >
                    <Plus size={16} />
                    New Set
                </button>
            </div>

            {/* Create Form */}
            <AnimatePresence>
                {showCreateForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-b border-gray-700 overflow-hidden"
                    >
                        <div className="p-4 bg-gray-800/50">
                            <input
                                type="text"
                                value={newSetName}
                                onChange={(e) => setNewSetName(e.target.value)}
                                placeholder="Reference set name..."
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleCreateSet();
                                    if (e.key === "Escape") setShowCreateForm(false);
                                }}
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCreateSet}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
                                >
                                    Create
                                </button>
                                <button
                                    onClick={() => setShowCreateForm(false)}
                                    className="px-3 py-1.5 text-gray-400 hover:text-white text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reference Sets List */}
            <div className="max-h-[400px] overflow-y-auto">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : referenceSets.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Folder size={32} className="mx-auto mb-2" />
                        <p>No reference sets</p>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="mt-2 text-sm text-indigo-400 hover:text-indigo-300"
                        >
                            Create your first set
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-800">
                        {referenceSets.map((set) => (
                            <div key={set.id}>
                                {/* Set Header */}
                                <div
                                    className="flex items-center gap-2 px-4 py-3 hover:bg-gray-800/50 cursor-pointer"
                                    onClick={() =>
                                        setExpandedSet(expandedSet === set.id ? null : set.id)
                                    }
                                >
                                    <Folder
                                        size={16}
                                        className={
                                            expandedSet === set.id ? "text-amber-400" : "text-gray-500"
                                        }
                                    />
                                    <span className="flex-1 text-sm text-white">{set.name}</span>
                                    <span className="text-xs text-gray-500">{set.items.length} items</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteSet(set.id);
                                        }}
                                        className="p-1 text-gray-500 hover:text-red-400 rounded opacity-0 group-hover:opacity-100 hover:opacity-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                {/* Expanded Items */}
                                <AnimatePresence>
                                    {expandedSet === set.id && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="bg-gray-800/30 overflow-hidden"
                                        >
                                            {/* Add Item Form */}
                                            {showAddItem === set.id ? (
                                                <div className="p-3 border-b border-gray-800">
                                                    <input
                                                        type="url"
                                                        value={newItemUrl}
                                                        onChange={(e) => setNewItemUrl(e.target.value)}
                                                        placeholder="URL (e.g., YouTube, image link)..."
                                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                                                        autoFocus
                                                    />
                                                    <input
                                                        type="text"
                                                        value={newItemNotes}
                                                        onChange={(e) => setNewItemNotes(e.target.value)}
                                                        placeholder="Notes (optional)..."
                                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleAddItem(set.id)}
                                                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded transition-colors"
                                                        >
                                                            Add
                                                        </button>
                                                        <button
                                                            onClick={() => setShowAddItem(null)}
                                                            className="px-3 py-1 text-gray-400 text-xs hover:text-white transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setShowAddItem(set.id)}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-indigo-400 hover:bg-gray-800/50 transition-colors"
                                                >
                                                    <Plus size={14} />
                                                    Add reference
                                                </button>
                                            )}

                                            {/* Items */}
                                            {set.items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-800/50 group"
                                                >
                                                    {getPreviewIcon(item)}
                                                    <div className="flex-1 min-w-0">
                                                        {item.externalUrl ? (
                                                            <a
                                                                href={item.externalUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm text-gray-300 hover:text-indigo-400 truncate block"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {item.externalUrl}
                                                            </a>
                                                        ) : (
                                                            <span className="text-sm text-gray-300 truncate block">
                                                                {item.filePath}
                                                            </span>
                                                        )}
                                                        {item.notes && (
                                                            <p className="text-xs text-gray-500 truncate">
                                                                {item.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteItem(set.id, item.id);
                                                        }}
                                                        className="p-1 text-gray-500 hover:text-red-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}

                                            {set.items.length === 0 && showAddItem !== set.id && (
                                                <p className="px-4 py-2 text-xs text-gray-500">No items yet</p>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
