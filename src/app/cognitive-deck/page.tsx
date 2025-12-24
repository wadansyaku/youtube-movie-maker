"use client";

import { useMemo, useState } from "react";
import {
    buildCognitiveDeckHtml,
    buildCognitiveDeckSlides,
    DeckSlide,
} from "@/lib/cognitive-deck";

const DEFAULT_TOPIC = "Codexなどのバイブコーディングの最新手法";
const DEFAULT_AUDIENCE = "初心者から中級者のバイブコーディングエンジニア";

const buildTitle = (topic: string) =>
    topic.trim() ? `${topic.trim()} | Cognitive Deck` : "Cognitive Deck";

const buildSubtitle = (audience: string) =>
    audience.trim() ? `Audience: ${audience.trim()}` : "";

const formatJson = (slides: DeckSlide[]) => JSON.stringify(slides, null, 2);

const validateSlides = (data: unknown): DeckSlide[] => {
    if (!Array.isArray(data)) {
        throw new Error("slides は配列である必要があります");
    }

    const allowedLayouts = new Set(["center", "grid", "split"]);
    data.forEach((slide, index) => {
        if (typeof slide !== "object" || slide === null) {
            throw new Error(`slides[${index}] が不正です`);
        }
        const record = slide as DeckSlide;
        if (!record.id || typeof record.id !== "string") {
            throw new Error(`slides[${index}].id が必要です`);
        }
        if (typeof record.steps !== "number" || record.steps < 1) {
            throw new Error(`slides[${index}].steps は1以上の数値が必要です`);
        }
        if (!record.note || typeof record.note !== "string") {
            throw new Error(`slides[${index}].note が必要です`);
        }
        if (!record.layout || !allowedLayouts.has(record.layout)) {
            throw new Error(`slides[${index}].layout は center/grid/split のいずれかです`);
        }
        if (!record.content || typeof record.content !== "string") {
            throw new Error(`slides[${index}].content が必要です`);
        }
    });

    return data as DeckSlide[];
};

