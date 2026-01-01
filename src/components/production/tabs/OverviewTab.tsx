'use client';

import { CheckSquare, ListChecks } from 'lucide-react';
import { ProductionEpisode, EpisodeTask, EpisodeTemplate } from '../types';
import { EpisodeStepGuide } from '../EpisodeStepGuide';

interface Props {
    episode: ProductionEpisode;
    templates: EpisodeTemplate[];
    status: string;
    onStatusChange: (status: string) => void;
}

export function OverviewTab({ episode, templates, status, onStatusChange }: Props) {
    const completedTasks = episode.tasks.filter(t => t.status === 'done').length;
    const totalTasks = episode.tasks.length;

    return (
        <div className="space-y-6">
            {/* Step Guide */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
                <EpisodeStepGuide
                    currentStatus={status}
                    onStatusChange={onStatusChange}
                />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="タスク"
                    value={`${completedTasks}/${totalTasks}`}
                    icon={<CheckSquare size={16} />}
                    color="text-blue-400"
                />
                <StatCard
                    label="参考資料"
                    value={episode.sources.length.toString()}
                    icon={<ListChecks size={16} />}
                    color="text-green-400"
                />
                <StatCard
                    label="生成プロンプト"
                    value={episode.generationPrompts.length.toString()}
                    icon={<ListChecks size={16} />}
                    color="text-purple-400"
                />
                <StatCard
                    label="独自性"
                    value={`${Object.values(episode.originalityChecks).filter(Boolean).length}/4`}
                    icon={<CheckSquare size={16} />}
                    color="text-yellow-400"
                />
            </div>

            {/* Tasks */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
                <h3 className="flex items-center gap-2 font-medium mb-4 text-sm text-gray-300">
                    <CheckSquare size={18} />
                    タスク進捗 ({completedTasks}/{totalTasks})
                </h3>
                {episode.tasks.length > 0 ? (
                    <div className="space-y-2">
                        {episode.tasks.map((task) => (
                            <TaskItem key={task.id} task={task} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm text-center py-4">
                        タスクがありません
                    </p>
                )}
            </div>

            {/* Purpose Statement */}
            {episode.purposeStatement && (
                <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
                    <h3 className="font-medium mb-2 text-sm text-gray-300">🎯 目的</h3>
                    <p className="text-sm text-gray-400">{episode.purposeStatement}</p>
                </div>
            )}

            {/* Templates */}
            {templates.length > 0 && (
                <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
                    <h3 className="font-medium mb-4 text-sm text-gray-300">📋 利用可能なテンプレート</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {templates.map((template) => (
                            <button
                                key={template.id}
                                className="text-left p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-sm transition-colors border border-gray-700/50"
                            >
                                {template.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Variants */}
            {(episode.parentEpisode || (episode.childVariants && episode.childVariants.length > 0)) && (
                <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
                    <h3 className="font-medium mb-4 text-sm text-gray-300">🔗 関連バリエーション</h3>
                    {episode.parentEpisode && (
                        <div className="mb-3">
                            <span className="text-xs text-gray-500">親エピソード:</span>
                            <p className="text-sm">{episode.parentEpisode.title} ({episode.parentEpisode.variant})</p>
                        </div>
                    )}
                    {episode.childVariants && episode.childVariants.length > 0 && (
                        <div>
                            <span className="text-xs text-gray-500">派生バリエーション:</span>
                            <div className="space-y-1 mt-1">
                                {episode.childVariants.map(v => (
                                    <p key={v.id} className="text-sm">
                                        {v.title} ({v.variant}) - {v.status}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function TaskItem({ task }: { task: EpisodeTask }) {
    const statusStyles: Record<string, string> = {
        done: 'border-green-500 bg-green-500/10 text-green-400',
        doing: 'border-yellow-500 bg-yellow-500/10 text-yellow-400',
        blocked: 'border-red-500 bg-red-500/10 text-red-400',
        todo: 'border-gray-600 bg-gray-800/50 text-gray-400',
    };

    return (
        <div className={`p-3 rounded-lg border-l-2 ${statusStyles[task.status] || statusStyles.todo}`}>
            <div className="flex items-center justify-between">
                <span className={`text-sm ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>
                    {task.title}
                </span>
                <span className="text-xs capitalize">{task.status}</span>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
    return (
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-1">
                <span className={color}>{icon}</span>
                <span className="text-xs text-gray-400">{label}</span>
            </div>
            <div className="text-xl font-bold">{value}</div>
        </div>
    );
}
