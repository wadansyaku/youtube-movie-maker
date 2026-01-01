'use client';

import { useState } from 'react';
import { Download, X, FileCode, FileText, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timeline, EXPORT_FORMATS, ExportFormat, exportTimeline } from '@/lib/exportFormats';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    timeline: Timeline;
}

export function ExportDialog({ isOpen, onClose, timeline }: Props) {
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('fcpxml');
    const [preview, setPreview] = useState<string>('');
    const [isExporting, setIsExporting] = useState(false);

    const handlePreview = () => {
        const result = exportTimeline(timeline, selectedFormat);
        setPreview(result.content);
    };

    const handleExport = () => {
        setIsExporting(true);
        try {
            const result = exportTimeline(timeline, selectedFormat);

            // Download file
            const blob = new Blob([result.content], { type: result.mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result.filename;
            a.click();
            URL.revokeObjectURL(url);

            onClose();
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const formatIcons: Record<ExportFormat, React.ReactNode> = {
        fcpxml: <FileCode className="w-5 h-5" />,
        edl: <FileText className="w-5 h-5" />,
        capcut: <ExternalLink className="w-5 h-5" />,
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-gray-900 rounded-xl border border-gray-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-800">
                            <h2 className="text-lg font-semibold">タイムライン書き出し</h2>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                            {/* Format Selection */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    書き出しフォーマット
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    {EXPORT_FORMATS.map((format) => (
                                        <button
                                            key={format.key}
                                            onClick={() => {
                                                setSelectedFormat(format.key);
                                                setPreview('');
                                            }}
                                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${selectedFormat === format.key
                                                    ? 'border-indigo-500 bg-indigo-500/10'
                                                    : 'border-gray-700 hover:border-gray-600'
                                                }`}
                                        >
                                            <span className={selectedFormat === format.key ? 'text-indigo-400' : 'text-gray-500'}>
                                                {formatIcons[format.key]}
                                            </span>
                                            <div>
                                                <div className="text-sm font-medium">{format.label}</div>
                                                <div className="text-xs text-gray-500">{format.description}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Timeline Info */}
                            <div className="bg-gray-800/50 rounded-lg p-3">
                                <div className="text-xs text-gray-400 mb-1">タイムライン情報</div>
                                <div className="text-sm">
                                    <span className="font-medium">{timeline.name}</span>
                                    <span className="text-gray-500 ml-2">
                                        {timeline.clips.length} クリップ /
                                        {Math.round(timeline.duration)}秒 /
                                        {timeline.frameRate}fps
                                    </span>
                                </div>
                            </div>

                            {/* Preview Button */}
                            <button
                                onClick={handlePreview}
                                className="text-sm text-indigo-400 hover:text-indigo-300"
                            >
                                プレビュー表示
                            </button>

                            {/* Preview Content */}
                            {preview && (
                                <div className="bg-gray-800 rounded-lg p-3 max-h-48 overflow-auto">
                                    <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                                        {preview.slice(0, 2000)}
                                        {preview.length > 2000 && '...(truncated)'}
                                    </pre>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-800">
                            <button
                                onClick={onClose}
                                className="btn btn-secondary"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="btn btn-primary flex items-center gap-2"
                            >
                                <Download size={16} />
                                {isExporting ? '書き出し中...' : '書き出し'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default ExportDialog;
