'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle, XCircle, Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useJobs } from '@/hooks/useJobs';
import { Job, JobStatus, JobType } from '@/lib/jobQueue';

const JOB_TYPE_LABELS: Record<JobType, string> = {
    video_generation: '動画生成',
    slide_rendering: 'スライドレンダリング',
    transcription: '文字起こし',
    export: 'エクスポート',
    ai_improvement: 'AI改善',
};

const STATUS_ICONS: Record<JobStatus, React.ReactNode> = {
    pending: <Clock className="w-4 h-4 text-gray-400" />,
    running: <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />,
    completed: <CheckCircle className="w-4 h-4 text-green-400" />,
    failed: <XCircle className="w-4 h-4 text-red-400" />,
    cancelled: <X className="w-4 h-4 text-gray-500" />,
};

interface Props {
    collapsed?: boolean;
}

export function JobStatusPanel({ collapsed = false }: Props) {
    const { jobs, activeJobs, cancelJob, clearCompleted } = useJobs();
    const [isExpanded, setIsExpanded] = useState(!collapsed);
    const [showAll, setShowAll] = useState(false);

    const displayJobs = showAll ? jobs : jobs.slice(0, 5);
    const hasCompletedJobs = jobs.some(j => j.status === 'completed' || j.status === 'failed' || j.status === 'cancelled');

    if (jobs.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-40 w-80">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 rounded-xl border border-gray-800 shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center justify-between p-3 bg-gray-800/50 cursor-pointer hover:bg-gray-800 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        {activeJobs.length > 0 && (
                            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                        )}
                        <span className="font-medium text-sm">
                            ジョブキュー
                        </span>
                        {activeJobs.length > 0 && (
                            <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded">
                                {activeJobs.length} 実行中
                            </span>
                        )}
                    </div>
                    <button className="text-gray-400 hover:text-white">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                </div>

                {/* Content */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="max-h-80 overflow-y-auto">
                                {displayJobs.map((job) => (
                                    <JobItem key={job.id} job={job} onCancel={cancelJob} />
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between p-2 border-t border-gray-800 text-xs">
                                {jobs.length > 5 && (
                                    <button
                                        onClick={() => setShowAll(!showAll)}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        {showAll ? '折りたたむ' : `他 ${jobs.length - 5} 件を表示`}
                                    </button>
                                )}
                                {hasCompletedJobs && (
                                    <button
                                        onClick={clearCompleted}
                                        className="flex items-center gap-1 text-gray-400 hover:text-white ml-auto"
                                    >
                                        <Trash2 size={12} />
                                        クリア
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

function JobItem({ job, onCancel }: { job: Job; onCancel: (id: string) => void }) {
    const isActive = job.status === 'pending' || job.status === 'running';

    return (
        <div className="p-3 border-b border-gray-800/50 last:border-b-0">
            <div className="flex items-start gap-2">
                {STATUS_ICONS[job.status]}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{job.title}</span>
                        <span className="text-xs text-gray-500">
                            {JOB_TYPE_LABELS[job.type]}
                        </span>
                    </div>
                    {job.description && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{job.description}</p>
                    )}
                    {job.status === 'running' && (
                        <div className="mt-2">
                            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 transition-all duration-300"
                                    style={{ width: `${job.progress}%` }}
                                />
                            </div>
                            <span className="text-xs text-gray-500 mt-1">{job.progress}%</span>
                        </div>
                    )}
                    {job.error && (
                        <p className="text-xs text-red-400 mt-1 truncate">{job.error}</p>
                    )}
                </div>
                {isActive && (
                    <button
                        onClick={() => onCancel(job.id)}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                        title="キャンセル"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}

export default JobStatusPanel;