export default function CognitiveDeckPage() {
    const initialSlides = useMemo(
        () => buildCognitiveDeckSlides(DEFAULT_TOPIC, DEFAULT_AUDIENCE),
        []
    );
    const [topic, setTopic] = useState(DEFAULT_TOPIC);
    const [audience, setAudience] = useState(DEFAULT_AUDIENCE);
    const [slides, setSlides] = useState<DeckSlide[]>(initialSlides);
    const [slidesJson, setSlidesJson] = useState(formatJson(initialSlides));
    const [deckHtml, setDeckHtml] = useState(
        buildCognitiveDeckHtml(initialSlides, {
            title: buildTitle(DEFAULT_TOPIC),
            subtitle: buildSubtitle(DEFAULT_AUDIENCE),
        })
    );
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const totalSteps = useMemo(
        () => slides.reduce((sum, slide) => sum + slide.steps, 0),
        [slides]
    );

    const applySlides = (nextSlides: DeckSlide[], nextTopic: string, nextAudience: string) => {
        setSlides(nextSlides);
        setSlidesJson(formatJson(nextSlides));
        setDeckHtml(
            buildCognitiveDeckHtml(nextSlides, {
                title: buildTitle(nextTopic),
                subtitle: buildSubtitle(nextAudience),
            })
        );
        setSuccess("プレビューを更新しました");
    };

    const handleGenerate = () => {
        setError(null);
        const nextSlides = buildCognitiveDeckSlides(topic, audience);
        applySlides(nextSlides, topic, audience);
    };

    const handleApplyJson = () => {
        setError(null);
        try {
            const parsed = JSON.parse(slidesJson);
            const validated = validateSlides(parsed);
            applySlides(validated, topic, audience);
        } catch (err) {
            setError(err instanceof Error ? err.message : "JSONの解析に失敗しました");
        }
    };

    const handleFormatJson = () => {
        setError(null);
        try {
            const parsed = JSON.parse(slidesJson);
            const validated = validateSlides(parsed);
            setSlidesJson(formatJson(validated));
            setSuccess("JSONを整形しました");
        } catch (err) {
            setError(err instanceof Error ? err.message : "JSONの整形に失敗しました");
        }
    };

    const handleDownload = () => {
        const blob = new Blob([deckHtml], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        const slug = (topic || "cognitive-deck")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        anchor.href = url;
        anchor.download = `${slug || "cognitive-deck"}.html`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        setSuccess("HTMLをダウンロードしました");
    };

    const handleOpenPreview = () => {
        const blob = new Blob([deckHtml], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Cognitive Deck Studio</h1>
                        <p className="text-sm text-slate-400">
                            Progressive Disclosure 用の単一HTMLプレゼンを生成
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleGenerate}
                            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors text-sm font-medium"
                        >
                            テンプレ生成
                        </button>
                        <button
                            onClick={handleApplyJson}
                            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm"
                        >
                            JSONを反映
                        </button>
                        <button
                            onClick={handleDownload}
                            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors text-sm font-medium"
                        >
                            HTMLダウンロード
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6 grid gap-6 xl:grid-cols-[320px_1fr_1.15fr]">
                <section className="glass rounded-2xl p-5 space-y-5">
                    <div>
                        <h2 className="text-xs uppercase tracking-[0.2em] text-slate-400">Inputs</h2>
                        <p className="text-sm text-slate-300 mt-2">
                            テーマと対象者を更新してテンプレを再生成します。
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs text-slate-400">テーマ</label>
                        <input
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="w-full rounded-lg bg-slate-900/60 border border-slate-700/60 px-3 py-2 text-sm text-slate-100"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs text-slate-400">対象者</label>
                        <input
                            value={audience}
                            onChange={(e) => setAudience(e.target.value)}
                            className="w-full rounded-lg bg-slate-900/60 border border-slate-700/60 px-3 py-2 text-sm text-slate-100"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
                        <div className="rounded-lg bg-slate-900/60 border border-slate-700/60 p-3">
                            <div className="text-slate-500">Slides</div>
                            <div className="text-lg text-slate-100">{slides.length}</div>
                        </div>
                        <div className="rounded-lg bg-slate-900/60 border border-slate-700/60 p-3">
                            <div className="text-slate-500">Total Steps</div>
                            <div className="text-lg text-slate-100">{totalSteps}</div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <button
                            onClick={handleOpenPreview}
                            className="w-full px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm"
                        >
                            新しいタブでプレビュー
                        </button>
                        <button
                            onClick={handleFormatJson}
                            className="w-full px-4 py-2 rounded-lg border border-slate-700/60 hover:border-slate-500/80 transition-colors text-sm"
                        >
                            JSONを整形
                        </button>
                    </div>

                    {error && (
                        <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-2 rounded-lg">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded-lg">
                            {success}
                        </div>
                    )}
                </section>

                <section className="glass rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold">Slides JSON</h2>
                        <span className="text-xs text-slate-500">Source of Truth</span>
                    </div>
                    <textarea
                        value={slidesJson}
                        onChange={(e) => setSlidesJson(e.target.value)}
                        className="w-full h-[65vh] rounded-lg bg-slate-900/60 border border-slate-700/60 px-3 py-2 text-xs font-mono text-slate-100"
                    />
                    <p className="text-xs text-slate-500">
                        `content` 内はHTML文字列です。fragment + data-step を守ってください。
                    </p>
                </section>

                <section className="glass rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold">Live Preview</h2>
                        <span className="text-xs text-slate-500">Space / ← / →</span>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-slate-700/60 h-[65vh] bg-slate-950">
                        <iframe
                            title="Cognitive Deck Preview"
                            className="w-full h-full"
                            srcDoc={deckHtml}
                        />
                    </div>
                    <p className="text-xs text-slate-500">
                        生成HTMLは単一ファイル。外部アセットはCDNのみ。
                    </p>
                </section>
            </div>
        </div>
    );
}
