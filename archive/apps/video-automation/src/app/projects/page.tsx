'use client';

import { useState, useEffect } from 'react';
import { Plus, FolderOpen, Play, MoreVertical, Search, Filter } from 'lucide-react';
import Link from 'next/link';

interface Project {
    id: string;
    title: string;
    status: string;
    templateName?: string;
    lastRenderAt?: string;
    createdAt: string;
    updatedAt: string;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewModal, setShowNewModal] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/projects');
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredProjects = projects.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const statusColors: Record<string, string> = {
        draft: 'badge-info',
        active: 'badge-success',
        paused: 'badge-warning',
        archived: 'badge',
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">プロジェクト</h1>
                    <p className="text-[var(--muted)]">
                        動画プロジェクトの管理
                    </p>
                </div>
                <button
                    onClick={() => setShowNewModal(true)}
                    className="btn btn-primary"
                >
                    <Plus className="w-5 h-5" />
                    新規プロジェクト
                </button>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                    <input
                        type="text"
                        placeholder="プロジェクトを検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)]"
                    />
                </div>
                <button className="btn btn-secondary">
                    <Filter className="w-4 h-4" />
                    フィルター
                </button>
            </div>

            {/* Projects Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="text-center py-20">
                    <FolderOpen className="w-16 h-16 mx-auto text-[var(--muted)] mb-4" />
                    <p className="text-[var(--muted)] mb-4">
                        {searchQuery ? '検索結果がありません' : 'プロジェクトがありません'}
                    </p>
                    <button
                        onClick={() => setShowNewModal(true)}
                        className="btn btn-primary"
                    >
                        <Plus className="w-5 h-5" />
                        最初のプロジェクトを作成
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProjects.map((project) => (
                        <Link
                            key={project.id}
                            href={`/projects/${project.id}`}
                            className="card p-6 group cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-lg group-hover:text-[var(--accent)] transition">
                                        {project.title}
                                    </h3>
                                    {project.templateName && (
                                        <p className="text-sm text-[var(--muted)]">
                                            {project.templateName}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => e.preventDefault()}
                                    className="p-2 rounded-lg hover:bg-[var(--background)] opacity-0 group-hover:opacity-100 transition"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className={`badge ${statusColors[project.status] || 'badge'}`}>
                                    {project.status}
                                </span>
                                <span className="text-xs text-[var(--muted)]">
                                    {new Date(project.updatedAt).toLocaleDateString('ja-JP')}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* New Project Modal */}
            {showNewModal && (
                <NewProjectModal
                    onClose={() => setShowNewModal(false)}
                    onCreated={() => {
                        setShowNewModal(false);
                        fetchProjects();
                    }}
                />
            )}
        </div>
    );
}

function NewProjectModal({
    onClose,
    onCreated,
}: {
    onClose: () => void;
    onCreated: () => void;
}) {
    const [title, setTitle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: title.trim() }),
            });

            if (res.ok) {
                onCreated();
            }
        } catch (error) {
            console.error('Failed to create project:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="card p-6 w-full max-w-md animate-fade-in">
                <h2 className="text-xl font-semibold mb-4">新規プロジェクト</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                            プロジェクト名
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="例: Medical Shorts #25"
                            className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)]"
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim() || isSubmitting}
                            className="btn btn-primary disabled:opacity-50"
                        >
                            {isSubmitting ? '作成中...' : '作成'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
