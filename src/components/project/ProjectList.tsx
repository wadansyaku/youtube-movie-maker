"use client";

import { useState } from "react";
import { Plus, FolderOpen, Search, Filter, Grid, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Project {
    id: string;
    name: string;
    description: string | null;
    status: string;
    aspectRatio: string | null;
    targetDurationSeconds: number | null;
    createdAt: string;
    updatedAt: string;
    createdBy: {
        id: string;
        name: string | null;
        image: string | null;
    } | null;
    scenes: {
        id: string;
        name: string;
        shots: { id: string }[];
    }[];
    _count: {
        projectAssets: number;
        exports: number;
    };
}

interface ProjectListProps {
    initialProjects?: Project[];
    onProjectSelect?: (project: Project) => void;
    onCreateProject?: () => void;
}

const statusColors: Record<string, string> = {
    draft: "bg-gray-500",
    in_progress: "bg-blue-500",
    review: "bg-yellow-500",
    completed: "bg-green-500",
};

const statusLabels: Record<string, string> = {
    draft: "下書き",
    in_progress: "制作中",
    review: "レビュー中",
    completed: "完了",
};

export default function ProjectList({
    initialProjects = [],
    onProjectSelect,
    onCreateProject,
}: ProjectListProps) {
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [isLoading, setIsLoading] = useState(false);

    const filteredProjects = projects.filter((project) => {
        const matchesSearch =
            project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || project.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/projects");
            const data = await res.json();
            setProjects(data.projects || []);
        } catch (error) {
            console.error("Failed to fetch projects:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return "-";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">プロジェクト</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        動画制作プロジェクト管理
                    </p>
                </div>
                <button
                    onClick={onCreateProject}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                    <Plus size={20} />
                    プロジェクト作成
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="プロジェクトを検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-400" />
                    <select
                        value={statusFilter || ""}
                        onChange={(e) => setStatusFilter(e.target.value || null)}
                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">すべてのステータス</option>
                        <option value="draft">Draft</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                <div className="flex items-center gap-1 ml-auto">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
                            }`}
                    >
                        <Grid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
                            }`}
                    >
                        <List size={20} />
                    </button>
                </div>
            </div>

            {/* Project Grid/List */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="h-48 bg-gray-800 rounded-xl animate-pulse"
                        />
                    ))}
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <FolderOpen size={48} className="mb-4" />
                    <p className="text-lg">プロジェクトが見つかりません</p>
                    <p className="text-sm mt-2">新しいプロジェクトを作成して始めましょう</p>
                </div>
            ) : viewMode === "grid" ? (
                <motion.div
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    <AnimatePresence>
                        {filteredProjects.map((project) => (
                            <motion.div
                                key={project.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={() => onProjectSelect?.(project)}
                                className="bg-gray-800 border border-gray-700 rounded-xl p-5 cursor-pointer hover:border-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-500/10"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-semibold text-white truncate flex-1">
                                        {project.name}
                                    </h3>
                                    <span
                                        className={`px-2 py-1 text-xs rounded-full text-white ${statusColors[project.status] || "bg-gray-500"
                                            }`}
                                    >
                                        {statusLabels[project.status] || project.status}
                                    </span>
                                </div>

                                {project.description && (
                                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                        {project.description}
                                    </p>
                                )}

                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span>{project.scenes.length} シーン</span>
                                    <span>
                                        {project.scenes.reduce((acc, s) => acc + s.shots.length, 0)} ショット
                                    </span>
                                    <span>{project._count.projectAssets} アセット</span>
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                                    <span className="text-xs text-gray-500">
                                        {formatDate(project.updatedAt)}
                                    </span>
                                    {project.aspectRatio && (
                                        <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                                            {project.aspectRatio}
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                    <table className="w-full">
                        <thead className="bg-gray-900">
                            <tr>
                                <th className="text-left p-4 text-gray-400 font-medium">プロジェクト名</th>
                                <th className="text-left p-4 text-gray-400 font-medium">ステータス</th>
                                <th className="text-left p-4 text-gray-400 font-medium">シーン</th>
                                <th className="text-left p-4 text-gray-400 font-medium">アセット</th>
                                <th className="text-left p-4 text-gray-400 font-medium">時間</th>
                                <th className="text-left p-4 text-gray-400 font-medium">更新日時</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProjects.map((project) => (
                                <tr
                                    key={project.id}
                                    onClick={() => onProjectSelect?.(project)}
                                    className="border-t border-gray-700 hover:bg-gray-750 cursor-pointer transition-colors"
                                >
                                    <td className="p-4">
                                        <div>
                                            <p className="text-white font-medium">{project.name}</p>
                                            {project.description && (
                                                <p className="text-gray-500 text-sm truncate max-w-xs">
                                                    {project.description}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full text-white ${statusColors[project.status] || "bg-gray-500"
                                                }`}
                                        >
                                            {statusLabels[project.status] || project.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-300">{project.scenes.length}</td>
                                    <td className="p-4 text-gray-300">{project._count.projectAssets}</td>
                                    <td className="p-4 text-gray-300">
                                        {formatDuration(project.targetDurationSeconds)}
                                    </td>
                                    <td className="p-4 text-gray-500 text-sm">
                                        {formatDate(project.updatedAt)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
