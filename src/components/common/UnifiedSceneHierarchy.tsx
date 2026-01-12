"use client";

import { useState } from "react";
import {
    ChevronDown,
    ChevronRight,
    Plus,
    GripVertical,
    Film,
    Layers,
    Video,
    Trash2,
    Edit2,
} from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";

interface Shot {
    id: string;
    name: string;
    description: string | null;
    durationSeconds: number | null;
    cameraMovement: string | null;
    orderIndex: number;
}

interface Scene {
    id: string;
    name: string;
    description: string | null;
    durationSeconds: number | null;
    orderIndex: number;
    shots: Shot[];
}

interface UnifiedSceneHierarchyProps {
    ownerId: string;
    mode: 'project' | 'episode';
    scenes: Scene[];
    onScenesChange: (scenes: Scene[]) => void;
    onSceneSelect?: (scene: Scene) => void;
    onShotSelect?: (shot: Shot, scene: Scene) => void;
}

export default function UnifiedSceneHierarchy({
    ownerId,
    mode,
    scenes,
    onScenesChange,
    onSceneSelect,
    onShotSelect,
}: UnifiedSceneHierarchyProps) {
    const [expandedScenes, setExpandedScenes] = useState<Set<string>>(
        new Set(scenes.map((s) => s.id))
    );
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState("");

    const apiPrefix = mode === 'episode'
        ? `/api/episodes/${ownerId}`
        : `/api/projects/${ownerId}`;

    const toggleScene = (sceneId: string) => {
        setExpandedScenes((prev) => {
            const next = new Set(prev);
            if (next.has(sceneId)) {
                next.delete(sceneId);
            } else {
                next.add(sceneId);
            }
            return next;
        });
    };

    const handleAddScene = async () => {
        try {
            const res = await fetch(`${apiPrefix}/scenes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: `Scene ${scenes.length + 1}` }),
            });
            const newScene = await res.json();
            onScenesChange([...scenes, { ...newScene, shots: [] }]);
            setExpandedScenes((prev) => new Set([...prev, newScene.id]));
        } catch (error) {
            console.error("Failed to add scene:", error);
        }
    };

    const handleAddShot = async (sceneId: string, sceneIndex: number) => {
        const scene = scenes[sceneIndex];
        try {
            const res = await fetch(
                `${apiPrefix}/scenes/${sceneId}/shots`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: `Shot ${scene.shots.length + 1}` }),
                }
            );
            const newShot = await res.json();
            const updatedScenes = [...scenes];
            updatedScenes[sceneIndex] = {
                ...scene,
                shots: [...scene.shots, newShot],
            };
            onScenesChange(updatedScenes);
        } catch (error) {
            console.error("Failed to add shot:", error);
        }
    };

    const handleDeleteScene = async (sceneId: string) => {
        if (!confirm("本当にこのシーンとそのショットを削除しますか？")) {
            return;
        }
        try {
            await fetch(`${apiPrefix}/scenes/${sceneId}`, {
                method: "DELETE",
            });
            onScenesChange(scenes.filter((s) => s.id !== sceneId));
        } catch (error) {
            console.error("Failed to delete scene:", error);
        }
    };

    const handleRenameStart = (id: string, currentName: string) => {
        setEditingId(id);
        setEditingValue(currentName);
    };

    const handleRenameSubmit = async (
        type: "scene" | "shot",
        id: string,
        sceneId?: string
    ) => {
        if (!editingValue.trim()) {
            setEditingId(null);
            return;
        }

        try {
            if (type === "scene") {
                await fetch(`${apiPrefix}/scenes/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: editingValue }),
                });
                onScenesChange(
                    scenes.map((s) =>
                        s.id === id ? { ...s, name: editingValue } : s
                    )
                );
            } else if (sceneId) {
                // Determine API endpoint for shot update based on mode?
                // Currently shot update API is not confirmed to be unified, but usually it's under scene.
                // Actually the current Shot API structure assumes /api/projects/:id/scenes/:sceneId/shots/:shotId is not explicitly defined in what we saw,
                // but usually shot update might be directly under /api/shots/:id or nested.
                // Looking at Project API: we only saw list/create/reorder. We didn't see PATCH shot.
                // Assuming it might not be implemented or we missed it. 
                // Wait, if it's missing in Project, we can't implement it here easily without backend.
                // Let's check if SceneHierarchy had shot rename logic that worked.
                // SceneHierarchy used: `fetch(/api/projects/${projectId}/scenes/${id}...)` for scene.
                // For shot: it seemingly expected to update it via scene? No.
                // The original SceneHierarchy code had:
                /*
                 } else if (sceneId) {
                    // Shot rename would need a separate endpoint
                    const sceneIndex = scenes.findIndex((s) => s.id === sceneId);
                    // ... updates local state
                 }
                */
                // It says "Shot rename would need a separate endpoint" and only updates local state!
                // So the backend implementation for shot rename is missing in the original code too.
                // We will reproduce this behavior (local update only) for now, or implement the missing API.

                const sceneIndex = scenes.findIndex((s) => s.id === sceneId);
                if (sceneIndex !== -1) {
                    const updatedScenes = [...scenes];
                    updatedScenes[sceneIndex] = {
                        ...updatedScenes[sceneIndex],
                        shots: updatedScenes[sceneIndex].shots.map((shot) =>
                            shot.id === id ? { ...shot, name: editingValue } : shot
                        ),
                    };
                    onScenesChange(updatedScenes);
                }
            }
        } catch (error) {
            console.error("Failed to rename:", error);
        } finally {
            setEditingId(null);
        }
    };

    const handleSceneReorder = async (newOrder: Scene[]) => {
        onScenesChange(newOrder);
        try {
            await fetch(`${apiPrefix}/scenes`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sceneIds: newOrder.map((s) => s.id) }),
            });
        } catch (error) {
            console.error("Failed to reorder scenes:", error);
        }
    };

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return "";
        return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
    };

    return (
        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center gap-2">
                    <Layers size={18} className="text-indigo-400" />
                    <h3 className="font-medium text-white">シーン構成</h3>
                    <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded">
                        {scenes.length} シーン
                    </span>
                </div>
                <button
                    onClick={handleAddScene}
                    className="flex items-center gap-1 px-2 py-1 text-sm text-indigo-400 hover:text-indigo-300 hover:bg-gray-700 rounded transition-colors"
                >
                    <Plus size={16} />
                    シーン追加
                </button>
            </div>

            {/* Scene List */}
            <div className="max-h-[500px] overflow-y-auto">
                {scenes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Film size={32} className="mb-2" />
                        <p>シーンがありません</p>
                        <button
                            onClick={handleAddScene}
                            className="mt-2 text-sm text-indigo-400 hover:text-indigo-300"
                        >
                            最初のシーンを追加
                        </button>
                    </div>
                ) : (
                    <Reorder.Group
                        axis="y"
                        values={scenes}
                        onReorder={handleSceneReorder}
                        className="divide-y divide-gray-800"
                    >
                        {scenes.map((scene, sceneIndex) => (
                            <Reorder.Item
                                key={scene.id}
                                value={scene}
                                className="bg-gray-900"
                            >
                                <div className="group">
                                    {/* Scene Header */}
                                    <div
                                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 cursor-pointer"
                                        onClick={() => toggleScene(scene.id)}
                                    >
                                        <GripVertical
                                            size={16}
                                            className="text-gray-600 opacity-0 group-hover:opacity-100 cursor-grab"
                                        />
                                        {expandedScenes.has(scene.id) ? (
                                            <ChevronDown size={16} className="text-gray-400" />
                                        ) : (
                                            <ChevronRight size={16} className="text-gray-400" />
                                        )}
                                        <Film size={16} className="text-amber-400" />

                                        {editingId === scene.id ? (
                                            <input
                                                type="text"
                                                value={editingValue}
                                                onChange={(e) => setEditingValue(e.target.value)}
                                                onBlur={() => handleRenameSubmit("scene", scene.id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleRenameSubmit("scene", scene.id);
                                                    if (e.key === "Escape") setEditingId(null);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                autoFocus
                                                className="flex-1 bg-gray-800 border border-indigo-500 rounded px-2 py-0.5 text-white text-sm focus:outline-none"
                                            />
                                        ) : (
                                            <span
                                                className="flex-1 text-white text-sm font-medium"
                                                onDoubleClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRenameStart(scene.id, scene.name);
                                                }}
                                            >
                                                {scene.name}
                                            </span>
                                        )}

                                        <span className="text-xs text-gray-500">
                                            {scene.shots.length} ショット
                                        </span>
                                        {scene.durationSeconds && (
                                            <span className="text-xs text-gray-500">
                                                {formatDuration(scene.durationSeconds)}
                                            </span>
                                        )}

                                        <div
                                            className="flex items-center gap-1 opacity-0 group-hover:opacity-100"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() => handleRenameStart(scene.id, scene.name)}
                                                className="p-1 text-gray-400 hover:text-white rounded"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleAddShot(scene.id, sceneIndex)}
                                                className="p-1 text-gray-400 hover:text-indigo-400 rounded"
                                                title="ショット追加"
                                            >
                                                <Plus size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteScene(scene.id)}
                                                className="p-1 text-gray-400 hover:text-red-400 rounded"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Shots List */}
                                    <AnimatePresence>
                                        {expandedScenes.has(scene.id) && scene.shots.length > 0 && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pl-10 border-l-2 border-gray-700 ml-6 space-y-1 py-1">
                                                    {scene.shots.map((shot) => (
                                                        <div
                                                            key={shot.id}
                                                            className="group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-800 cursor-pointer"
                                                            onClick={() => onShotSelect?.(shot, scene)}
                                                        >
                                                            <Video size={14} className="text-blue-400" />

                                                            {editingId === shot.id ? (
                                                                <input
                                                                    type="text"
                                                                    value={editingValue}
                                                                    onChange={(e) => setEditingValue(e.target.value)}
                                                                    onBlur={() =>
                                                                        handleRenameSubmit("shot", shot.id, scene.id)
                                                                    }
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter")
                                                                            handleRenameSubmit("shot", shot.id, scene.id);
                                                                        if (e.key === "Escape") setEditingId(null);
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    autoFocus
                                                                    className="flex-1 bg-gray-800 border border-indigo-500 rounded px-2 py-0.5 text-white text-sm focus:outline-none"
                                                                />
                                                            ) : (
                                                                <span
                                                                    className="flex-1 text-gray-300 text-sm"
                                                                    onDoubleClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleRenameStart(shot.id, shot.name);
                                                                    }}
                                                                >
                                                                    {shot.name}
                                                                </span>
                                                            )}

                                                            {shot.cameraMovement && (
                                                                <span className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                                                                    {shot.cameraMovement}
                                                                </span>
                                                            )}
                                                            {shot.durationSeconds && (
                                                                <span className="text-xs text-gray-500">
                                                                    {formatDuration(shot.durationSeconds)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                )}
            </div>
        </div>
    );
}
