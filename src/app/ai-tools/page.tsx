"use client";

import { useEffect, useState } from "react";
import { Video, Mic, Sparkles, FileText, Search, ImageIcon } from "lucide-react";
import RunwayGenerator from "@/components/ai/RunwayGenerator";
import NarrationGenerator from "@/components/ai/NarrationGenerator";
import ScriptGenerator from "@/components/ai/ScriptGenerator";
import SEOGenerator from "@/components/ai/SEOGenerator";
import ThumbnailGenerator from "@/components/ai/ThumbnailGenerator";

type Tool = 'runway' | 'narration' | 'script' | 'seo' | 'thumbnail';

interface ToolConfig {
    id: Tool;
    name: string;
    description: string;
    icon: React.ReactNode;
    gradient: string;
}

interface Series {
    id: string;
    title: string;
    status: string;
}

const tools: ToolConfig[] = [
    {
        id: 'runway',
        name: 'Runway Video',
        description: 'Gen-3 Alpha で映像生成',
        icon: <Video size={24} />,
        gradient: 'from-violet-600 to-fuchsia-600',
    },
    {
        id: 'narration',
        name: 'Narration',
        description: 'ElevenLabs でナレーション生成',
        icon: <Mic size={24} />,
        gradient: 'from-emerald-600 to-teal-600',
    },
    {
        id: 'script',
        name: 'Script Generator',
        description: 'AIでエピソードスクリプト生成',
        icon: <FileText size={24} />,
        gradient: 'from-purple-600 to-indigo-600',
    },
    {
        id: 'seo',
        name: 'SEO Optimizer',
        description: 'YouTube SEO 最適化',
        icon: <Search size={24} />,
        gradient: 'from-blue-600 to-cyan-600',
    },
    {
        id: 'thumbnail',
        name: 'Thumbnail',
        description: 'サムネイル画像生成',
        icon: <ImageIcon size={24} />,
        gradient: 'from-pink-600 to-rose-600',
    },
];

