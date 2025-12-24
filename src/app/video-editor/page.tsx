"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
    Scissors,
    Upload,
    Play,
    Square,
    Download,
    Trash2,
    Type,
    Volume2,
    VolumeX,
    AlertCircle,
    CheckCircle,
    Loader2,
    RefreshCw,
    FileText,
    Wand2,
    FolderPlus,
    Library,
    Sparkles,
    Keyboard,
} from "lucide-react";

// API Base URL
const API_BASE = "http://localhost:8502";

// Types
interface TranscriptionSegment {
    id: number;
    start: number;
    end: number;
    text: string;
    include: boolean;
}

interface VideoInfo {
    job_id: string;
    video_path: string;
    filename: string;
    duration: number;
    size: [number, number];
    fps: number;
}

interface Project {
    id: string;
    name: string;
}

interface Scene {
    id: string;
    name: string;
    orderIndex: number;
}

interface Shot {
    id: string;
    name: string;
    orderIndex: number;
}

type EditorMode = "edit" | "generate";
type ProcessingStatus = "idle" | "uploading" | "transcribing" | "editing" | "generating" | "removing-silence" | "saving" | "improving";

// Helper function to format time
const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toFixed(2).padStart(5, "0")}`;
};

export default function VideoEditorPage() {
    // State
    const [mode, setMode] = useState<EditorMode>("edit");
    const [status, setStatus] = useState<ProcessingStatus>("idle");
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Video state
    const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
    const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
    const [editedVideoPath, setEditedVideoPath] = useState<string | null>(null);

    // Script state
    const [script, setScript] = useState("");
    const [language, setLanguage] = useState("ja");

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // API Status Check
    const [apiOnline, setApiOnline] = useState<boolean | null>(null);

    // Projects for asset linking
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveFileName, setSaveFileName] = useState("");

    // Scene/Shot selection for deep integration
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [selectedSceneId, setSelectedSceneId] = useState<string>("");
    const [shots, setShots] = useState<Shot[]>([]);
    const [selectedShotId, setSelectedShotId] = useState<string>("");
    const [saveToShot, setSaveToShot] = useState(false);

    // AI Script Improvement
    const [originalScript, setOriginalScript] = useState<string>("");
    const [improvedScript, setImprovedScript] = useState<string>("");
    const [showImprovePreview, setShowImprovePreview] = useState(false);
    const [improveChanges, setImproveChanges] = useState<string[]>([]);

    // Undo/Redo state (for segments)
    const [segmentHistory, setSegmentHistory] = useState<TranscriptionSegment[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Push to history when segments change (for undo)
    const pushToHistory = useCallback((newSegments: TranscriptionSegment[]) => {
        setSegmentHistory(prev => {
            const truncated = prev.slice(0, historyIndex + 1);
            return [...truncated, newSegments].slice(-20); // Keep last 20 states
        });
        setHistoryIndex(prev => Math.min(prev + 1, 19));
    }, [historyIndex]);

    // Undo
    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
            setSegments(segmentHistory[historyIndex - 1]);
        }
    }, [historyIndex, segmentHistory]);

    // Redo
    const handleRedo = useCallback(() => {
        if (historyIndex < segmentHistory.length - 1) {
            setHistoryIndex(prev => prev + 1);
            setSegments(segmentHistory[historyIndex + 1]);
        }
    }, [historyIndex, segmentHistory]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input/textarea
            const target = e.target as HTMLElement;
            if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
                return;
            }

            // Space: Play/Pause video
            if (e.code === "Space" && videoRef.current) {
                e.preventDefault();
                if (videoRef.current.paused) {
                    videoRef.current.play();
                } else {
                    videoRef.current.pause();
                }
            }

            // Delete: Remove selected (unchecked) segments
            if (e.code === "Delete" || e.code === "Backspace") {
                if (segments.length > 0 && mode === "edit") {
                    const newSegments = segments.filter(s => s.include);
                    if (newSegments.length !== segments.length) {
                        pushToHistory(newSegments);
                        setSegments(newSegments);
                    }
                }
            }

            // Ctrl+A: Select all segments
            if ((e.ctrlKey || e.metaKey) && e.code === "KeyA") {
                e.preventDefault();
                if (segments.length > 0) {
                    const allSelected = segments.map(s => ({ ...s, include: true }));
                    pushToHistory(allSelected);
                    setSegments(allSelected);
                }
            }

            // Ctrl+Z: Undo
            if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ" && !e.shiftKey) {
                e.preventDefault();
                handleUndo();
            }

            // Ctrl+Shift+Z or Ctrl+Y: Redo
            if ((e.ctrlKey || e.metaKey) && (e.code === "KeyY" || (e.shiftKey && e.code === "KeyZ"))) {
                e.preventDefault();
                handleRedo();
            }

            // Ctrl+S: Open save modal
            if ((e.ctrlKey || e.metaKey) && e.code === "KeyS") {
                e.preventDefault();
                if (editedVideoPath) {
                    openSaveModal();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [segments, mode, editedVideoPath, handleUndo, handleRedo, pushToHistory]);

    useEffect(() => {
        checkApiStatus();
        fetchProjects();
    }, []);

    const checkApiStatus = async () => {
        try {
            const res = await fetch(`${API_BASE}/health`);
            setApiOnline(res.ok);
        } catch {
            setApiOnline(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/projects`);
            if (res.ok) {
                const data = await res.json();
                setProjects(data.projects || []);
            }
        } catch {
            // Projects API not available, continue without
        }
    };

    // Fetch scenes when project changes
    const fetchScenes = async (projectId: string) => {
        if (!projectId) {
            setScenes([]);
            setSelectedSceneId("");
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/api/scenes?projectId=${projectId}`);
            if (res.ok) {
                const data = await res.json();
                setScenes(data.scenes || []);
            }
        } catch {
            setScenes([]);
        }
    };

    // Fetch shots when scene changes
    const fetchShots = async (sceneId: string) => {
        if (!sceneId || !selectedProjectId) {
            setShots([]);
            setSelectedShotId("");
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/api/shots?sceneId=${sceneId}&projectId=${selectedProjectId}`);
            if (res.ok) {
                const data = await res.json();
                setShots(data.shots || []);
            }
        } catch {
            setShots([]);
        }
    };

    // Handle project selection change
    useEffect(() => {
        if (selectedProjectId) {
            fetchScenes(selectedProjectId);
        } else {
            setScenes([]);
            setSelectedSceneId("");
        }
    }, [selectedProjectId]);

    // Handle scene selection change
    useEffect(() => {
        if (selectedSceneId) {
            fetchShots(selectedSceneId);
        } else {
            setShots([]);
            setSelectedShotId("");
        }
    }, [selectedSceneId, selectedProjectId]);

    // AI Script Improvement
    const handleImproveScript = async () => {
        if (!script.trim()) {
            setError("台本を入力してください");
            return;
        }

        setStatus("improving");
        setError(null);
        setProgress(30);
        setOriginalScript(script);

        try {
            const res = await fetch(`${API_BASE}/api/script/improve?script=${encodeURIComponent(script)}&language=${language}`, {
                method: "POST",
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Script improvement failed");
            }

            const data = await res.json();
            setImprovedScript(data.improved);
            setImproveChanges(data.changes || []);
            setProgress(100);
            setShowImprovePreview(true);
            setStatus("idle");
        } catch (err) {
            setError(err instanceof Error ? err.message : "AI improvement failed");
            setStatus("idle");
        }
    };

    // Apply improved script
    const applyImprovedScript = () => {
        setScript(improvedScript);
        setShowImprovePreview(false);
        setSuccessMessage("改善された台本を適用しました");
    };

    // Revert to original script
    const revertScript = () => {
        setScript(originalScript);
        setShowImprovePreview(false);
    };

    // File Upload
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus("uploading");
        setError(null);
        setProgress(0);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(`${API_BASE}/api/video/upload`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Upload failed");
            }

            const data = await res.json();
            setVideoInfo(data);
            setProgress(100);
            setSuccessMessage("動画のアップロードが完了しました");
            setStatus("idle");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
            setStatus("idle");
        }
    };

    // Transcription
    const handleTranscribe = async () => {
        if (!videoInfo) return;

        setStatus("transcribing");
        setError(null);
        setProgress(10);

        try {
            const res = await fetch(
                `${API_BASE}/api/video/transcribe?video_path=${encodeURIComponent(videoInfo.video_path)}&language=${language}`,
                { method: "POST" }
            );

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Transcription failed");
            }

            const data = await res.json();
            setSegments(data.segments);
            setProgress(100);
            setSuccessMessage(`${data.segments.length}個のセグメントを検出しました`);
            setStatus("idle");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Transcription failed");
            setStatus("idle");
        }
    };

    // Toggle segment inclusion
    const toggleSegment = (id: number) => {
        setSegments(prev =>
            prev.map(seg =>
                seg.id === id ? { ...seg, include: !seg.include } : seg
            )
        );
    };

    // Apply edits
    const handleApplyEdits = async () => {
        if (!videoInfo || segments.length === 0) return;

        const includedCount = segments.filter(s => s.include).length;
        if (includedCount === 0) {
            setError("少なくとも1つのセグメントを選択してください");
            return;
        }

        setStatus("editing");
        setError(null);
        setProgress(30);

        try {
            const res = await fetch(`${API_BASE}/api/video/edit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    video_path: videoInfo.video_path,
                    segments: segments,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Edit failed");
            }

            const data = await res.json();
            setEditedVideoPath(data.output_path);
            setProgress(100);
            setSuccessMessage(`編集完了: ${data.duration.toFixed(1)}秒`);
            setStatus("idle");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Edit failed");
            setStatus("idle");
        }
    };

    // Remove silence
    const handleRemoveSilence = async () => {
        if (!videoInfo) return;

        setStatus("removing-silence");
        setError(null);
        setProgress(20);

        try {
            const res = await fetch(`${API_BASE}/api/video/remove-silence`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    video_path: videoInfo.video_path,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Silence removal failed");
            }

            const data = await res.json();
            setEditedVideoPath(data.output_path);
            setProgress(100);
            setSuccessMessage(`${data.silence_removed_count}箇所の無音を削除しました`);
            setStatus("idle");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Silence removal failed");
            setStatus("idle");
        }
    };

    // Generate from script
    const handleGenerate = async () => {
        if (!script.trim()) {
            setError("台本を入力してください");
            return;
        }

        setStatus("generating");
        setError(null);
        setProgress(20);

        try {
            const res = await fetch(`${API_BASE}/api/video/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    script: script,
                    language: language,
                    add_subtitles: true,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Generation failed");
            }

            const data = await res.json();
            setEditedVideoPath(data.output_path);
            setProgress(100);
            setSuccessMessage(`動画生成完了: ${data.duration.toFixed(1)}秒`);
            setStatus("idle");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Generation failed");
            setStatus("idle");
        }
    };

    // Download
    const handleDownload = async () => {
        if (!editedVideoPath) return;

        const downloadUrl = `${API_BASE}/api/video/serve?path=${encodeURIComponent(editedVideoPath)}`;
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = "edited_video.mp4";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Save to Library
    const handleSaveToLibrary = async () => {
        if (!editedVideoPath || !saveFileName.trim()) {
            setError("ファイル名を入力してください");
            return;
        }

        setStatus("saving");
        setError(null);
        setProgress(50);
        setShowSaveModal(false);

        try {
            const res = await fetch(`${API_BASE}/api/video/save-to-library`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    video_path: editedVideoPath,
                    file_name: saveFileName.endsWith(".mp4") ? saveFileName : `${saveFileName}.mp4`,
                    project_id: selectedProjectId || undefined,
                    source: "video_editor",
                    description: mode === "generate" ? script.substring(0, 200) : undefined,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Save failed");
            }

            const data = await res.json();
            setProgress(100);
            setSuccessMessage(`ライブラリに保存しました${selectedProjectId ? " (プロジェクトにリンク済み)" : ""}`);
            setStatus("idle");
            setSaveFileName("");
            setSelectedProjectId("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Save to library failed");
            setStatus("idle");
        }
    };

    // Open save modal
    const openSaveModal = () => {
        // Generate default filename
        const date = new Date().toISOString().slice(0, 10);
        const defaultName = mode === "edit"
            ? `edited_${videoInfo?.filename?.replace(/\.[^/.]+$/, "") || "video"}_${date}.mp4`
            : `generated_${date}.mp4`;
        setSaveFileName(defaultName);
        setShowSaveModal(true);
    };

    // Clear messages after timeout
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 10000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const isProcessing = status !== "idle";

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Scissors className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">動画エディタ</h1>
                        <p className="text-gray-400 text-sm">AI文字起こし＆テキストベース編集</p>
                    </div>
                </div>

                {/* API Status */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-full">
                        {apiOnline === null ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        ) : apiOnline ? (
                            <>
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-green-400">API Online</span>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-4 h-4 text-red-400" />
                                <span className="text-sm text-red-400">API Offline</span>
                            </>
                        )}
                    </div>
                    <button
                        onClick={checkApiStatus}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setMode("edit")}
                    className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${mode === "edit"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        }`}
                >
                    <Scissors className="w-5 h-5" />
                    動画編集モード
                </button>
                <button
                    onClick={() => setMode("generate")}
                    className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${mode === "generate"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        }`}
                >
                    <Type className="w-5 h-5" />
                    テキストから生成
                </button>
            </div>

            {/* Alerts */}
            {error && (
                <div className="mb-4 p-4 bg-red-900/30 border border-red-500 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <span className="text-red-200">{error}</span>
                </div>
            )}
            {successMessage && (
                <div className="mb-4 p-4 bg-green-900/30 border border-green-500 rounded-lg flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-green-200">{successMessage}</span>
                </div>
            )}

            {/* Progress Bar */}
            {isProcessing && (
                <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                        <span>
                            {status === "uploading" && "アップロード中..."}
                            {status === "transcribing" && "文字起こし中..."}
                            {status === "editing" && "編集中..."}
                            {status === "generating" && "動画生成中..."}
                            {status === "removing-silence" && "無音削除中..."}
                            {status === "saving" && "ライブラリに保存中..."}
                            {status === "improving" && "AIで台本を改善中..."}
                        </span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-600 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Video */}
                <div className="space-y-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Play className="w-5 h-5" />
                            {mode === "edit" ? "動画プレビュー" : "生成プレビュー"}
                        </h2>

                        {mode === "edit" ? (
                            <>
                                {/* Video Upload */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />

                                {!videoInfo ? (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="h-64 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors"
                                    >
                                        <Upload className="w-12 h-12 text-gray-500 mb-3" />
                                        <p className="text-gray-400">クリックして動画をアップロード</p>
                                        <p className="text-gray-500 text-sm mt-1">MP4, MOV, AVI, MKV</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <video
                                            ref={videoRef}
                                            src={`${API_BASE}/api/video/serve?path=${encodeURIComponent(
                                                editedVideoPath || videoInfo.video_path
                                            )}`}
                                            controls
                                            className="w-full rounded-lg bg-black"
                                        />
                                        <div className="flex gap-2 text-sm text-gray-400">
                                            <span>{videoInfo.filename}</span>
                                            <span>•</span>
                                            <span>{videoInfo.duration.toFixed(1)}秒</span>
                                            <span>•</span>
                                            <span>{videoInfo.size[0]}x{videoInfo.size[1]}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={handleTranscribe}
                                        disabled={!videoInfo || isProcessing}
                                        className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <FileText className="w-4 h-4" />
                                        文字起こし
                                    </button>
                                    <button
                                        onClick={handleRemoveSilence}
                                        disabled={!videoInfo || isProcessing}
                                        className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <VolumeX className="w-4 h-4" />
                                        無音削除
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Script Preview */}
                                {editedVideoPath ? (
                                    <video
                                        src={`${API_BASE}/api/video/serve?path=${encodeURIComponent(editedVideoPath)}`}
                                        controls
                                        className="w-full rounded-lg bg-black"
                                    />
                                ) : (
                                    <div className="h-64 bg-gradient-to-br from-green-900/30 to-teal-900/30 rounded-lg flex flex-col items-center justify-center">
                                        <Wand2 className="w-12 h-12 text-green-400 mb-3" />
                                        <p className="text-gray-400">台本を入力して動画を生成</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Action Buttons */}
                    {editedVideoPath && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleDownload}
                                className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-500 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                <Download className="w-5 h-5" />
                                ダウンロード
                            </button>
                            <button
                                onClick={openSaveModal}
                                disabled={isProcessing}
                                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                <Library className="w-5 h-5" />
                                ライブラリに保存
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Column - Editor */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    {mode === "edit" ? (
                        <>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Scissors className="w-5 h-5" />
                                字幕エディタ
                            </h2>

                            {segments.length === 0 ? (
                                <div className="h-96 flex flex-col items-center justify-center text-gray-500">
                                    <FileText className="w-12 h-12 mb-3" />
                                    <p>動画をアップロードして</p>
                                    <p>「文字起こし」を実行してください</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                        {segments.map(seg => (
                                            <div
                                                key={seg.id}
                                                className={`p-3 rounded-lg border transition-colors cursor-pointer ${seg.include
                                                    ? "bg-gray-800 border-gray-700 hover:border-indigo-500"
                                                    : "bg-gray-900/50 border-gray-800 opacity-50"
                                                    }`}
                                                onClick={() => toggleSegment(seg.id)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={seg.include}
                                                        onChange={() => toggleSegment(seg.id)}
                                                        className="mt-1 w-4 h-4 rounded bg-gray-700 border-gray-600"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white">{seg.text}</p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {formatTime(seg.start)} → {formatTime(seg.end)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-800">
                                        <p className="text-sm text-gray-400 mb-3">
                                            {segments.filter(s => s.include).length} / {segments.length} セグメント選択中
                                        </p>
                                        <button
                                            onClick={handleApplyEdits}
                                            disabled={isProcessing}
                                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Scissors className="w-5 h-5" />
                                            選択した区間で編集
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Type className="w-5 h-5" />
                                台本入力
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">言語</label>
                                    <select
                                        value={language}
                                        onChange={e => setLanguage(e.target.value)}
                                        className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                                    >
                                        <option value="ja">日本語</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm text-gray-400">台本</label>
                                        <button
                                            onClick={handleImproveScript}
                                            disabled={!script.trim() || isProcessing}
                                            className="flex items-center gap-1 px-3 py-1 text-xs bg-purple-600/30 hover:bg-purple-600/50 disabled:bg-gray-800 disabled:text-gray-500 border border-purple-500/50 rounded-full transition-colors"
                                        >
                                            <Sparkles className="w-3 h-3" />
                                            AIで改善
                                        </button>
                                    </div>
                                    <textarea
                                        value={script}
                                        onChange={e => setScript(e.target.value)}
                                        placeholder="こんにちは。&#10;これはテスト動画です。&#10;ご視聴ありがとうございます。"
                                        className="w-full h-64 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {script.length}文字
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={!script.trim() || isProcessing}
                                        className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Wand2 className="w-5 h-5" />
                                        動画を生成
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Keyboard Shortcuts Tooltip */}
            <div className="fixed bottom-4 right-4 group">
                <div className="p-2 bg-gray-800 rounded-lg cursor-help hover:bg-gray-700 transition-colors">
                    <Keyboard className="w-5 h-5 text-gray-400" />
                </div>
                <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-900 border border-gray-700 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <h4 className="text-sm font-semibold mb-2">キーボードショートカット</h4>
                    <ul className="text-xs text-gray-400 space-y-1">
                        <li><kbd className="px-1 bg-gray-700 rounded">Space</kbd> 再生/一時停止</li>
                        <li><kbd className="px-1 bg-gray-700 rounded">Delete</kbd> 未選択を削除</li>
                        <li><kbd className="px-1 bg-gray-700 rounded">⌘+A</kbd> 全選択</li>
                        <li><kbd className="px-1 bg-gray-700 rounded">⌘+Z</kbd> 元に戻す</li>
                        <li><kbd className="px-1 bg-gray-700 rounded">⌘+S</kbd> 保存</li>
                    </ul>
                </div>
            </div>

            {/* AI Improve Preview Modal */}
            {showImprovePreview && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">AIによる改善案</h2>
                                <p className="text-gray-400 text-sm">適用するか選択してください</p>
                            </div>
                        </div>

                        {improveChanges.length > 0 && (
                            <div className="mb-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                                <h4 className="text-sm font-medium text-purple-300 mb-2">改善ポイント:</h4>
                                <ul className="text-sm text-gray-300 space-y-1">
                                    {improveChanges.map((change, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-purple-400">•</span>
                                            {change}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <h4 className="text-sm text-gray-400 mb-2">元の台本</h4>
                                <div className="p-3 bg-gray-800 border border-gray-700 rounded-lg h-48 overflow-y-auto text-sm text-gray-300 whitespace-pre-wrap">
                                    {originalScript}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm text-gray-400 mb-2">改善後</h4>
                                <div className="p-3 bg-gray-800 border border-purple-500/50 rounded-lg h-48 overflow-y-auto text-sm text-white whitespace-pre-wrap">
                                    {improvedScript}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={revertScript}
                                className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            >
                                元のまま使う
                            </button>
                            <button
                                onClick={applyImprovedScript}
                                className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-500 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                <Sparkles className="w-5 h-5" />
                                改善版を適用
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* API Not Running Warning */}
            {apiOnline === false && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-md text-center">
                        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">APIサーバーが起動していません</h2>
                        <p className="text-gray-400 mb-6">
                            以下のコマンドを実行してAPIサーバーを起動してください：
                        </p>
                        <div className="bg-gray-950 border border-gray-700 rounded-lg p-4 mb-6">
                            <code className="text-green-400 font-mono text-sm">
                                npm run dev:api
                            </code>
                        </div>
                        <button
                            onClick={checkApiStatus}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                        >
                            再確認
                        </button>
                    </div>
                </div>
            )}

            {/* Save to Library Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <Library className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">ライブラリに保存</h2>
                                <p className="text-gray-400 text-sm">素材ライブラリにAssetとして登録</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* File Name */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    ファイル名 <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={saveFileName}
                                    onChange={(e) => setSaveFileName(e.target.value)}
                                    placeholder="video_name.mp4"
                                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                                />
                            </div>

                            {/* Project Selector */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    プロジェクトにリンク（オプション）
                                </label>
                                <select
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                                >
                                    <option value="">リンクしない</option>
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                                {projects.length === 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        プロジェクトが見つかりません
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleSaveToLibrary}
                                disabled={!saveFileName.trim()}
                                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                <FolderPlus className="w-5 h-5" />
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
