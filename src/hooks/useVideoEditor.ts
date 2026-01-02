'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
    VideoEditorState,
    VideoEditorActions,
    TranscriptionSegment,
    VideoInfo,
    RenderedSlide,
    Project,
    Scene,
    Shot,
    EditorMode,
    ProcessingStatus,
    API_BASE,
} from '../components/video-editor/types';

export function useVideoEditor(): VideoEditorState & VideoEditorActions {
    // Mode and status
    const [mode, setMode] = useState<EditorMode>("edit");
    const [status, setStatus] = useState<ProcessingStatus>("idle");
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // API status
    const [apiOnline, setApiOnline] = useState<boolean | null>(null);

    // Video state
    const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
    const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
    const [editedVideoPath, setEditedVideoPath] = useState<string | null>(null);

    // Script state
    const [script, setScript] = useState("");
    const [language, setLanguage] = useState("ja");
    const [dynamicSlidesEnabled, setDynamicSlidesEnabled] = useState(false);
    const [slidesSpecPath, setSlidesSpecPath] = useState("slides/spec.yml");
    const [slideTemplate, setSlideTemplate] = useState("classic");
    const [renderedSlides, setRenderedSlides] = useState<RenderedSlide[]>([]);
    const [slidesOutputDir, setSlidesOutputDir] = useState<string | null>(null);

    // Save state
    const [saveTarget, setSaveTarget] = useState<"video" | "slides">("video");
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveFileName, setSaveFileName] = useState("");

    // Project integration
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
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

    // Undo/Redo
    const [segmentHistory, setSegmentHistory] = useState<TranscriptionSegment[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Refs for video element (managed in component)
    const videoRef = useRef<HTMLVideoElement>(null);

    // Push to history
    const pushToHistory = useCallback((newSegments: TranscriptionSegment[]) => {
        setSegmentHistory(prev => {
            const truncated = prev.slice(0, historyIndex + 1);
            return [...truncated, newSegments].slice(-20);
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

    // Toggle segment
    const toggleSegment = useCallback((id: number) => {
        setSegments(prev =>
            prev.map(seg =>
                seg.id === id ? { ...seg, include: !seg.include } : seg
            )
        );
    }, []);

    // Check API status
    const checkApiStatus = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/health`);
            setApiOnline(res.ok);
        } catch {
            setApiOnline(false);
        }
    }, []);

    // Fetch projects
    const fetchProjects = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/projects`);
            if (res.ok) {
                const data = await res.json();
                setProjects(data.projects || []);
            }
        } catch {
            // Projects API not available
        }
    }, []);

    // Fetch scenes
    const fetchScenes = useCallback(async (projectId: string) => {
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
    }, []);

    // Fetch shots
    const fetchShots = useCallback(async (sceneId: string) => {
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
    }, [selectedProjectId]);

    // File Upload
    const handleFileUpload = useCallback(async (file: File) => {
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
    }, []);

    // Transcription
    const handleTranscribe = useCallback(async () => {
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
    }, [videoInfo, language]);

    // Apply edits
    const handleApplyEdits = useCallback(async () => {
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
    }, [videoInfo, segments]);

    // Remove silence
    const handleRemoveSilence = useCallback(async () => {
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
    }, [videoInfo]);

    // Generate from script
    const handleGenerate = useCallback(async () => {
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
    }, [script, language]);

    // Render slides
    const handleRenderSlides = useCallback(async () => {
        if (!slidesSpecPath.trim()) {
            setError("spec.yml のパスを入力してください");
            return;
        }

        setStatus("rendering-slides");
        setError(null);
        setProgress(20);

        try {
            const res = await fetch(`${API_BASE}/api/slides/render`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    spec_path: slidesSpecPath,
                    template: slideTemplate,
                    emit_svg: false,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Slide render failed");
            }

            const data = await res.json();
            setRenderedSlides(data.slides || []);
            setSlidesOutputDir(data.outputDir || null);
            setProgress(100);
            setSuccessMessage(`スライド生成完了: ${data.slideCount}枚`);
            setStatus("idle");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Slide render failed");
            setStatus("idle");
        }
    }, [slidesSpecPath, slideTemplate]);

    // Generate slides video
    const handleGenerateSlidesVideo = useCallback(async () => {
        if (!slidesSpecPath.trim()) {
            setError("spec.yml のパスを入力してください");
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
                    dynamic_slides: true,
                    slides_spec_path: slidesSpecPath,
                    slides_dir: slidesOutputDir || undefined,
                    template: slideTemplate,
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
    }, [slidesSpecPath, slidesOutputDir, slideTemplate]);

    // Download
    const handleDownload = useCallback(() => {
        if (!editedVideoPath) return;

        const downloadUrl = `${API_BASE}/api/video/serve?path=${encodeURIComponent(editedVideoPath)}`;
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = mode === "slides" ? "slides_video.mp4" : "edited_video.mp4";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }, [editedVideoPath, mode]);

    // Save video to library
    const handleSaveVideoToLibrary = useCallback(async () => {
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
                    description: mode === "generate"
                        ? script.substring(0, 200)
                        : mode === "slides"
                            ? `slides_spec: ${slidesSpecPath}`
                            : undefined,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Save failed");
            }

            setProgress(100);
            setSuccessMessage(`ライブラリに保存しました${selectedProjectId ? " (プロジェクトにリンク済み)" : ""}`);
            setStatus("idle");
            setSaveFileName("");
            setSelectedProjectId("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Save to library failed");
            setStatus("idle");
        }
    }, [editedVideoPath, saveFileName, selectedProjectId, mode, script, slidesSpecPath]);

    // Save slides to library
    const handleSaveSlidesToLibrary = useCallback(async () => {
        if (!saveFileName.trim()) {
            setError("ファイル名を入力してください");
            return;
        }

        if (!slidesSpecPath.trim() && !slidesOutputDir) {
            setError("spec.yml のパスを入力してください");
            return;
        }

        setStatus("saving");
        setError(null);
        setProgress(50);
        setShowSaveModal(false);

        try {
            const res = await fetch(`${API_BASE}/api/slides/save-to-library`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    file_name: saveFileName,
                    slides_dir: slidesOutputDir || undefined,
                    spec_path: slidesSpecPath || undefined,
                    template: slideTemplate,
                    project_id: selectedProjectId || undefined,
                    source: "dynamic_slides",
                    description: `slides_spec: ${slidesSpecPath}`,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Save failed");
            }

            setProgress(100);
            setSuccessMessage(`スライドデッキを保存しました${selectedProjectId ? " (プロジェクトにリンク済み)" : ""}`);
            setStatus("idle");
            setSaveFileName("");
            setSelectedProjectId("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Save to library failed");
            setStatus("idle");
        }
    }, [saveFileName, slidesSpecPath, slidesOutputDir, slideTemplate, selectedProjectId]);

    // Save to library
    const handleSaveToLibrary = useCallback(async () => {
        if (saveTarget === "slides") {
            await handleSaveSlidesToLibrary();
        } else {
            await handleSaveVideoToLibrary();
        }
    }, [saveTarget, handleSaveSlidesToLibrary, handleSaveVideoToLibrary]);

    // AI Script Improvement
    const handleImproveScript = useCallback(async () => {
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
    }, [script, language]);

    // Apply improved script
    const applyImprovedScript = useCallback(() => {
        setScript(improvedScript);
        setShowImprovePreview(false);
        setSuccessMessage("改善された台本を適用しました");
    }, [improvedScript]);

    // Revert script
    const revertScript = useCallback(() => {
        setScript(originalScript);
        setShowImprovePreview(false);
    }, [originalScript]);

    // Open save modal
    const openSaveModal = useCallback((target: "video" | "slides" = "video") => {
        const date = new Date().toISOString().slice(0, 10);
        const defaultName = target === "slides"
            ? `slides_${date}.zip`
            : mode === "edit"
                ? `edited_${videoInfo?.filename?.replace(/\.[^/.]+$/, "") || "video"}_${date}.mp4`
                : `generated_${date}.mp4`;
        setSaveTarget(target);
        setSaveFileName(defaultName);
        setShowSaveModal(true);
    }, [mode, videoInfo]);

    // Effects for localStorage
    useEffect(() => {
        const saved = localStorage.getItem("dynamicSlidesEnabled");
        if (saved !== null) {
            setDynamicSlidesEnabled(saved === "true");
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("dynamicSlidesEnabled", String(dynamicSlidesEnabled));
    }, [dynamicSlidesEnabled]);

    // Reset slides when spec changes
    useEffect(() => {
        setRenderedSlides([]);
        setSlidesOutputDir(null);
    }, [slidesSpecPath, slideTemplate]);

    // Auto-switch from slides mode if disabled
    useEffect(() => {
        if (!dynamicSlidesEnabled && mode === "slides") {
            setMode("generate");
        }
    }, [dynamicSlidesEnabled, mode]);

    // Initial API check and project fetch
    useEffect(() => {
        checkApiStatus();
        fetchProjects();
    }, [checkApiStatus, fetchProjects]);

    // Fetch scenes when project changes
    useEffect(() => {
        if (selectedProjectId) {
            fetchScenes(selectedProjectId);
        } else {
            setScenes([]);
            setSelectedSceneId("");
        }
    }, [selectedProjectId, fetchScenes]);

    // Fetch shots when scene changes
    useEffect(() => {
        if (selectedSceneId) {
            fetchShots(selectedSceneId);
        } else {
            setShots([]);
            setSelectedShotId("");
        }
    }, [selectedSceneId, fetchShots]);

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

    return {
        // State
        mode,
        status,
        progress,
        error,
        successMessage,
        apiOnline,
        videoInfo,
        segments,
        editedVideoPath,
        script,
        language,
        dynamicSlidesEnabled,
        slidesSpecPath,
        slideTemplate,
        renderedSlides,
        slidesOutputDir,
        saveTarget,
        showSaveModal,
        saveFileName,
        projects,
        selectedProjectId,
        scenes,
        selectedSceneId,
        shots,
        selectedShotId,
        saveToShot,
        originalScript,
        improvedScript,
        showImprovePreview,
        improveChanges,
        segmentHistory,
        historyIndex,

        // Actions
        setMode,
        setStatus,
        setProgress,
        setError,
        setSuccessMessage,
        setVideoInfo,
        setSegments,
        toggleSegment,
        setEditedVideoPath,
        setScript,
        setLanguage,
        setDynamicSlidesEnabled,
        setSlidesSpecPath,
        setSlideTemplate,
        setRenderedSlides,
        setSlidesOutputDir,
        setSaveTarget,
        setShowSaveModal,
        setSaveFileName,
        setProjects,
        setSelectedProjectId,
        setScenes,
        setSelectedSceneId,
        setShots,
        setSelectedShotId,
        setSaveToShot,
        setOriginalScript,
        setImprovedScript,
        setShowImprovePreview,
        setImproveChanges,
        pushToHistory,
        handleUndo,
        handleRedo,
        setApiOnline,
        checkApiStatus,
        handleFileUpload,
        handleTranscribe,
        handleApplyEdits,
        handleRemoveSilence,
        handleGenerate,
        handleRenderSlides,
        handleGenerateSlidesVideo,
        handleDownload,
        handleSaveToLibrary,
        handleImproveScript,
        applyImprovedScript,
        revertScript,
        openSaveModal,
        fetchProjects,
        fetchScenes,
        fetchShots,
    };
}
