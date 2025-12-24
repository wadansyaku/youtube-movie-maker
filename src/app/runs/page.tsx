"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Plus,
    Search,
    Filter,
    ExternalLink,
    DollarSign,
    Clock,
    Wand2,
    FileVideo,
    Music,
    Image as ImageIcon,
    MoreVertical,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GenerationRun {
    id: string;
    assetId: string;
    platform: string;
    modelVersion: string | null;
    prompt: string | null;
    parameters: string;
    externalJobId: string | null;
    externalUrl: string | null;
    status: string;
    costCredits: number | null;
    costUsd: number | null;
    generationTimeSeconds: number | null;
    createdAt: string;
    asset: {
        id: string;
        fileName: string;
        type: string;
    };
}

interface RunFormData {
    assetId: string;
    platform: string;
    modelVersion: string;
    prompt: string;
    parameters: string;
    externalJobId: string;
    externalUrl: string;
    costCredits: string;
    costUsd: string;
}

const platformOptions = [
    { value: "runway", label: "Runway", color: "bg-purple-500/20 text-purple-400" },
    { value: "sora", label: "Sora", color: "bg-cyan-500/20 text-cyan-400" },
    { value: "veo", label: "Veo", color: "bg-red-500/20 text-red-400" },
    { value: "suno", label: "Suno", color: "bg-orange-500/20 text-orange-400" },
    { value: "manual", label: "Manual", color: "bg-gray-500/20 text-gray-400" },
];

const typeIcons: Record<string, React.ReactNode> = {
    video: <FileVideo size={16} className="text-blue-400" />,
    audio: <Music size={16} className="text-green-400" />,
    image: <ImageIcon size={16} className="text-amber-400" />,
};

