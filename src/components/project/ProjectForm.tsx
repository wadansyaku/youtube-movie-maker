"use client";

import { useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProjectFormData {
    name: string;
    description: string;
    aspectRatio: string;
    targetDurationSeconds: number | null;
}

interface ProjectFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ProjectFormData) => Promise<void>;
    initialData?: Partial<ProjectFormData>;
    mode?: "create" | "edit";
}

const aspectRatioOptions = [
    { value: "16:9", label: "16:9 (Landscape)" },
    { value: "9:16", label: "9:16 (Portrait)" },
    { value: "1:1", label: "1:1 (Square)" },
    { value: "4:3", label: "4:3 (Standard)" },
    { value: "21:9", label: "21:9 (Cinematic)" },
];

export default function ProjectForm({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    mode = "create",
}: ProjectFormProps) {
    const [formData, setFormData] = useState<ProjectFormData>({
        name: initialData?.name || "",
        description: initialData?.description || "",
        aspectRatio: initialData?.aspectRatio || "16:9",
        targetDurationSeconds: initialData?.targetDurationSeconds || null,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = "Project name is required";
        } else if (formData.name.length > 255) {
            newErrors.name = "Name must be less than 255 characters";
        }

        if (formData.description && formData.description.length > 2000) {
            newErrors.description = "Description must be less than 2000 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error("Failed to submit:", error);
            setErrors({ submit: "Failed to save project. Please try again." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "") {
            setFormData({ ...formData, targetDurationSeconds: null });
        } else {
            const [mins, secs] = value.split(":").map(Number);
            if (!isNaN(mins) && !isNaN(secs)) {
                setFormData({ ...formData, targetDurationSeconds: mins * 60 + secs });
            }
        }
    };

    const formatDuration = (seconds: number | null): string => {
        if (!seconds) return "";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
                                <h2 className="text-xl font-semibold text-white">
                                    {mode === "create" ? "新規プロジェクト作成" : "プロジェクト編集"}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        プロジェクト名 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="プロジェクト名を入力"
                                        className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${errors.name
                                            ? "border-red-500 focus:ring-red-500"
                                            : "border-gray-700 focus:ring-indigo-500"
                                            }`}
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        説明 (オプション)
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="プロジェクトの説明を入力"
                                        rows={3}
                                        className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 resize-none transition-colors ${errors.description
                                            ? "border-red-500 focus:ring-red-500"
                                            : "border-gray-700 focus:ring-indigo-500"
                                            }`}
                                    />
                                    {errors.description && (
                                        <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                                    )}
                                </div>

                                {/* Aspect Ratio */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        アスペクト比
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {aspectRatioOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, aspectRatio: option.value })}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${formData.aspectRatio === option.value
                                                    ? "bg-indigo-600 text-white"
                                                    : "bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-white border border-gray-700"
                                                    }`}
                                            >
                                                {option.value}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Target Duration */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        目標尺 (オプション)
                                    </label>
                                    <input
                                        type="text"
                                        value={formatDuration(formData.targetDurationSeconds)}
                                        onChange={handleDurationChange}
                                        placeholder="mm:ss (例: 3:30)"
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        形式: 分:秒
                                    </p>
                                </div>

                                {/* Submit Error */}
                                {errors.submit && (
                                    <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
                                        {errors.submit}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-lg transition-colors"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                保存中...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                {mode === "create" ? "プロジェクト作成" : "変更を保存"}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
