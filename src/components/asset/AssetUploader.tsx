'use client';

import { useState, useRef } from 'react';
import { createAsset } from '@/app/assets/actions';

export default function AssetUploader() {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showMetadata, setShowMetadata] = useState(false);
    const [source, setSource] = useState('manual');
    const [generationParams, setGenerationParams] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        await uploadFiles(files);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        await uploadFiles(files);
    };

    const uploadFiles = async (files: File[]) => {
        setUploading(true);
        try {
            for (const file of files) {
                const formData = new FormData();
                formData.set('file', file);
                formData.set('source', source);
                formData.set('generationParams', generationParams || '{}');
                await createAsset(formData);
            }
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
            setGenerationParams('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="space-y-4">
            {/* Metadata Options */}
            <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                    <span>ソース:</span>
                    <select
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        className="input w-auto py-1"
                    >
                        <option value="manual">手動アップロード</option>
                        <option value="runway">Runway</option>
                        <option value="suno">Suno</option>
                        <option value="other">その他AI</option>
                    </select>
                </label>

                {source !== 'manual' && (
                    <button
                        onClick={() => setShowMetadata(!showMetadata)}
                        className="text-sm text-primary-400 hover:underline"
                    >
                        {showMetadata ? '− メタデータを隠す' : '+ 生成パラメータを追加'}
                    </button>
                )}
            </div>

            {/* Generation Params */}
            {showMetadata && source !== 'manual' && (
                <div className="card p-4">
                    <label className="block text-sm font-medium mb-2">
                        生成パラメータ (JSON) - {source === 'runway' ? 'Workflow設定等' : 'プロンプト、スタイル等'}
                    </label>
                    <textarea
                        value={generationParams}
                        onChange={(e) => setGenerationParams(e.target.value)}
                        placeholder={source === 'runway'
                            ? '{"workflow": "gen3-alpha", "prompt": "...", "duration": 5}'
                            : '{"style": "ambient", "prompt": "...", "instrumental": true}'
                        }
                        className="w-full h-24 bg-[#0f0f14] text-xs font-mono p-3 rounded-lg border border-[var(--card-border)] focus:border-primary-500 focus:outline-none resize-none"
                    />
                </div>
            )}

            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragging
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-[var(--card-border)] hover:border-primary-500/50'
                    }
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="video/*,audio/*,image/*,.txt,.md,.json"
                />

                <div className="text-4xl mb-3">
                    {uploading ? '⏳' : isDragging ? '📥' : '📁'}
                </div>

                <p className="font-medium">
                    {uploading
                        ? 'アップロード中...'
                        : isDragging
                            ? 'ドロップしてアップロード'
                            : 'ファイルをドラッグ&ドロップ または クリックして選択'
                    }
                </p>

                <p className="text-sm text-[var(--muted)] mt-2">
                    動画、音楽、画像、テキストファイルに対応
                </p>
            </div>

            {/* AI Metadata Reminder */}
            <div className="glass rounded-lg p-4 text-sm">
                <strong className="text-primary-400">📋 メタデータ記録のお願い</strong>
                <p className="text-[var(--muted)] mt-1">
                    AI生成素材（Runway/Suno）をアップロードする場合は、生成パラメータを記録することで
                    将来の監査やスタイル再現に役立ちます。
                </p>
            </div>
        </div>
    );
}
