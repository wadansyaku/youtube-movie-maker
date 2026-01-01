'use client';

import { useState, useEffect } from 'react';
import { Plus, Layers, MoreVertical, Film } from 'lucide-react';

interface Template {
    id: string;
    name: string;
    format: string;
    description?: string;
    compositionId?: string;
    createdAt: string;
}

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            // For now, use default templates
            setTemplates([
                {
                    id: 'medical-shorts',
                    name: 'Medical Shorts',
                    format: 'shorts',
                    description: 'YouTube Shorts向け医学解説動画',
                    compositionId: 'MedicalShorts',
                    createdAt: new Date().toISOString(),
                },
                {
                    id: 'hello-world',
                    name: 'Hello World',
                    format: 'video',
                    description: 'シンプルなサンプルコンポジション',
                    compositionId: 'HelloWorld',
                    createdAt: new Date().toISOString(),
                },
            ]);
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatLabels: Record<string, string> = {
        shorts: 'Shorts (9:16)',
        video: 'Video (16:9)',
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">テンプレート</h1>
                    <p className="text-[var(--muted)]">
                        Remotionコンポジションのテンプレート管理
                    </p>
                </div>
                <button className="btn btn-primary">
                    <Plus className="w-5 h-5" />
                    新規テンプレート
                </button>
            </div>

            {/* Templates Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((template) => (
                        <div key={template.id} className="card p-6 group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 rounded-lg bg-purple-500/10">
                                    <Film className="w-6 h-6 text-purple-400" />
                                </div>
                                <button className="p-2 rounded-lg hover:bg-[var(--background)] opacity-0 group-hover:opacity-100 transition">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </div>
                            <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
                            {template.description && (
                                <p className="text-sm text-[var(--muted)] mb-4">
                                    {template.description}
                                </p>
                            )}
                            <div className="flex items-center gap-2">
                                <span className="badge badge-info">
                                    {formatLabels[template.format] || template.format}
                                </span>
                                {template.compositionId && (
                                    <span className="badge">
                                        {template.compositionId}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
