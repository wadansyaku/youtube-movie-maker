"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Download,
    FileArchive,
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    Trash2,
    FolderOpen,
    Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import SEOGenerator from "@/components/ai/SEOGenerator";

interface ExportRecord {
    id: string;
    projectId: string;
    outputFormat: string | null;
    resolution: string | null;
    filePath: string | null;
    status: string;
    createdAt: string;
    project: {
        id: string;
        name: string;
    };
    exportedBy: {
        id: string;
        name: string | null;
    } | null;
}

interface Project {
    id: string;
    name: string;
    status: string;
    _count: {
        scenes: number;
        projectAssets: number;
    };
}

const statusConfig = {
    pending: { icon: Clock, color: "text-yellow-400" },
    processing: { icon: Clock, color: "text-blue-400" },
    completed: { icon: CheckCircle, color: "text-green-400" },
    failed: { icon: AlertCircle, color: "text-red-400" },
};

export default function ExportsPage() {
    const [exports, setExports] = useState<ExportRecord[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    const fetchProjects = useCallback(async () => {
        try {
            const res = await fetch("/api/projects?limit=100");
            const data = await res.json();
            setProjects(data.projects || []);
            if (data.projects?.length > 0) {
                setSelectedProjectId(data.projects[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch projects:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchExports = useCallback(async () => {
        try {
            const res = await fetch(`/api/projects/${selectedProjectId}/export`);
            const data = await res.json();
            setExports(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch exports:", error);
        }
    }, [selectedProjectId]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    useEffect(() => {
        if (selectedProjectId) {
            fetchExports();
        }
    }, [selectedProjectId, fetchExports]);

    const handleExportCSV = async () => {
        if (!selectedProjectId) return;

        setIsExporting(true);
        try {
            const res = await fetch(`/api/projects/${selectedProjectId}/export`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ format: "csv" }),
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `export_${Date.now()}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                fetchExports();
            }
        } catch (error) {
            console.error("Failed to export CSV:", error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportZIP = async () => {
        if (!selectedProjectId) return;

        setIsExporting(true);
        try {
            const res = await fetch(`/api/projects/${selectedProjectId}/export/zip`, {
                method: "POST",
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `export_${Date.now()}.zip`;
                a.click();
                URL.revokeObjectURL(url);
                fetchExports();
            }
        } catch (error) {
            console.error("Failed to export ZIP:", error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportJSON = async () => {
        if (!selectedProjectId) return;

        setIsExporting(true);
        try {
            const res = await fetch(`/api/projects/${selectedProjectId}/export`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ format: "json" }),
            });

            if (res.ok) {
                const data = await res.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], {
                    type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `export_${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
                fetchExports();
            }
        } catch (error) {
            console.error("Failed to export JSON:", error);
        } finally {
            setIsExporting(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const selectedProject = projects.find((p) => p.id === selectedProjectId);

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href="/dashboard"
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Export</h1>
                    <p className="text-gray-400 mt-1">プロジェクトをエクスポート</p>
                </div>
            </div>

            {/* Project Selector */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-6">
                <label className="block text-sm text-gray-400 mb-2">
                    エクスポートするプロジェクト
                </label>
                <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                            {project.name} ({project._count.scenes} scenes, {project._count.projectAssets} assets)
                        </option>
                    ))}
                </select>
            </div>

            {/* Export Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <button
                    onClick={handleExportCSV}
                    disabled={isExporting || !selectedProjectId}
                    className="flex flex-col items-center gap-3 p-6 bg-gray-900 border border-gray-700 rounded-xl hover:border-indigo-500 transition-colors disabled:opacity-50"
                >
                    <FileText size={32} className="text-green-400" />
                    <span className="font-medium text-white">CSV Export</span>
                    <span className="text-xs text-gray-500">
                        Shot一覧をCSVでダウンロード
                    </span>
                </button>

                <button
                    onClick={handleExportJSON}
                    disabled={isExporting || !selectedProjectId}
                    className="flex flex-col items-center gap-3 p-6 bg-gray-900 border border-gray-700 rounded-xl hover:border-indigo-500 transition-colors disabled:opacity-50"
                >
                    <FolderOpen size={32} className="text-blue-400" />
                    <span className="font-medium text-white">JSON Export</span>
                    <span className="text-xs text-gray-500">
                        プロジェクト構造をJSON形式で
                    </span>
                </button>

                <button
                    onClick={handleExportZIP}
                    disabled={isExporting || !selectedProjectId}
                    className="flex flex-col items-center gap-3 p-6 bg-gray-900 border border-gray-700 rounded-xl hover:border-indigo-500 transition-colors disabled:opacity-50"
                >
                    <FileArchive size={32} className="text-purple-400" />
                    <span className="font-medium text-white">ZIP Export</span>
                    <span className="text-xs text-gray-500">
                        Shot順にまとめてZIPで
                    </span>
                </button>
            </div>

            {/* Export Loading */}
            {isExporting && (
                <div className="flex items-center justify-center gap-3 py-4 mb-6 bg-indigo-900/30 border border-indigo-700/50 rounded-xl">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500" />
                    <span className="text-indigo-300">エクスポート中...</span>
                </div>
            )}

            {/* SEO Generator */}
            {selectedProject && (
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={18} className="text-cyan-400" />
                        <h2 className="font-medium text-white">YouTube SEO 最適化</h2>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                        プロジェクト「{selectedProject.name}」のYouTube用タイトル、説明文、タグをAIで生成します。
                    </p>
                    <SEOGenerator
                        episodeTitle={selectedProject.name}
                        synopsis={`${selectedProject._count.scenes}シーン、${selectedProject._count.projectAssets}アセットを含むプロジェクト`}
                        onApply={(seo) => {
                            navigator.clipboard.writeText(
                                `タイトル: ${seo.titles[0]}\n\n説明文:\n${seo.description}\n\nタグ: ${seo.tags.join(', ')}`
                            );
                            alert('SEO情報をクリップボードにコピーしました！');
                        }}
                    />
                </div>
            )}

            {/* Export History */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-700">
                    <h2 className="font-medium text-white">エクスポート履歴</h2>
                </div>

                {exports.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Download size={32} className="mx-auto mb-2" />
                        <p>まだエクスポートがありません</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-800">
                        {exports.map((exp) => {
                            const config = statusConfig[exp.status as keyof typeof statusConfig];
                            const StatusIcon = config?.icon || Clock;

                            return (
                                <div key={exp.id} className="flex items-center gap-4 px-4 py-3">
                                    <StatusIcon size={18} className={config?.color} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white">
                                            {exp.outputFormat?.toUpperCase() || "Unknown"} Export
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatDate(exp.createdAt)}
                                        </p>
                                    </div>
                                    <span
                                        className={`px-2 py-0.5 rounded text-xs ${exp.status === "completed"
                                            ? "bg-green-500/20 text-green-400"
                                            : exp.status === "failed"
                                                ? "bg-red-500/20 text-red-400"
                                                : "bg-gray-500/20 text-gray-400"
                                            }`}
                                    >
                                        {exp.status}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
