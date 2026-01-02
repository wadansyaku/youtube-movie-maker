"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PromptBuilder from "@/components/generation/PromptBuilder";
import RunFeed from "@/components/generation/RunFeed";
import { Play, Download, Share2, Info, Loader2 } from "lucide-react";
import Link from 'next/link';

interface GenerationRun {
    id: string;
    prompt: string | null;
    status: string;
    createdAt: string;
    platform: string;
    asset?: {
        id: string;
        fileName: string;
    }
}

interface Series {
    id: string;
    title: string;
    status: string;
}

export default function GeneratePage() {
    const [runs, setRuns] = useState<GenerationRun[]>([]);
    const [activeRun, setActiveRun] = useState<GenerationRun | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Series Context
    const [seriesList, setSeriesList] = useState<Series[]>([]);
    const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);

    const fetchRuns = useCallback(async () => {
        try {
            const res = await fetch("/api/generation-runs?limit=20");
            const data = await res.json();
            if (data.runs) {
                setRuns(data.runs);
                setActiveRun((prev) => {
                    if (!prev) return prev;
                    const updatedActive = data.runs.find((r: GenerationRun) => r.id === prev.id);
                    return updatedActive || prev;
                });
            }
        } catch (e) {
            console.error("Failed to fetch runs", e);
        }
    }, []);

    useEffect(() => {
        fetchRuns();
        // Poll every 5 seconds if there are processing runs
        pollingRef.current = setInterval(() => {
            fetchRuns();
        }, 5000);

        // Fetch Series List
        fetch("/api/series")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setSeriesList(data);
                    if (data.length > 0) setSelectedSeriesId(data[0].id);
                }
            })
            .catch(err => console.error("Failed to fetch series", err));

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [fetchRuns]);

    const handleGenerate = async (data: any) => {
        setIsGenerating(true);
        try {
            const res = await fetch("/api/generation-runs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: data.prompt,
                    platform: data.platform,
                    status: "processing",
                    parameters: { aspectRatio: data.aspectRatio },
                    seriesId: selectedSeriesId,
                })
            });

            if (res.ok) {
                const newRun = await res.json();
                setRuns([newRun, ...runs]);
                setActiveRun(newRun);
            }
        } catch (e) {
            console.error("Failed to generate", e);
            alert("Generation failed");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-black text-white animate-in fade-in duration-500">
            {/* Left Panel: Prompt Builder */}
            <div className="w-[400px] flex-shrink-0 z-10 shadow-2xl bg-[#0f0f14] flex flex-col">
                {/* Series Selector Header */}
                <div className="p-4 border-b border-gray-800 bg-[#16161e]">
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                        Active Series Context
                    </label>
                    <select
                        value={selectedSeriesId || ""}
                        onChange={(e) => setSelectedSeriesId(e.target.value)}
                        className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                        <option value="" disabled>Select Series...</option>
                        {seriesList.map(s => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                    </select>
                </div>

                <PromptBuilder
                    onGenerate={handleGenerate}
                    isGenerating={isGenerating}
                    seriesId={selectedSeriesId}
                />
            </div>

            {/* Center Panel: Preview Stage */}
            <div className="flex-1 flex flex-col relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 to-black">
                {/* Stage Header */}
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none">
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                            {activeRun?.status === "processing" ? "Generating..." : activeRun ? "Preview" : "Creative Studio"}
                        </h1>
                        <p className="text-sm text-gray-400 max-w-xl line-clamp-1 pointer-events-auto font-mono mt-1">
                            {activeRun?.prompt}
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex items-center justify-center p-8">
                    {activeRun ? (
                        <div className="relative w-full max-w-5xl aspect-video bg-[#050505] rounded-xl border border-white/5 shadow-2xl overflow-hidden group">
                            {activeRun.status === "completed" ? (
                                <div className="w-full h-full flex items-center justify-center relative bg-black">
                                    {/* Placeholder for actual video playback */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Play size={48} className="opacity-50" />
                                    </div>

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-6">
                                        <div className="flex gap-2">
                                            <button className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                                                <Play size={16} fill="currentColor" />
                                                Play
                                            </button>
                                        </div>
                                        <div className="flex gap-2">
                                            {activeRun.asset?.id && (
                                                <Link
                                                    href={`/assets?id=${activeRun.asset.id}`}
                                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur text-white transition-colors tooltip"
                                                    data-tip="View Asset"
                                                >
                                                    <Info size={20} />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono text-gray-600 absolute bottom-2 right-2">ID: {activeRun.id.slice(0, 8)}</span>
                                </div>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-gray-900/50">
                                    {/* Cool loading animation */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-16 h-16 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6" />
                                        <p className="text-indigo-300 font-mono text-sm animate-pulse flex items-center gap-2">
                                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                                            Simulating Generation...
                                        </p>
                                        <p className="text-xs text-gray-500 mt-2">Connecting to {activeRun.platform} API</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-gray-600 max-w-md">
                            <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-800">
                                <Info size={32} className="opacity-40" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-400 mb-2">Welcome to the Lab</h3>
                            <p className="text-sm">Select a model, craft your prompt, and start generating. Use the Magic Wand to enhance your ideas.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Run Feed */}
            <RunFeed
                runs={runs}
                activeRunId={activeRun?.id || null}
                onSelectRun={setActiveRun}
            />
        </div>
    );
}
