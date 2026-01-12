"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Copy, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

type ShortsPackage = {
    title: string;
    tone: string;
    hook: string;
    outline: string[];
    script: string;
    tags: string[];
    assets: string[];
    closing: string;
    quiz: {
        question: string;
        choices: string[];
        answer: string;
    };
};

async function copyToClipboard(value: string, message: string) {
    try {
        await navigator.clipboard.writeText(value);
        toast.success(message);
    } catch {
        toast.error("コピーに失敗しました");
    }
}

export default function AiCreatePage() {
    const router = useRouter();
    const TITLE_TARGET_COUNT = 30;
    const [currentStep, setCurrentStep] = useState(1);
    const [theme, setTheme] = useState("");
    const [tone, setTone] = useState("");
    const [titles, setTitles] = useState<string[]>([]);
    const [selectedTitle, setSelectedTitle] = useState("");
    const [selectedTitles, setSelectedTitles] = useState<Set<string>>(new Set());
    const [packageData, setPackageData] = useState<ShortsPackage | null>(null);
    const [scriptDraft, setScriptDraft] = useState("");
    const [titleFilter, setTitleFilter] = useState("");
    const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
    const [isGeneratingPackage, setIsGeneratingPackage] = useState(false);
    const [isCreatingEpisode, setIsCreatingEpisode] = useState(false);
    const [isSavingAsset, setIsSavingAsset] = useState(false);
    const [isRegisteringTitles, setIsRegisteringTitles] = useState(false);
    const [titleProgress, setTitleProgress] = useState(0);
    const [titleStreamComplete, setTitleStreamComplete] = useState(false);
    const [titleStreamError, setTitleStreamError] = useState<string | null>(null);
    const [draftAssetId, setDraftAssetId] = useState<string | null>(null);
    const [createdEpisodeId, setCreatedEpisodeId] = useState<string | null>(null);
    const [savedAssetId, setSavedAssetId] = useState<string | null>(null);
    const filteredTitles = useMemo(() => {
        if (!titleFilter.trim()) return titles;
        return titles.filter((title) => title.includes(titleFilter.trim()));
    }, [titles, titleFilter]);
    const selectedTitlesList = useMemo(() => Array.from(selectedTitles), [selectedTitles]);

    const steps = [
        { id: 1, label: "テーマ入力", done: theme.trim().length > 0 },
        { id: 2, label: "タイトル選択", done: titles.length > 0 && selectedTitle.trim().length > 0 },
        { id: 3, label: "台本生成", done: !!packageData },
        { id: 4, label: "投稿作成", done: !!createdEpisodeId },
    ];

    const canGoToStep = (stepId: number) => {
        if (stepId === 1) return true;
        if (stepId === 2) return titles.length > 0;
        if (stepId === 3) return selectedTitle.trim().length > 0;
        return false;
    };

    const handleGenerateTitles = async () => {
        if (!theme.trim() || isGeneratingTitles) return;
        setIsGeneratingTitles(true);
        setPackageData(null);
        setScriptDraft("");
        setCreatedEpisodeId(null);
        setSavedAssetId(null);
        setSelectedTitles(new Set());
        setTitleProgress(0);
        setTitleStreamComplete(false);
        setTitleStreamError(null);
        setTitles([]);
        setDraftAssetId(null);

        try {
            const res = await fetch("/api/ai/shorts/ideas/stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ theme }),
            });

            if (!res.ok || !res.body) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "タイトル生成に失敗しました");
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            const applyTitle = (title: string, index?: number) => {
                setTitles((prev) => {
                    if (prev.includes(title)) return prev;
                    return [...prev, title];
                });
                setTitleProgress((prev) => Math.max(prev, index || prev + 1));
                setSelectedTitle((prev) => (prev.trim() ? prev : title));
                setCurrentStep((prev) => (prev === 1 ? 2 : prev));
            };

            const flushEvent = (raw: string) => {
                const lines = raw.split("\n");
                let eventName = "message";
                let dataLine = "";
                for (const line of lines) {
                    if (line.startsWith("event:")) {
                        eventName = line.replace("event:", "").trim();
                    } else if (line.startsWith("data:")) {
                        dataLine += line.replace("data:", "").trim();
                    }
                }

                if (!dataLine) return;
                const payload = JSON.parse(dataLine);
                if (eventName === "tone" && payload?.tone) {
                    setTone((prev) => prev.trim() || payload.tone);
                }
                if (eventName === "title" && payload?.title) {
                    applyTitle(payload.title, payload.index);
                }
                if (eventName === "done") {
                    setTitleStreamComplete(true);
                    setCurrentStep(2);
                }
                if (eventName === "error") {
                    throw new Error(payload?.error || "タイトル生成に失敗しました");
                }
            };

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                let boundary = buffer.indexOf("\n\n");
                while (boundary !== -1) {
                    const chunk = buffer.slice(0, boundary);
                    buffer = buffer.slice(boundary + 2);
                    flushEvent(chunk);
                    boundary = buffer.indexOf("\n\n");
                }
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "タイトル生成に失敗しました";
            setTitleStreamError(message);
            toast.error(message);
        } finally {
            setIsGeneratingTitles(false);
        }
    };

    const toggleTitleSelection = (title: string) => {
        setSelectedTitles((prev) => {
            const next = new Set(prev);
            if (next.has(title)) {
                next.delete(title);
            } else {
                next.add(title);
            }
            return next;
        });
    };

    const handleSelectAllTitles = () => {
        setSelectedTitles(new Set(filteredTitles));
    };

    const handleClearSelectedTitles = () => {
        setSelectedTitles(new Set());
    };

    const handleRegisterTitles = async () => {
        if (selectedTitles.size === 0 || isRegisteringTitles) return;
        setIsRegisteringTitles(true);
        try {
            const selectedList = Array.from(selectedTitles);
            const res = await fetch("/api/production/ideas/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    titles: selectedList,
                    description: `テーマ: ${theme}\nトーン: ${tone}`,
                    tags: packageData?.tags || [],
                    status: "backlog",
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "登録に失敗しました");
            }

            const data = await res.json();
            toast.success(`${data.count ?? selectedList.length}件のアイデアを登録しました`);
            setSelectedTitles(new Set());
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "登録に失敗しました");
        } finally {
            setIsRegisteringTitles(false);
        }
    };

    const handleGeneratePackage = async () => {
        if (!theme.trim() || !selectedTitle.trim() || isGeneratingPackage) return;
        setIsGeneratingPackage(true);
        setCreatedEpisodeId(null);
        setSavedAssetId(null);
        setCurrentStep(3);

        try {
            const res = await fetch("/api/ai/shorts/package", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    theme,
                    title: selectedTitle,
                    tone,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "AI生成に失敗しました");
            }

            const data = await res.json();
            setPackageData(data);
            setScriptDraft(data.script || "");
            setTone(data.tone || tone);
            setSelectedTitle(data.title || selectedTitle);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "AI生成に失敗しました");
        } finally {
            setIsGeneratingPackage(false);
        }
    };

    const handleScriptChange = (value: string) => {
        setScriptDraft(value);
        setPackageData((prev) => (prev ? { ...prev, script: value } : prev));
    };

    const buildDraftPayload = () => {
        if (!packageData) return null;
        const finalTitle = (selectedTitle || packageData.title || theme || "AIショート").trim();
        const finalTone = (tone || packageData.tone || "").trim();
        const finalScript = scriptDraft || packageData.script || "";
        return {
            title: finalTitle,
            tone: finalTone,
            script: finalScript,
            package: {
                ...packageData,
                title: finalTitle,
                tone: finalTone,
                script: finalScript,
            },
        };
    };

    const persistDraft = async (options?: { episodeId?: string }) => {
        const draft = buildDraftPayload();
        if (!draft) return null;

        const res = await fetch("/api/ai/shorts/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                theme,
                tone: draft.tone,
                title: draft.title,
                package: draft.package,
                assetId: draftAssetId,
                episodeId: options?.episodeId || null,
            }),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "保存に失敗しました");
        }

        const data = await res.json();
        if (data?.assetId) {
            setDraftAssetId(data.assetId);
        }
        return data?.assetId as string | null;
    };

    const handleSaveAsset = async () => {
        if (!packageData || isSavingAsset) return;
        setIsSavingAsset(true);
        try {
            const assetId = await persistDraft();
            if (assetId) {
                setSavedAssetId(assetId);
            }
            toast.success("素材ライブラリに保存しました");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "保存に失敗しました");
        } finally {
            setIsSavingAsset(false);
        }
    };

    const handleCreateEpisode = async () => {
        if (!packageData || isCreatingEpisode) return;
        setIsCreatingEpisode(true);

        try {
            const draft = buildDraftPayload();
            if (!draft) {
                throw new Error("台本が不足しています");
            }
            const finalTitle = draft.title;
            const finalScript = draft.script;
            const ideaRes = await fetch("/api/production/ideas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: finalTitle,
                    description: `テーマ: ${theme}\nトーン: ${draft.tone}`,
                    tags: packageData.tags,
                    status: "selected",
                }),
            });

            if (!ideaRes.ok) {
                const data = await ideaRes.json().catch(() => ({}));
                throw new Error(data.error || "アイデア作成に失敗しました");
            }

            const idea = await ideaRes.json();

            const episodeRes = await fetch("/api/production/episodes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: finalTitle,
                    ideaId: idea.id,
                    variant: "shorts",
                    status: "scripting",
                }),
            });

            if (!episodeRes.ok) {
                const data = await episodeRes.json().catch(() => ({}));
                throw new Error(data.error || "投稿作成に失敗しました");
            }

            const episode = await episodeRes.json();

            const youtubeDescription = [
                packageData.hook,
                "",
                finalScript,
                "",
                packageData.closing,
                "",
                packageData.tags.map((tag) => `#${tag}`).join(" "),
            ].join("\n");

            await fetch(`/api/production/episodes/${episode.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    youtubeTitle: finalTitle,
                    youtubeDescription,
                    youtubeTags: packageData.tags,
                    hookScript: packageData.hook,
                    ttsText: finalScript,
                    thumbnailBrief: packageData.outline?.[0] || null,
                    synopsis: packageData.outline?.[0] || null,
                    scriptContent: {
                        theme,
                        tone: draft.tone,
                        outline: packageData.outline,
                        script: finalScript,
                        assets: packageData.assets,
                        tags: packageData.tags,
                        closing: packageData.closing,
                        quiz: packageData.quiz,
                    },
                }),
            });

            await persistDraft({ episodeId: episode.id });
            setCreatedEpisodeId(episode.id);
            toast.success("投稿を作成しました");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "投稿作成に失敗しました");
        } finally {
            setIsCreatingEpisode(false);
        }
    };

    const handleSendTo = async () => {
        if (!packageData) return;
        try {
            const assetId = await persistDraft();
            if (assetId) {
                router.push(`/studio?draft=${assetId}`);
                return;
            }
            router.push("/studio");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "スタジオへの送信に失敗しました");
        }
    };

    const handleDiscardDraft = () => {
        setPackageData(null);
        setScriptDraft("");
        setCreatedEpisodeId(null);
        setSavedAssetId(null);
        setDraftAssetId(null);
        toast.success("下書きをクリアしました");
    };

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
                <Link
                    href="/create"
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    ワークスペースに戻る
                </Link>
            </div>

            <header className="space-y-2">
                <h1 className="text-2xl font-bold text-white">AIショート作成</h1>
                <p className="text-sm text-gray-400">
                    テーマ入力だけで、企画→台本→素材→投稿までを1画面で完結します。
                </p>
            </header>

            <section className="card p-4">
                <div className="flex flex-wrap gap-3 text-xs">
                    {steps.map((step) => (
                        <button
                            key={step.id}
                            onClick={() => {
                                if (canGoToStep(step.id)) {
                                    setCurrentStep(step.id);
                                }
                            }}
                            className={`flex items-center gap-2 rounded-full px-3 py-1 transition ${currentStep === step.id
                                ? "bg-indigo-500/30 text-indigo-100 scale-[1.03]"
                                : step.done
                                    ? "bg-emerald-500/15 text-emerald-200"
                                    : "bg-gray-900 text-gray-400"
                                }`}
                            disabled={!canGoToStep(step.id)}
                        >
                            {step.done ? (
                                <CheckCircle className="h-3 w-3" />
                            ) : (
                                <span className="h-2 w-2 rounded-full bg-current" />
                            )}
                            {step.label}
                        </button>
                    ))}
                </div>
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
                <div className="card p-5 space-y-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <Sparkles className="h-5 w-5 text-indigo-300" />
                            <h2 className="font-semibold">AIショート作成フロー</h2>
                        </div>
                        <span className="text-xs text-gray-500">Step {currentStep}/{steps.length}</span>
                    </div>

                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-200">ステップ1: テーマ入力</h3>
                            <div className="space-y-3">
                                <input
                                    value={theme}
                                    onChange={(e) => setTheme(e.target.value)}
                                    placeholder="テーマ（例: 脳科学の豆知識）"
                                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder:text-gray-600"
                                />
                                <input
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value)}
                                    placeholder="仮トーン（AI提案を後で修正できます）"
                                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder:text-gray-600"
                                />
                                <button
                                    onClick={handleGenerateTitles}
                                    disabled={isGeneratingTitles || !theme.trim()}
                                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                                >
                                    {isGeneratingTitles ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                    タイトル30件を生成
                                </button>
                                {isGeneratingTitles && (
                                    <p className="text-[11px] text-gray-500">
                                        タイトルを生成中... ({titleProgress}/{TITLE_TARGET_COUNT})
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setCurrentStep(2)}
                                    disabled={titles.length === 0}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-200 hover:border-gray-500 disabled:opacity-50"
                                >
                                    次へ
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-200">ステップ2: タイトル選択</h3>
                                <button
                                    onClick={() => setCurrentStep(1)}
                                    className="text-xs text-gray-400 hover:text-gray-200"
                                >
                                    戻る
                                </button>
                            </div>
                            {titles.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-gray-800 bg-gray-950 p-6 text-center text-sm text-gray-500">
                                    まずステップ1でタイトルを生成してください。
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-500">タイトル候補（クリックで選択）</p>
                                        <button
                                            onClick={handleGenerateTitles}
                                            className="text-xs text-indigo-300 hover:text-indigo-200"
                                        >
                                            再生成
                                        </button>
                                    </div>
                                    {isGeneratingTitles && (
                                        <div className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-[11px] text-gray-400">
                                            タイトルを生成中... ({titleProgress}/{TITLE_TARGET_COUNT})
                                        </div>
                                    )}
                                    <input
                                        value={titleFilter}
                                        onChange={(e) => setTitleFilter(e.target.value)}
                                        placeholder="タイトルを検索"
                                        className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-white placeholder:text-gray-600"
                                    />
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>選択中: {selectedTitles.size}件</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSelectAllTitles}
                                                className="text-xs text-indigo-300 hover:text-indigo-200"
                                            >
                                                全選択
                                            </button>
                                            <button
                                                onClick={handleClearSelectedTitles}
                                                className="text-xs text-gray-400 hover:text-gray-200"
                                            >
                                                解除
                                            </button>
                                        </div>
                                    </div>
                                    <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-gray-800 bg-gray-950 p-2">
                                        {filteredTitles.map((title, index) => (
                                            <button
                                                key={`${title}-${index}`}
                                                onClick={() => setSelectedTitle(title)}
                                                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${selectedTitle === title
                                                    ? "bg-indigo-500/20 text-indigo-200"
                                                    : "bg-gray-900/60 text-gray-200 hover:bg-gray-900"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTitles.has(title)}
                                                        onChange={() => toggleTitleSelection(title)}
                                                        onClick={(event) => event.stopPropagation()}
                                                        className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-indigo-500"
                                                    />
                                                    <span className="flex-1">{title}</span>
                                                    {selectedTitle === title && (
                                                        <span className="text-[10px] text-indigo-200">メイン</span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                        {filteredTitles.length === 0 && (
                                            <div className="px-3 py-4 text-center text-xs text-gray-500">
                                                該当するタイトルがありません
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleRegisterTitles}
                                        disabled={selectedTitles.size === 0 || isRegisteringTitles}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-500/50 px-3 py-2 text-xs text-indigo-200 hover:border-indigo-400 disabled:opacity-50"
                                    >
                                        {isRegisteringTitles ? <Loader2 className="h-3 w-3 animate-spin" /> : "選択したタイトルをアイデアとして登録"}
                                    </button>
                                    <div className="flex justify-end pt-1">
                                        <button
                                            onClick={() => setCurrentStep(3)}
                                            disabled={!selectedTitle.trim()}
                                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                                        >
                                            次へ
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-200">ステップ3: 台本生成</h3>
                                <button
                                    onClick={() => setCurrentStep(2)}
                                    className="text-xs text-gray-400 hover:text-gray-200"
                                >
                                    戻る
                                </button>
                            </div>

                            <div className="grid gap-2">
                                <label className="text-xs text-gray-500">テーマ</label>
                                <input
                                    value={theme}
                                    readOnly
                                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-300"
                                />
                                <label className="text-xs text-gray-500">トーン</label>
                                <input
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value)}
                                    placeholder="トーンを入力"
                                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder:text-gray-600"
                                />
                                <label className="text-xs text-gray-500">メインタイトル</label>
                                <input
                                    value={selectedTitle}
                                    onChange={(e) => setSelectedTitle(e.target.value)}
                                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder:text-gray-600"
                                />
                            </div>

                            <button
                                onClick={handleGeneratePackage}
                                disabled={!selectedTitle.trim() || !theme.trim() || isGeneratingPackage}
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-50"
                            >
                                {isGeneratingPackage ? <Loader2 className="h-4 w-4 animate-spin" /> : "台本・構成を生成"}
                            </button>

                            <div className="space-y-2">
                                <label className="text-xs text-gray-500">台本プレビュー（編集可能）</label>
                                <textarea
                                    value={scriptDraft}
                                    onChange={(e) => handleScriptChange(e.target.value)}
                                    rows={8}
                                    placeholder="台本生成後に編集できます"
                                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600"
                                    disabled={!packageData}
                                />
                                <p className="text-[11px] text-gray-500">
                                    編集内容は投稿作成・素材保存に反映されます。
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="card p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <CheckCircle className="h-5 w-5 text-emerald-300" />
                            <h2 className="font-semibold">AI出力プレビュー</h2>
                        </div>
                        {currentStep === 3 && (
                            <button
                                onClick={handleGeneratePackage}
                                disabled={!selectedTitle.trim() || !theme.trim() || isGeneratingPackage}
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-50"
                            >
                                {isGeneratingPackage ? <Loader2 className="h-4 w-4 animate-spin" /> : "台本・構成を生成"}
                            </button>
                        )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-400">
                            <p className="text-[11px] text-gray-500">テーマ</p>
                            <p className="mt-1 text-sm text-gray-200">{theme.trim() || "未入力"}</p>
                        </div>
                        <div className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-400">
                            <p className="text-[11px] text-gray-500">トーン</p>
                            <p className="mt-1 text-sm text-gray-200">{tone.trim() || "未設定"}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">タイトル候補</p>
                            <span className="text-[10px] text-gray-600">{titles.length}件</span>
                        </div>
                        {isGeneratingTitles && titles.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-gray-800 bg-gray-950 p-4 text-center text-xs text-gray-400 space-y-2">
                                <div>タイトルを生成中... ({titleProgress}/{TITLE_TARGET_COUNT})</div>
                                <div className="h-2 w-full rounded-full bg-gray-800">
                                    <div
                                        className="h-full rounded-full bg-indigo-400 transition-all"
                                        style={{ width: `${Math.min(100, (titleProgress / TITLE_TARGET_COUNT) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        ) : titles.length > 0 ? (
                            <div className="space-y-2">
                                <div className={`flex flex-wrap gap-2 ${titleStreamComplete ? "animate-fade-in" : ""}`}>
                                    {titles.slice(0, 6).map((title) => (
                                        <span
                                            key={title}
                                            className="rounded-full bg-gray-900 px-2 py-1 text-[11px] text-gray-300"
                                        >
                                            {title}
                                        </span>
                                    ))}
                                    {titles.length > 6 && (
                                        <span className="rounded-full bg-gray-900 px-2 py-1 text-[11px] text-gray-500">
                                            他{titles.length - 6}件
                                        </span>
                                    )}
                                </div>
                                {isGeneratingTitles && (
                                    <div className="text-[11px] text-gray-500">
                                        タイトルを生成中... ({titleProgress}/{TITLE_TARGET_COUNT})
                                    </div>
                                )}
                            </div>
                        ) : titleStreamError ? (
                            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center text-xs text-red-300">
                                {titleStreamError}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed border-gray-800 bg-gray-950 p-3 text-center text-xs text-gray-500">
                                タイトル生成を待っています
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">選択済みタイトル</p>
                            <span className="text-[10px] text-gray-600">{selectedTitles.size}件</span>
                        </div>
                        {selectedTitles.size > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {selectedTitlesList.slice(0, 6).map((title) => (
                                    <span
                                        key={title}
                                        className="rounded-full bg-indigo-500/20 px-2 py-1 text-[11px] text-indigo-200"
                                    >
                                        {title}
                                    </span>
                                ))}
                                {selectedTitlesList.length > 6 && (
                                    <span className="rounded-full bg-indigo-500/10 px-2 py-1 text-[11px] text-indigo-200">
                                        他{selectedTitlesList.length - 6}件
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed border-gray-800 bg-gray-950 p-3 text-center text-xs text-gray-500">
                                まだ選択されていません
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs text-gray-500">メインタイトル</label>
                        <input
                            value={selectedTitle}
                            onChange={(e) => setSelectedTitle(e.target.value)}
                            placeholder="タイトルを選択してください"
                            className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder:text-gray-600"
                        />
                    </div>

                    {packageData ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-500">フック</p>
                                    <button
                                        onClick={() => copyToClipboard(packageData.hook, "フックをコピーしました")}
                                        className="inline-flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200"
                                    >
                                        <Copy className="h-3 w-3" />
                                        コピー
                                    </button>
                                </div>
                                <div className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-200">
                                    {packageData.hook}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-500">構成</p>
                                    <button
                                        onClick={() => copyToClipboard(packageData.outline.join("\n"), "構成をコピーしました")}
                                        className="inline-flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200"
                                    >
                                        <Copy className="h-3 w-3" />
                                        コピー
                                    </button>
                                </div>
                                <ul className="space-y-2 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-200">
                                    {packageData.outline.map((item, index) => (
                                        <li key={`${item}-${index}`}>・{item}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-500">台本</p>
                                    <button
                                        onClick={() => copyToClipboard(scriptDraft || packageData.script, "台本をコピーしました")}
                                        className="inline-flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200"
                                    >
                                        <Copy className="h-3 w-3" />
                                        コピー
                                    </button>
                                </div>
                                <textarea
                                    value={scriptDraft || packageData.script}
                                    readOnly
                                    rows={6}
                                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-200"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-500">タグ</p>
                                    <button
                                        onClick={() => copyToClipboard(packageData.tags.join(", "), "タグをコピーしました")}
                                        className="inline-flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200"
                                    >
                                        <Copy className="h-3 w-3" />
                                        コピー
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {packageData.tags.map((tag) => (
                                        <span key={tag} className="rounded-full bg-gray-800 px-2 py-1 text-xs text-gray-300">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs text-gray-500">素材アイデア</p>
                                <ul className="space-y-1 text-sm text-gray-200">
                                    {packageData.assets.map((asset) => (
                                        <li key={asset}>・{asset}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs text-gray-500">クロージング</p>
                                <div className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-200">
                                    {packageData.closing}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs text-gray-500">クイズ</p>
                                <div className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-200 space-y-1">
                                    <div>Q. {packageData.quiz.question}</div>
                                    <div>選択肢: {packageData.quiz.choices.join(" / ")}</div>
                                    <div>答え: {packageData.quiz.answer}</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed border-gray-800 bg-gray-950 p-6 text-center text-sm text-gray-500">
                            台本・構成を生成するとここに表示されます。
                        </div>
                    )}

                    <div className="flex flex-wrap gap-3 pt-2">
                        <button
                            onClick={handleCreateEpisode}
                            disabled={!packageData || isCreatingEpisode}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                        >
                            {isCreatingEpisode ? <Loader2 className="h-4 w-4 animate-spin" /> : "投稿として作成"}
                        </button>
                        <button
                            onClick={handleSaveAsset}
                            disabled={!packageData || isSavingAsset}
                            className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 disabled:opacity-50"
                        >
                            {isSavingAsset ? <Loader2 className="h-4 w-4 animate-spin" /> : "素材ライブラリに保存"}
                        </button>
                        <button
                            onClick={handleSendTo}
                            disabled={!packageData}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:border-gray-500 disabled:opacity-50"
                        >
                            スタジオでShortsを開く
                        </button>
                        <button
                            onClick={handleDiscardDraft}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-400 hover:border-gray-500"
                        >
                            下書きを破棄
                        </button>
                    </div>

                    {savedAssetId && (
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                            素材ライブラリに保存しました。
                            <Link href="/assets" className="ml-2 underline">
                                ライブラリを見る →
                            </Link>
                        </div>
                    )}

                    {createdEpisodeId && (
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                            投稿を作成しました。
                            <Link
                                href={`/production/episodes/${createdEpisodeId}`}
                                className="ml-2 text-emerald-100 underline"
                            >
                                詳細を開く →
                            </Link>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
