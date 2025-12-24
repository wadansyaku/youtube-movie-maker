"use client";

import { Play, Clock, MoreVertical, Download } from "lucide-react";

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

interface RunFeedProps {
    runs: GenerationRun[];
    activeRunId: string | null;
    onSelectRun: (run: GenerationRun) => void;
}

export default function RunFeed({ runs, activeRunId, onSelectRun }: RunFeedProps) {
    if (runs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center border-l border-gray-800 bg-gray-900/50 w-80">
                <Clock size={32} className="mb-4 opacity-50" />
                <p className="text-sm">No history yet</p>
            </div>
        );
    }

    return (
        <div className="w-80 border-l border-gray-800 bg-gray-900 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-gray-800">
                <h3 className="font-semibold text-white">Recent Generations</h3>
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-2">
                {runs.map((run) => (
                    <button
                        key={run.id}
                        onClick={() => onSelectRun(run)}
                        className={`w-full text-left p-3 rounded-xl border transition-all group ${activeRunId === run.id
                                ? "bg-gray-800 border-indigo-500/50 shadow-md"
                                : "bg-gray-800/30 border-transparent hover:bg-gray-800 hover:border-gray-700"
                            }`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${run.status === "completed" ? "bg-green-500/20 text-green-400" :
                                    run.status === "failed" ? "bg-red-500/20 text-red-400" :
                                        "bg-blue-500/20 text-blue-400"
                                }`}>
                                {run.status}
                            </span>
                            <span className="text-[10px] text-gray-500">
                                {new Date(run.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>

                        <p className="text-xs text-gray-300 line-clamp-2 mb-2 font-medium leading-relaxed">
                            {run.prompt || "No prompt"}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-gray-500">
                            <span>{run.platform}</span>
                            {run.asset && (
                                <span className="flex items-center gap-1 text-indigo-400">
                                    <Play size={10} fill="currentColor" />
                                    Video
                                </span>
                            )}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
