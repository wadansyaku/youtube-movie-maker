"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Settings,
    Play,
    Download,
    Share2,
    MoreVertical,
    Clock,
    Film,
    Image as ImageIcon,
    Music,
    FileVideo,
    FileText,
} from "lucide-react";
import SceneHierarchy from "@/components/project/SceneHierarchy";
import ProjectForm from "@/components/project/ProjectForm";
import AssetLibrary from "@/components/asset/AssetLibrary";
import ReferenceManager from "@/components/project/ReferenceManager";
import AssetDetail from "@/components/asset/AssetDetail";

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

interface ProjectAsset {
    projectId: string;
    assetId: string;
    role: string | null;
    asset: {
        id: string;
        type: string;
        fileName: string;
        filePath: string;
        source: string;
        duration: number | null;
    };
}

interface Project {
    id: string;
    name: string;
    description: string | null;
    status: string;
    aspectRatio: string | null;
    targetDurationSeconds: number | null;
    createdAt: string;
    updatedAt: string;
    scenes: Scene[];
    projectAssets: ProjectAsset[];
}

const statusColors: Record<string, string> = {
    draft: "bg-gray-500",
    in_progress: "bg-blue-500",
    review: "bg-yellow-500",
    completed: "bg-green-500",
};

const statusLabels: Record<string, string> = {
    draft: "Draft",
    in_progress: "In Progress",
    review: "Review",
    completed: "Completed",
};

export default function ProjectDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showEditForm, setShowEditForm] = useState(false);
    const [activeTab, setActiveTab] = useState<"structure" | "assets" | "references" | "exports">(
        "structure"
    );
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

    const fetchProject = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/projects/${id}`);
            if (!res.ok) {
                router.push("/projects");
                return;
            }
            const data = await res.json();
            setProject(data);
        } catch (error) {
            console.error("Failed to fetch project:", error);
            router.push("/projects");
        } finally {
            setIsLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);

    const handleUpdateProject = async (formData: {
        name: string;
        description: string;
        aspectRatio: string;
        targetDurationSeconds: number | null;
    }) => {
        const res = await fetch(`/api/projects/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        if (!res.ok) {
            throw new Error("Failed to update project");
        }

        const updated = await res.json();
        setProject((prev) => (prev ? { ...prev, ...updated } : null));
    };

    const handleStatusChange = async (newStatus: string) => {
        try {
            await fetch(`/api/projects/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            setProject((prev) => (prev ? { ...prev, status: newStatus } : null));
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    const handleScenesChange = (newScenes: Scene[]) => {
        setProject((prev) => (prev ? { ...prev, scenes: newScenes } : null));
    };

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return "--:--";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const getTotalDuration = () => {
        if (!project) return 0;
        return project.scenes.reduce((total, scene) => {
            const sceneDuration = scene.shots.reduce(
                (acc, shot) => acc + (shot.durationSeconds || 0),
                0
            );
            return total + (scene.durationSeconds || sceneDuration);
        }, 0);
    };

    const getAssetTypeIcon = (type: string) => {
        switch (type) {
            case "video":
                return <FileVideo size={16} className="text-blue-400" />;
            case "audio":
                return <Music size={16} className="text-green-400" />;
            case "image":
                return <ImageIcon size={16} className="text-amber-400" />;
            case "slides":
                return <FileText size={16} className="text-indigo-400" />;
            default:
                return <Film size={16} className="text-gray-400" />;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
            </div>
        );
    }

    if (!project) {
        return null;
    }

    return (
        <div>
            {/* Header */}
            <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/projects"
                                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-bold text-white">{project.name}</h1>
                                    <select
                                        value={project.status}
                                        onChange={(e) => handleStatusChange(e.target.value)}
                                        className={`px-2 py-1 text-xs rounded-full text-white border-0 cursor-pointer ${statusColors[project.status] || "bg-gray-500"
                                            }`}
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="review">Review</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                                {project.description && (
                                    <p className="text-sm text-gray-400 mt-0.5">{project.description}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowEditForm(true)}
                                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                <Settings size={20} />
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                                <Download size={18} />
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Stats Bar */}
                    <div className="flex items-center gap-6 mt-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Film size={16} />
                            <span>{project.scenes.length} scenes</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <Clock size={16} />
                            <span>
                                {formatDuration(getTotalDuration())} /{" "}
                                {formatDuration(project.targetDurationSeconds)}
                            </span>
                        </div>
                        {project.aspectRatio && (
                            <div className="px-2 py-0.5 bg-gray-800 rounded text-gray-300 text-xs">
                                {project.aspectRatio}
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-400">
                            <ImageIcon size={16} />
                            <span>{project.projectAssets.length} assets</span>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-6 mt-4 border-b border-gray-800 -mb-px">
                        {(["structure", "assets", "references", "exports"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab
                                    ? "text-indigo-400 border-indigo-400"
                                    : "text-gray-400 border-transparent hover:text-white"
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-6 py-6">
                {activeTab === "structure" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <SceneHierarchy
                                projectId={project.id}
                                scenes={project.scenes}
                                onScenesChange={handleScenesChange}
                            />
                        </div>

                        {/* Right Sidebar - Quick Stats */}
                        <div className="space-y-4">
                            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                                <h3 className="text-white font-medium mb-3">Project Stats</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">Total Scenes</span>
                                        <span className="text-white">{project.scenes.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">Total Shots</span>
                                        <span className="text-white">
                                            {project.scenes.reduce((acc, s) => acc + s.shots.length, 0)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">Assets</span>
                                        <span className="text-white">{project.projectAssets.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">Duration</span>
                                        <span className="text-white">{formatDuration(getTotalDuration())}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                                <h3 className="text-white font-medium mb-3">Recent Assets</h3>
                                {project.projectAssets.length === 0 ? (
                                    <p className="text-sm text-gray-500">No assets yet</p>
                                ) : (
                                    <div className="space-y-2">
                                        {project.projectAssets.slice(0, 5).map((pa) => (
                                            <div
                                                key={pa.assetId}
                                                className="flex items-center gap-2 p-2 rounded hover:bg-gray-800 cursor-pointer"
                                            >
                                                {getAssetTypeIcon(pa.asset.type)}
                                                <span className="text-sm text-gray-300 truncate flex-1">
                                                    {pa.asset.fileName}
                                                </span>
                                                <span className="text-xs text-gray-500 capitalize">
                                                    {pa.asset.source}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "assets" && (
                    <AssetLibrary
                        projectId={project.id}
                        onAssetSelect={(asset) => setSelectedAssetId(asset.id)}
                    />
                )}

                {activeTab === "references" && (
                    <ReferenceManager projectId={project.id} />
                )}

                {activeTab === "exports" && (
                    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                        <p className="text-gray-400">Export history coming soon...</p>
                    </div>
                )}
            </main>

            {/* Asset Detail Panel */}
            <AssetDetail
                isOpen={!!selectedAssetId}
                onClose={() => setSelectedAssetId(null)}
                assetId={selectedAssetId}
            />

            {/* Edit Form Modal */}
            <ProjectForm
                isOpen={showEditForm}
                onClose={() => setShowEditForm(false)}
                onSubmit={handleUpdateProject}
                initialData={{
                    name: project.name,
                    description: project.description || "",
                    aspectRatio: project.aspectRatio || "16:9",
                    targetDurationSeconds: project.targetDurationSeconds,
                }}
                mode="edit"
            />
        </div>
    );
}
