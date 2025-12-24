"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Plus,
    Search,
    Filter,
    Copy,
    Trash2,
    Edit2,
    Tag,
    FileText,
    Wand2,
    X,
    Save,
    Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Prompt {
    id: string;
    promptPackId: string;
    type: string;
    name: string;
    content: string;
    variables: string;
    createdAt: string;
    updatedAt: string;
}

interface PromptFormData {
    type: string;
    name: string;
    content: string;
    variables: string;
}

const promptTypes = [
    { value: "visual", label: "Visual", color: "bg-blue-500/20 text-blue-400" },
    { value: "audio", label: "Audio", color: "bg-green-500/20 text-green-400" },
    { value: "narrative", label: "Narrative", color: "bg-purple-500/20 text-purple-400" },
];

export default function PromptsPage() {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [showForm, setShowForm] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState<PromptFormData>({
        type: "visual",
        name: "",
        content: "",
        variables: "[]",
    });

    useEffect(() => {
        fetchPrompts();
    }, [typeFilter, searchQuery]);

    const fetchPrompts = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (typeFilter) params.append("type", typeFilter);
            if (searchQuery) params.append("search", searchQuery);

            const res = await fetch(`/api/prompts?${params}`);
            const data = await res.json();
            setPrompts(data.prompts || []);
        } catch (error) {
            console.error("Failed to fetch prompts:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let parsedVariables: string[] = [];
            try {
                parsedVariables = JSON.parse(formData.variables || "[]");
            } catch {
                alert("Invalid JSON in variables");
                setIsSubmitting(false);
                return;
            }

            const url = editingPrompt
                ? `/api/prompts/${editingPrompt.id}`
                : "/api/prompts";
            const method = editingPrompt ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    variables: parsedVariables,
                }),
            });

            if (!res.ok) throw new Error("Failed to save prompt");

            resetForm();
            fetchPrompts();
        } catch (error) {
            console.error("Failed to save prompt:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (promptId: string) => {
        if (!confirm("Are you sure you want to delete this prompt?")) return;

        try {
            await fetch(`/api/prompts/${promptId}`, { method: "DELETE" });
            fetchPrompts();
        } catch (error) {
            console.error("Failed to delete prompt:", error);
        }
    };

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content);
    };

    const handleEdit = (prompt: Prompt) => {
        setEditingPrompt(prompt);
        setFormData({
            type: prompt.type,
            name: prompt.name,
            content: prompt.content,
            variables: prompt.variables,
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingPrompt(null);
        setFormData({
            type: "visual",
            name: "",
            content: "",
            variables: "[]",
        });
    };

    const getTypeStyle = (type: string) => {
        return promptTypes.find((t) => t.value === type)?.color || "bg-gray-500/20 text-gray-400";
    };

    // Extract variables from content
    const extractVariables = (content: string): string[] => {
        const matches = content.match(/\{([^}]+)\}/g);
        if (!matches) return [];
        return [...new Set(matches.map((m) => m.slice(1, -1)))];
    };

    const handleContentChange = (content: string) => {
        const vars = extractVariables(content);
        setFormData({
            ...formData,
            content,
            variables: JSON.stringify(vars),
        });
    };

    return (
        <div className="max-w-5xl mx-auto">
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
                        <h1 className="text-2xl font-bold text-white">Prompt Library</h1>
                        <p className="text-gray-400 mt-1">Reusable prompts for AI generation</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                    <Plus size={18} />
                    New Prompt
                </button>
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
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Types</option>
                        {promptTypes.map((t) => (
                            <option key={t.value} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* New/Edit Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-900 border border-gray-700 rounded-xl mb-6 overflow-hidden"
                    >
                        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                            <h3 className="text-white font-medium">
                                {editingPrompt ? "Edit Prompt" : "Create New Prompt"}
                            </h3>
                            <button onClick={resetForm} className="text-gray-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Prompt name"
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {promptTypes.map((t) => (
                                            <option key={t.value} value={t.value}>
                                                {t.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    Content
                                    <span className="text-gray-500 ml-2">
                                        (Use {"{variable}"} for placeholders)
                                    </span>
                                </label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => handleContentChange(e.target.value)}
                                    placeholder="Write your prompt here. Use {variable_name} for dynamic values."
                                    rows={6}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                    required
                                />
                            </div>

                            {extractVariables(formData.content).length > 0 && (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Detected Variables</label>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {extractVariables(formData.content).map((v) => (
                                            <span
                                                key={v}
                                                className="px-2 py-1 bg-indigo-600/20 text-indigo-400 rounded text-sm"
                                            >
                                                {"{" + v + "}"}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-lg transition-colors"
                                >
                                    {isSubmitting ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Save size={18} />
                                    )}
                                    {editingPrompt ? "Update" : "Create"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Prompts List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
                </div>
            ) : prompts.length === 0 ? (
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-12 text-center">
                    <FileText size={48} className="mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">No prompts yet</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="mt-4 text-indigo-400 hover:text-indigo-300"
                    >
                        Create your first prompt
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {prompts.map((prompt) => (
                        <motion.div
                            key={prompt.id}
                            layout
                            className="bg-gray-900 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 rounded text-xs ${getTypeStyle(prompt.type)}`}>
                                        {prompt.type}
                                    </span>
                                    <h3 className="font-medium text-white">{prompt.name}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleCopy(prompt.content)}
                                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                                        title="Copy"
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(prompt)}
                                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(prompt.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <p className="text-gray-300 text-sm whitespace-pre-wrap mb-3">
                                {prompt.content}
                            </p>

                            {JSON.parse(prompt.variables).length > 0 && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Tag size={14} className="text-gray-500" />
                                    {JSON.parse(prompt.variables).map((v: string) => (
                                        <span
                                            key={v}
                                            className="px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded text-xs"
                                        >
                                            {v}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