export default function RunsPage() {
    const [runs, setRuns] = useState<GenerationRun[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showNewRunForm, setShowNewRunForm] = useState(false);
    const [platformFilter, setPlatformFilter] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");

    const [formData, setFormData] = useState<RunFormData>({
        assetId: "",
        platform: "runway",
        modelVersion: "",
        prompt: "",
        parameters: "{}",
        externalJobId: "",
        externalUrl: "",
        costCredits: "",
        costUsd: "",
    });

    useEffect(() => {
        fetchRuns();
    }, [platformFilter, searchQuery]);

    const fetchRuns = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (platformFilter) params.append("platform", platformFilter);
            if (searchQuery) params.append("search", searchQuery);

            const res = await fetch(`/api/generation-runs?${params}`);
            const data = await res.json();
            setRuns(data.runs || []);
        } catch (error) {
            console.error("Failed to fetch runs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.assetId) {
            alert("Please enter an Asset ID");
            return;
        }

        try {
            let parsedParams = {};
            try {
                parsedParams = JSON.parse(formData.parameters || "{}");
            } catch {
                alert("Invalid JSON in parameters");
                return;
            }

            const res = await fetch("/api/generation-runs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    assetId: formData.assetId,
                    platform: formData.platform,
                    modelVersion: formData.modelVersion || null,
                    prompt: formData.prompt || null,
                    parameters: parsedParams,
                    externalJobId: formData.externalJobId || null,
                    externalUrl: formData.externalUrl || null,
                    costCredits: formData.costCredits ? parseFloat(formData.costCredits) : null,
                    costUsd: formData.costUsd ? parseFloat(formData.costUsd) : null,
                    status: "completed",
                }),
            });

            if (!res.ok) throw new Error("Failed to create run");

            setShowNewRunForm(false);
            setFormData({
                assetId: "",
                platform: "runway",
                modelVersion: "",
                prompt: "",
                parameters: "{}",
                externalJobId: "",
                externalUrl: "",
                costCredits: "",
                costUsd: "",
            });
            fetchRuns();
        } catch (error) {
            console.error("Failed to create run:", error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("ja-JP", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getPlatformStyle = (platform: string) => {
        return platformOptions.find((p) => p.value === platform)?.color || "bg-gray-500/20 text-gray-400";
    };

    // Calculate total cost
    const totalCredits = runs.reduce((sum, r) => sum + (r.costCredits || 0), 0);
    const totalUsd = runs.reduce((sum, r) => sum + (r.costUsd || 0), 0);

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
                        <h1 className="text-2xl font-bold text-white">Generation Runs</h1>
                        <p className="text-gray-400 mt-1">Track AI generation history and costs</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowNewRunForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                    <Plus size={18} />
                    New Run
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Total Runs</p>
                    <p className="text-2xl font-bold text-white mt-1">{runs.length}</p>
                </div>
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Total Credits</p>
                    <p className="text-2xl font-bold text-white mt-1">{totalCredits.toFixed(1)}</p>
                </div>
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Total Cost (USD)</p>
                    <p className="text-2xl font-bold text-white mt-1">${totalUsd.toFixed(2)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search prompts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-400" />
                    <select
                        value={platformFilter}
                        onChange={(e) => setPlatformFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Platforms</option>
                        {platformOptions.map((p) => (
                            <option key={p.value} value={p.value}>
                                {p.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* New Run Form */}
            <AnimatePresence>
                {showNewRunForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-900 border border-gray-700 rounded-xl mb-6 overflow-hidden"
                    >
                        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                            <h3 className="text-white font-medium">Register New Run</h3>
                            <button
                                onClick={() => setShowNewRunForm(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Asset ID *</label>
                                    <input
                                        type="text"
                                        value={formData.assetId}
                                        onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                                        placeholder="Asset UUID"
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Platform</label>
                                    <select
                                        value={formData.platform}
                                        onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {platformOptions.map((p) => (
                                            <option key={p.value} value={p.value}>
                                                {p.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Model Version</label>
                                    <input
                                        type="text"
                                        value={formData.modelVersion}
                                        onChange={(e) => setFormData({ ...formData, modelVersion: e.target.value })}
                                        placeholder="e.g., Gen-3 Alpha"
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">External Job ID</label>
                                    <input
                                        type="text"
                                        value={formData.externalJobId}
                                        onChange={(e) => setFormData({ ...formData, externalJobId: e.target.value })}
                                        placeholder="Platform job ID"
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">External URL</label>
                                <input
                                    type="url"
                                    value={formData.externalUrl}
                                    onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Prompt</label>
                                <textarea
                                    value={formData.prompt}
                                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                                    placeholder="Generation prompt..."
                                    rows={3}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Parameters (JSON)</label>
                                <textarea
                                    value={formData.parameters}
                                    onChange={(e) => setFormData({ ...formData, parameters: e.target.value })}
                                    placeholder='{"seed": 12345, "cfg_scale": 7.5}'
                                    rows={2}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Cost (Credits)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.costCredits}
                                        onChange={(e) => setFormData({ ...formData, costCredits: e.target.value })}
                                        placeholder="0"
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Cost (USD)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.costUsd}
                                        onChange={(e) => setFormData({ ...formData, costUsd: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNewRunForm(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                                >
                                    Register Run
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Runs Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
                </div>
            ) : runs.length === 0 ? (
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-12 text-center">
                    <Wand2 size={48} className="mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">No generation runs yet</p>
                    <button
                        onClick={() => setShowNewRunForm(true)}
                        className="mt-4 text-indigo-400 hover:text-indigo-300"
                    >
                        Register your first run
                    </button>
                </div>
            ) : (
                <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="text-left p-4 text-gray-400 font-medium">Asset</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Platform</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Prompt</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Cost</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Date</th>
                                <th className="w-10 p-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {runs.map((run) => (
                                <tr key={run.id} className="hover:bg-gray-800/50">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            {typeIcons[run.asset.type] || typeIcons.video}
                                            <span className="text-white truncate max-w-[150px]">
                                                {run.asset.fileName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-xs ${getPlatformStyle(run.platform)}`}>
                                                {run.platform}
                                            </span>
                                            {run.modelVersion && (
                                                <span className="text-xs text-gray-500">{run.modelVersion}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-gray-300 text-sm truncate max-w-[200px]">
                                            {run.prompt || "-"}
                                        </p>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3 text-sm">
                                            {run.costCredits && (
                                                <span className="text-gray-400">{run.costCredits} credits</span>
                                            )}
                                            {run.costUsd && (
                                                <span className="text-green-400">${run.costUsd.toFixed(2)}</span>
                                            )}
                                            {!run.costCredits && !run.costUsd && (
                                                <span className="text-gray-500">-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">{formatDate(run.createdAt)}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            {run.externalUrl && (
                                                <a
                                                    href={run.externalUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1 text-gray-400 hover:text-indigo-400"
                                                >
                                                    <ExternalLink size={16} />
                                                </a>
                                            )}
                                            <button className="p-1 text-gray-400 hover:text-white">
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>
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