export default function AIToolsPage() {
    const [activeTool, setActiveTool] = useState<Tool>('runway');
    const [prompt, setPrompt] = useState('');
    const [seriesId, setSeriesId] = useState<string | null>(null);
    const [seriesList, setSeriesList] = useState<Series[]>([]);
    const [seriesStatus, setSeriesStatus] = useState<'idle' | 'loading' | 'error'>('idle');
    const [seoTitle, setSeoTitle] = useState('');
    const [seoSynopsis, setSeoSynopsis] = useState('');

    useEffect(() => {
        let isMounted = true;
        const fetchSeries = async () => {
            setSeriesStatus('loading');
            try {
                const res = await fetch('/api/series');
                if (!res.ok) throw new Error('Failed to fetch series');
                const data = await res.json();
                if (isMounted && Array.isArray(data)) {
                    setSeriesList(data);
                    if (data.length > 0) {
                        setSeriesId(data[0].id);
                    }
                    setSeriesStatus('idle');
                }
            } catch (error) {
                console.error('Failed to fetch series', error);
                if (isMounted) setSeriesStatus('error');
            }
        };

        fetchSeries();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
            {/* Header */}
            <div className="border-b border-gray-800 bg-black/50 backdrop-blur-xl sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Sparkles className="text-yellow-400" />
                        AI Tools
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        生成AI機能をワンストップで利用
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Tool Selector */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    {tools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id)}
                            className={`p-4 rounded-xl border transition-all text-left ${activeTool === tool.id
                                ? `bg-gradient-to-br ${tool.gradient} border-transparent shadow-lg`
                                : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                                }`}
                        >
                            <div className={`mb-2 ${activeTool === tool.id ? 'text-white' : 'text-gray-400'}`}>
                                {tool.icon}
                            </div>
                            <div className={`font-medium ${activeTool === tool.id ? 'text-white' : 'text-gray-200'}`}>
                                {tool.name}
                            </div>
                            <div className={`text-xs ${activeTool === tool.id ? 'text-white/80' : 'text-gray-500'}`}>
                                {tool.description}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Tool Content */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    {activeTool === 'runway' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    映像プロンプト
                                </label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="A cinematic shot of a samurai walking through a misty bamboo forest at dawn..."
                                    className="w-full h-32 bg-gray-800 border border-gray-700 rounded-xl p-4 text-sm text-white focus:ring-2 focus:ring-violet-500/50 outline-none resize-none"
                                />
                            </div>
                            <RunwayGenerator
                                prompt={prompt}
                                onComplete={(url) => {
                                    console.log('Video generated:', url);
                                }}
                            />
                        </div>
                    )}

                    {activeTool === 'narration' && (
                        <NarrationGenerator
                            onGenerated={(url) => {
                                console.log('Audio generated:', url);
                            }}
                        />
                    )}

                    {activeTool === 'script' && (
                        <div>
                            <div className="mb-4 p-4 rounded-xl border border-gray-700 bg-gray-800/40">
                                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                                    Series Context
                                </label>
                                <select
                                    value={seriesId || ''}
                                    onChange={(e) => setSeriesId(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                                >
                                    <option value="" disabled>
                                        シリーズを選択...
                                    </option>
                                    {seriesList.map((series) => (
                                        <option key={series.id} value={series.id}>
                                            {series.title}
                                        </option>
                                    ))}
                                </select>
                                {seriesStatus === 'loading' && (
                                    <p className="text-xs text-gray-500 mt-2">シリーズを読み込み中...</p>
                                )}
                                {seriesStatus === 'error' && (
                                    <p className="text-xs text-red-400 mt-2">シリーズの取得に失敗しました</p>
                                )}
                                {seriesStatus === 'idle' && seriesList.length === 0 && (
                                    <p className="text-xs text-gray-500 mt-2">先にシリーズを作成してください</p>
                                )}
                            </div>
                            <p className="text-sm text-gray-400 mb-4">
                                シリーズのコンテキストに基づいてエピソードスクリプトを生成します。
                            </p>
                            {seriesList.length > 0 ? (
                                <ScriptGenerator
                                    seriesId={seriesId || ''}
                                    onScriptGenerated={(script) => {
                                        console.log('Script generated:', script);
                                    }}
                                />
                            ) : (
                                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-gray-400">
                                    シリーズがないためスクリプト生成を開始できません。
                                </div>
                            )}
                        </div>
                    )}

                    {activeTool === 'seo' && (
                        <div>
                            <p className="text-sm text-gray-400 mb-4">
                                エピソードのタイトルと概要からYouTube SEOを最適化します。
                            </p>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        エピソードタイトル
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Episode title..."
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                                        value={seoTitle}
                                        onChange={(e) => setSeoTitle(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        概要
                                    </label>
                                    <textarea
                                        placeholder="Episode synopsis..."
                                        className="w-full h-24 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
                                        value={seoSynopsis}
                                        onChange={(e) => setSeoSynopsis(e.target.value)}
                                    />
                                </div>
                            </div>
                            <SEOGenerator
                                episodeTitle={seoTitle}
                                synopsis={seoSynopsis}
                                onApply={(seo) => {
                                    console.log('SEO applied:', seo);
                                }}
                            />
                        </div>
                    )}

                    {activeTool === 'thumbnail' && (
                        <div>
                            <p className="text-sm text-gray-400 mb-4">
                                Stability AI で目を引くYouTubeサムネイルを生成します。
                            </p>
                            <ThumbnailGenerator
                                onGenerated={(image) => {
                                    console.log('Thumbnail generated');
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* API Status */}
                <div className="mt-8 p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-400 mb-3">API 接続状態</h3>
                    <div className="grid grid-cols-4 gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-gray-400">Gemini AI</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <span className="text-gray-400">Runway</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <span className="text-gray-400">ElevenLabs</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <span className="text-gray-400">Stability</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                        API Keyは <a href="/settings" className="text-indigo-400 hover:underline">設定ページ</a> で管理できます。
                    </p>
                </div>
            </div>
        </div>
    );
}
