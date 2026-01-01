// Video Editor Types
export interface TranscriptionSegment {
    id: number;
    start: number;
    end: number;
    text: string;
    include: boolean;
}

export interface VideoInfo {
    job_id: string;
    video_path: string;
    filename: string;
    duration: number;
    size: [number, number];
    fps: number;
}

export interface RenderedSlide {
    index: number;
    title: string;
    durationSec: number;
    pngPath: string;
    svgPath?: string | null;
}

export interface Project {
    id: string;
    name: string;
}

export interface Scene {
    id: string;
    name: string;
    orderIndex: number;
}

export interface Shot {
    id: string;
    name: string;
    orderIndex: number;
}

export type EditorMode = "edit" | "generate" | "slides";
export type ProcessingStatus =
    | "idle"
    | "uploading"
    | "transcribing"
    | "editing"
    | "generating"
    | "rendering-slides"
    | "removing-silence"
    | "saving"
    | "improving";

export interface VideoEditorState {
    // Mode and status
    mode: EditorMode;
    status: ProcessingStatus;
    progress: number;
    error: string | null;
    successMessage: string | null;

    // API status
    apiOnline: boolean | null;

    // Video state
    videoInfo: VideoInfo | null;
    segments: TranscriptionSegment[];
    editedVideoPath: string | null;

    // Script state
    script: string;
    language: string;
    dynamicSlidesEnabled: boolean;
    slidesSpecPath: string;
    slideTemplate: string;
    renderedSlides: RenderedSlide[];
    slidesOutputDir: string | null;

    // Save state
    saveTarget: "video" | "slides";
    showSaveModal: boolean;
    saveFileName: string;

    // Project integration
    projects: Project[];
    selectedProjectId: string;
    scenes: Scene[];
    selectedSceneId: string;
    shots: Shot[];
    selectedShotId: string;
    saveToShot: boolean;

    // AI Script Improvement
    originalScript: string;
    improvedScript: string;
    showImprovePreview: boolean;
    improveChanges: string[];

    // Undo/Redo
    segmentHistory: TranscriptionSegment[][];
    historyIndex: number;
}

export interface VideoEditorActions {
    // Mode actions
    setMode: (mode: EditorMode) => void;
    setStatus: (status: ProcessingStatus) => void;
    setProgress: (progress: number) => void;
    setError: (error: string | null) => void;
    setSuccessMessage: (message: string | null) => void;

    // Video actions
    setVideoInfo: (info: VideoInfo | null) => void;
    setSegments: (segments: TranscriptionSegment[]) => void;
    toggleSegment: (id: number) => void;
    setEditedVideoPath: (path: string | null) => void;

    // Script actions
    setScript: (script: string) => void;
    setLanguage: (language: string) => void;
    setDynamicSlidesEnabled: (enabled: boolean) => void;
    setSlidesSpecPath: (path: string) => void;
    setSlideTemplate: (template: string) => void;
    setRenderedSlides: (slides: RenderedSlide[]) => void;
    setSlidesOutputDir: (dir: string | null) => void;

    // Save actions
    setSaveTarget: (target: "video" | "slides") => void;
    setShowSaveModal: (show: boolean) => void;
    setSaveFileName: (name: string) => void;

    // Project actions
    setProjects: (projects: Project[]) => void;
    setSelectedProjectId: (id: string) => void;
    setScenes: (scenes: Scene[]) => void;
    setSelectedSceneId: (id: string) => void;
    setShots: (shots: Shot[]) => void;
    setSelectedShotId: (id: string) => void;
    setSaveToShot: (save: boolean) => void;

    // AI Script actions
    setOriginalScript: (script: string) => void;
    setImprovedScript: (script: string) => void;
    setShowImprovePreview: (show: boolean) => void;
    setImproveChanges: (changes: string[]) => void;

    // Undo/Redo actions
    pushToHistory: (segments: TranscriptionSegment[]) => void;
    handleUndo: () => void;
    handleRedo: () => void;

    // API actions
    setApiOnline: (online: boolean | null) => void;
    checkApiStatus: () => Promise<void>;

    // Main actions
    handleFileUpload: (file: File) => Promise<void>;
    handleTranscribe: () => Promise<void>;
    handleApplyEdits: () => Promise<void>;
    handleRemoveSilence: () => Promise<void>;
    handleGenerate: () => Promise<void>;
    handleRenderSlides: () => Promise<void>;
    handleGenerateSlidesVideo: () => Promise<void>;
    handleDownload: () => void;
    handleSaveToLibrary: () => Promise<void>;
    handleImproveScript: () => Promise<void>;
    applyImprovedScript: () => void;
    revertScript: () => void;
    openSaveModal: (target: "video" | "slides") => void;

    // Project fetching
    fetchProjects: () => Promise<void>;
    fetchScenes: (projectId: string) => Promise<void>;
    fetchShots: (sceneId: string) => Promise<void>;
}

// Helper function to format time
export const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toFixed(2).padStart(5, "0")}`;
};

// API Base URL
export const API_BASE = "http://localhost:8502";
