"use client";

import { useState, useEffect } from "react";
import { Sparkles, Zap, Maximize2, Wand2, Brain, Loader2 } from "lucide-react";

interface PromptBuilderProps {
    onGenerate: (data: any) => void;
    isGenerating: boolean;
    seriesId: string | null;
}

export default function PromptBuilder({ onGenerate, isGenerating, seriesId }: PromptBuilderProps) {
    const [prompt, setPrompt] = useState("");
    const [negativePrompt, setNegativePrompt] = useState("");
    const [aspectRatio, setAspectRatio] = useState("16:9");
    const [platform, setPlatform] = useState("runway");

    // Structured Prompting
    const [subject, setSubject] = useState("");
    const [action, setAction] = useState("");
    const [environment, setEnvironment] = useState("");
    const [style, setStyle] = useState("");

    // World Bible Context
    const [worldBible, setWorldBible] = useState<any>(null);

    // AI Optimization
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    useEffect(() => {
        if (seriesId) {
            fetch(`/api/series/${seriesId}/world-bible`)
                .then(res => res.json())
                .then(data => {
                    if (!data.error) setWorldBible(data);
                })
                .catch(err => console.error("Failed to fetch World Bible", err));
        } else {
            setWorldBible(null);
        }
    }, [seriesId]);

    const handleMagicEnhance = () => {
        let enhancedStyle = style;
        let enhancedEnv = environment;

        if (worldBible) {
            try {
                const visual = JSON.parse(worldBible.visualStyle || "{}");
                const settings = JSON.parse(worldBible.settings || "[]");

                // Enhance Style
                const bibleStyles = [];
                if (visual.lighting && visual.lighting.length > 0) bibleStyles.push(...visual.lighting);
                if (visual.camera && visual.camera.length > 0) bibleStyles.push(...visual.camera);
                if (visual.artStyle && visual.artStyle.length > 0) bibleStyles.push(...visual.artStyle);

                if (bibleStyles.length > 0) {
                    enhancedStyle = enhancedStyle ? `${enhancedStyle}, ${bibleStyles.join(", ")}` : bibleStyles.join(", ");
                    setStyle(enhancedStyle); // Update input for visibility
                }

                // Enhance Environment (Pick first setting or random?)
                if (!environment && settings.length > 0) {
                    enhancedEnv = settings[0].location || "";
                    setEnvironment(enhancedEnv);
                }
            } catch (e) {
                console.error("Error parsing World Bible", e);
            }
        }

        // Construct visual prompt
        const parts = [];
        if (enhancedStyle) parts.push(`[Style: ${enhancedStyle}]`);
        if (subject) parts.push(subject);
        if (action) parts.push(action);
        if (enhancedEnv) parts.push(`in ${enhancedEnv}`);

        const generatedPrompt = parts.join(" ");
        setPrompt(generatedPrompt + (prompt ? ` ${prompt}` : "")); // Append existing manual prompt if any
    };

    const handleAIOptimize = async () => {
        const currentPrompt = prompt || buildFullPrompt();
        if (!currentPrompt.trim()) {
            alert('プロンプトを入力してください');
            return;
        }

        setIsOptimizing(true);
        setSuggestions([]);

        try {
            const res = await fetch('/api/ai/optimize-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rawPrompt: currentPrompt,
                    platform,
                    seriesId: seriesId || undefined,
                }),
            });

            if (!res.ok) {
                throw new Error('AI optimization failed');
            }

            const data = await res.json();
            setPrompt(data.optimizedPrompt);
            setSuggestions(data.suggestions || []);
        } catch (error) {
            console.error('AI Optimize failed:', error);
            alert('AI最適化に失敗しました。API Keyが設定されているか確認してください。');
        } finally {
            setIsOptimizing(false);
        }
    };

    const buildFullPrompt = () => {
        const parts = [];
        if (style) parts.push(`Style: ${style}`);
        if (subject) parts.push(`Subject: ${subject}`);
        if (action) parts.push(`Action: ${action}`);
        if (environment) parts.push(`Environment: ${environment}`);

        return parts.join(", ") + (prompt ? ` ${prompt}` : "");
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800 p-6 overflow-y-auto w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Zap className="text-yellow-400" />
                Generation Lab
            </h2>

            {/* Platform Selector */}
            <div className="mb-6">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">AI Model</label>
                <div className="grid grid-cols-3 gap-2">
                    {["runway", "luma", "kling"].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPlatform(p)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${platform === p
                                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750 hover:text-white"
                                }`}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Structured Prompting */}
            <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Prompt Builder</label>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleMagicEnhance}
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                            <Wand2 size={12} />
                            Auto-Assemble
                        </button>
                        <button
                            onClick={handleAIOptimize}
                            disabled={isOptimizing}
                            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 disabled:opacity-50"
                        >
                            {isOptimizing ? (
                                <Loader2 size={12} className="animate-spin" />
                            ) : (
                                <Brain size={12} />
                            )}
                            AI Optimize
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Subject (e.g. Cyberpunk Samurai)"
                        className="w-full bg-gray-800 border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder-gray-600"
                    />
                    <input
                        type="text"
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        placeholder="Action (e.g. walking through rain)"
                        className="w-full bg-gray-800 border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder-gray-600"
                    />
                    <input
                        type="text"
                        value={environment}
                        onChange={(e) => setEnvironment(e.target.value)}
                        placeholder="Environment (e.g. Neon city street)"
                        className="w-full bg-gray-800 border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder-gray-600"
                    />
                    <input
                        type="text"
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        placeholder="Style (e.g. 80s Anime)"
                        className="w-full bg-gray-800 border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder-gray-600"
                    />
                </div>
            </div>

            {/* Final Prompt Area */}
            <div className="mb-6 flex-1">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Final Prompt</label>
                <div className="relative h-full min-h-[120px]">
                    <textarea
                        value={prompt || buildFullPrompt()}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full h-full bg-black/40 border border-gray-700 rounded-xl p-4 text-sm text-gray-200 focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none font-mono leading-relaxed"
                        placeholder="Describe your video..."
                    />
                    <button className="absolute bottom-3 right-3 p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors">
                        <Maximize2 size={14} />
                    </button>
                </div>
            </div>

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
                <div className="mb-6 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                        <Brain size={14} className="text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">AI Suggestions</span>
                    </div>
                    <ul className="space-y-2">
                        {suggestions.map((suggestion, index) => (
                            <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                                <span className="text-emerald-500">•</span>
                                {suggestion}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Parameters */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Aspect Ratio</label>
                    <select
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value)}
                        className="w-full bg-gray-800 border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none"
                    >
                        <option value="16:9">16:9</option>
                        <option value="9:16">9:16</option>
                        <option value="1:1">1:1</option>
                        <option value="2.35:1">2.35:1 (Cinema)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Duration</label>
                    <select className="w-full bg-gray-800 border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none">
                        <option>5s</option>
                        <option>10s</option>
                    </select>
                </div>
            </div>

            {/* Generate Button */}
            <button
                onClick={() => onGenerate({ prompt: prompt || buildFullPrompt(), platform, aspectRatio })}
                disabled={isGenerating}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isGenerating ? (
                    <>
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                        Generating...
                    </>
                ) : (
                    <>
                        <Sparkles size={20} />
                        Generate Video
                    </>
                )}
            </button>
        </div>
    );
}
