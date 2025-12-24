"use client";

import { useState } from "react";
import { X, Save, Loader2, Wand2, Link, Tag, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AssetMetadataFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AssetMetadata) => Promise<void>;
    initialData?: Partial<AssetMetadata>;
    mode?: "create" | "edit";
    assetType?: "video" | "audio" | "image" | "slides" | "other";
}

interface AssetMetadata {
    source: string;
    platform: string;
    modelVersion: string;
    prompt: string;
    negativePrompt: string;
    parameters: Record<string, unknown>;
    licenseType: string;
    creditRequired: string;
    duration: number | null;
    resolution: string;
    tags: string[];
}

const platformOptions = [
    { value: "runway", label: "Runway", models: ["Gen-4 Turbo", "Gen-4 Aleph", "Gen-3 Turbo"] },
    { value: "sora", label: "OpenAI Sora", models: ["Sora 2", "Sora 1.1"] },
    { value: "veo", label: "Google Veo", models: ["Veo 3.1", "Veo 3", "Veo 2"] },
    { value: "suno", label: "Suno", models: ["V4.5", "V4", "V3.5"] },
    { value: "dynamic_slides", label: "Dynamic Slides", models: [] },
    { value: "manual", label: "Manual / External", models: [] },
];

const licenseOptions = [
    { value: "commercial", label: "Commercial Use Allowed" },
    { value: "non-commercial", label: "Non-Commercial Only" },
    { value: "cc-by", label: "CC BY (Attribution)" },
    { value: "cc-by-nc", label: "CC BY-NC (Non-Commercial)" },
    { value: "proprietary", label: "Proprietary / All Rights Reserved" },
    { value: "unknown", label: "Unknown / TBD" },
];

const resolutionOptions = [
    "1920x1080",
    "3840x2160",
    "1080x1920",
    "1280x720",
    "1024x1024",
    "512x512",
];

export default function AssetMetadataForm({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    mode = "create",
    assetType = "video",
}: AssetMetadataFormProps) {
    const [formData, setFormData] = useState<AssetMetadata>({
        source: initialData?.source || "manual",
        platform: initialData?.platform || "manual",
        modelVersion: initialData?.modelVersion || "",
        prompt: initialData?.prompt || "",
        negativePrompt: initialData?.negativePrompt || "",
        parameters: initialData?.parameters || {},
        licenseType: initialData?.licenseType || "unknown",
        creditRequired: initialData?.creditRequired || "",
        duration: initialData?.duration || null,
        resolution: initialData?.resolution || "",
        tags: initialData?.tags || [],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newTag, setNewTag] = useState("");

    const selectedPlatform = platformOptions.find((p) => p.value === formData.platform);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error("Failed to save metadata:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const addTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData({
                ...formData,
                tags: [...formData.tags, newTag.trim()],
            });
            setNewTag("");
        }
    };

    const removeTag = (tag: string) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter((t) => t !== tag),
        });
    };

    const handleDurationChange = (value: string) => {
        if (value === "") {
            setFormData({ ...formData, duration: null });
        } else {
            const parts = value.split(":").map(Number);
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                setFormData({ ...formData, duration: parts[0] * 60 + parts[1] });
            }
        }
    };

    const formatDuration = (seconds: number | null): string => {
        if (!seconds) return "";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0">
                                <div className="flex items-center gap-3">
                                    <Wand2 size={20} className="text-indigo-400" />
                                    <h2 className="text-xl font-semibold text-white">
                                        {mode === "create" ? "Asset Metadata" : "Edit Metadata"}
                                    </h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Generation Source */}
                                <div className="bg-gray-800/50 rounded-xl p-4 space-y-4">
                                    <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                        <Link size={16} />
                                        Generation Source
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">Platform</label>
                                            <select
                                                value={formData.platform}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        platform: e.target.value,
                                                        source: e.target.value,
                                                        modelVersion: "",
                                                    })
                                                }
                                                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                {platformOptions.map((p) => (
                                                    <option key={p.value} value={p.value}>
                                                        {p.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">Model Version</label>
                                            {selectedPlatform?.models.length ? (
                                                <select
                                                    value={formData.modelVersion}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, modelVersion: e.target.value })
                                                    }
                                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    <option value="">Select model...</option>
                                                    {selectedPlatform.models.map((m) => (
                                                        <option key={m} value={m}>
                                                            {m}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={formData.modelVersion}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, modelVersion: e.target.value })
                                                    }
                                                    placeholder="e.g., Custom v1.0"
                                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Prompt */}
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Prompt</label>
                                        <textarea
                                            value={formData.prompt}
                                            onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                                            placeholder="Enter the prompt used to generate this asset..."
                                            rows={3}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                        />
                                    </div>

                                    {formData.platform !== "suno" && (
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">
                                                Negative Prompt (optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.negativePrompt}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, negativePrompt: e.target.value })
                                                }
                                                placeholder="What to avoid in the generation..."
                                                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Technical Details */}
                                <div className="bg-gray-800/50 rounded-xl p-4 space-y-4">
                                    <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                        <FileText size={16} />
                                        Technical Details
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        {(assetType === "video" || assetType === "audio") && (
                                            <div>
                                                <label className="block text-sm text-gray-400 mb-2">Duration</label>
                                                <input
                                                    type="text"
                                                    value={formatDuration(formData.duration)}
                                                    onChange={(e) => handleDurationChange(e.target.value)}
                                                    placeholder="mm:ss"
                                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                        )}

                                        {(assetType === "video" || assetType === "image") && (
                                            <div>
                                                <label className="block text-sm text-gray-400 mb-2">Resolution</label>
                                                <select
                                                    value={formData.resolution}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, resolution: e.target.value })
                                                    }
                                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    <option value="">Select resolution...</option>
                                                    {resolutionOptions.map((r) => (
                                                        <option key={r} value={r}>
                                                            {r}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">License Type</label>
                                            <select
                                                value={formData.licenseType}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, licenseType: e.target.value })
                                                }
                                                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                {licenseOptions.map((l) => (
                                                    <option key={l.value} value={l.value}>
                                                        {l.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">
                                                Credit / Attribution
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.creditRequired}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, creditRequired: e.target.value })
                                                }
                                                placeholder="Credit text if required"
                                                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Tags */}
                                <div className="bg-gray-800/50 rounded-xl p-4 space-y-4">
                                    <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                        <Tag size={16} />
                                        Tags
                                    </h3>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    addTag();
                                                }
                                            }}
                                            placeholder="Add a tag..."
                                            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={addTag}
                                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>

                                    {formData.tags.length > 0 && (
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {formData.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="flex items-center gap-1 px-3 py-1 bg-indigo-600/20 text-indigo-400 rounded-full text-sm"
                                                >
                                                    {tag}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTag(tag)}
                                                        className="text-indigo-400/60 hover:text-indigo-400"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </form>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700 shrink-0">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-lg transition-colors"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Save Metadata
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
