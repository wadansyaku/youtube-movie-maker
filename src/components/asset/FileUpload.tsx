"use client";

import { useState, useCallback, useRef } from "react";
import {
    Upload,
    X,
    FileVideo,
    FileAudio,
    Image as ImageIcon,
    File,
    Check,
    AlertCircle,
    Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UploadFile {
    id: string;
    file: File;
    name: string;
    size: number;
    type: "video" | "audio" | "image" | "other";
    progress: number;
    status: "pending" | "uploading" | "completed" | "error";
    error?: string;
    key?: string;
}

interface FileUploadProps {
    onUploadComplete?: (files: { key: string; name: string; type: string; size: number }[]) => void;
    onError?: (error: string) => void;
    allowedTypes?: ("video" | "audio" | "image")[];
    maxFiles?: number;
    maxSizeBytes?: number;
    projectId?: string;
    prefix?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
    video: <FileVideo size={20} className="text-blue-400" />,
    audio: <FileAudio size={20} className="text-green-400" />,
    image: <ImageIcon size={20} className="text-amber-400" />,
    other: <File size={20} className="text-gray-400" />,
};

const getFileType = (fileName: string): "video" | "audio" | "image" | "other" => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const videoExts = ["mp4", "webm", "mov", "avi", "mkv"];
    const audioExts = ["mp3", "wav", "ogg", "m4a", "flac"];
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg"];

    if (videoExts.includes(ext || "")) return "video";
    if (audioExts.includes(ext || "")) return "audio";
    if (imageExts.includes(ext || "")) return "image";
    return "other";
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export default function FileUpload({
    onUploadComplete,
    onError,
    allowedTypes = ["video", "audio", "image"],
    maxFiles = 10,
    maxSizeBytes = 500 * 1024 * 1024, // 500MB default
    projectId,
    prefix = "assets",
}: FileUploadProps) {
    const [files, setFiles] = useState<UploadFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        const fileType = getFileType(file.name);

        if (fileType === "other" || !allowedTypes.includes(fileType)) {
            return `File type not allowed: ${file.name}`;
        }

        if (file.size > maxSizeBytes) {
            return `File too large: ${file.name} (max ${formatFileSize(maxSizeBytes)})`;
        }

        return null;
    };

    const addFiles = useCallback((newFiles: FileList | File[]) => {
        const filesToAdd: UploadFile[] = [];
        const errors: string[] = [];

        Array.from(newFiles).forEach((file) => {
            if (files.length + filesToAdd.length >= maxFiles) {
                errors.push(`Maximum ${maxFiles} files allowed`);
                return;
            }

            const validationError = validateFile(file);
            if (validationError) {
                errors.push(validationError);
                return;
            }

            filesToAdd.push({
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                file,
                name: file.name,
                size: file.size,
                type: getFileType(file.name),
                progress: 0,
                status: "pending",
            });
        });

        if (errors.length > 0) {
            onError?.(errors.join(", "));
        }

        if (filesToAdd.length > 0) {
            setFiles((prev) => [...prev, ...filesToAdd]);
        }
    }, [files.length, maxFiles, maxSizeBytes, allowedTypes, onError]);

    const removeFile = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const uploadFile = async (uploadFile: UploadFile): Promise<void> => {
        try {
            setFiles((prev) =>
                prev.map((f) =>
                    f.id === uploadFile.id ? { ...f, status: "uploading", progress: 0 } : f
                )
            );

            // Get presigned URL
            const presignedRes = await fetch("/api/upload/presigned", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fileName: uploadFile.name,
                    prefix: prefix,
                    allowedTypes,
                }),
            });

            if (!presignedRes.ok) {
                throw new Error("Failed to get upload URL");
            }

            const { key, uploadUrl, contentType } = await presignedRes.json();

            // Upload to S3 with progress tracking
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const progress = Math.round((e.loaded / e.total) * 100);
                        setFiles((prev) =>
                            prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f))
                        );
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                };

                xhr.onerror = () => reject(new Error("Network error during upload"));

                xhr.open("PUT", uploadUrl);
                xhr.setRequestHeader("Content-Type", contentType);
                xhr.send(uploadFile.file);
            });

            setFiles((prev) =>
                prev.map((f) =>
                    f.id === uploadFile.id
                        ? { ...f, status: "completed", progress: 100, key }
                        : f
                )
            );
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Upload failed";
            setFiles((prev) =>
                prev.map((f) =>
                    f.id === uploadFile.id
                        ? { ...f, status: "error", error: errorMessage }
                        : f
                )
            );
        }
    };

    const uploadAllFiles = async () => {
        const pendingFiles = files.filter((f) => f.status === "pending");

        for (const file of pendingFiles) {
            await uploadFile(file);
        }

        // Notify completion
        const completedFiles = files
            .filter((f) => f.status === "completed" && f.key)
            .map((f) => ({
                key: f.key!,
                name: f.name,
                type: f.type,
                size: f.size,
            }));

        if (completedFiles.length > 0) {
            onUploadComplete?.(completedFiles);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            addFiles(e.dataTransfer.files);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(e.target.files);
        }
    };

    const pendingCount = files.filter((f) => f.status === "pending").length;
    const completedCount = files.filter((f) => f.status === "completed").length;

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragging
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-gray-700 hover:border-gray-600 hover:bg-gray-800/50"
                    }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={allowedTypes.map((t) => {
                        if (t === "video") return "video/*";
                        if (t === "audio") return "audio/*";
                        if (t === "image") return "image/*";
                        return "";
                    }).join(",")}
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <Upload
                    size={40}
                    className={`mx-auto mb-3 ${isDragging ? "text-indigo-400" : "text-gray-500"}`}
                />
                <p className="text-white font-medium">
                    Drag & drop files here, or click to browse
                </p>
                <p className="text-sm text-gray-500 mt-1">
                    {allowedTypes.join(", ")} • Max {formatFileSize(maxSizeBytes)} per file
                </p>
            </div>

            {/* File List */}
            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden"
                    >
                        <div className="p-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
                            <span className="text-sm text-white">
                                {files.length} file{files.length !== 1 ? "s" : ""} selected
                                {completedCount > 0 && ` • ${completedCount} uploaded`}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setFiles([])}
                                    className="text-sm text-gray-400 hover:text-white"
                                >
                                    Clear all
                                </button>
                                {pendingCount > 0 && (
                                    <button
                                        onClick={uploadAllFiles}
                                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
                                    >
                                        Upload {pendingCount} file{pendingCount !== 1 ? "s" : ""}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="divide-y divide-gray-800 max-h-64 overflow-y-auto">
                            {files.map((file) => (
                                <motion.div
                                    key={file.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="flex items-center gap-3 p-3 hover:bg-gray-800/50"
                                >
                                    {typeIcons[file.type]}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white truncate">{file.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-gray-500">
                                                {formatFileSize(file.size)}
                                            </span>
                                            {file.status === "uploading" && (
                                                <span className="text-xs text-indigo-400">
                                                    {file.progress}%
                                                </span>
                                            )}
                                            {file.status === "error" && (
                                                <span className="text-xs text-red-400">{file.error}</span>
                                            )}
                                        </div>
                                        {file.status === "uploading" && (
                                            <div className="h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 transition-all duration-300"
                                                    style={{ width: `${file.progress}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {file.status === "pending" && (
                                            <span className="w-6 h-6 flex items-center justify-center text-gray-500">
                                                <span className="w-2 h-2 bg-gray-500 rounded-full" />
                                            </span>
                                        )}
                                        {file.status === "uploading" && (
                                            <Loader2 size={18} className="text-indigo-400 animate-spin" />
                                        )}
                                        {file.status === "completed" && (
                                            <Check size={18} className="text-green-400" />
                                        )}
                                        {file.status === "error" && (
                                            <AlertCircle size={18} className="text-red-400" />
                                        )}
                                        <button
                                            onClick={() => removeFile(file.id)}
                                            className="p-1 text-gray-500 hover:text-white rounded"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
