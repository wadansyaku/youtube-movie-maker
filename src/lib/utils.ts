import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
}

export function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        draft: '下書き',
        active: '制作中',
        archived: 'アーカイブ',
        in_progress: '制作中',
        review: 'レビュー',
        ready: '公開準備完了',
        published: '公開済み',
    };
    return labels[status] || status;
}

export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        draft: 'status-draft',
        active: 'status-active',
        archived: 'status-draft',
        in_progress: 'status-active',
        review: 'status-review',
        ready: 'status-published',
        published: 'status-published',
    };
    return colors[status] || 'status-draft';
}

export function getAssetTypeIcon(type: string): string {
    const icons: Record<string, string> = {
        video: '🎬',
        audio: '🎵',
        image: '🖼️',
        script: '📝',
        thumbnail: '🎨',
    };
    return icons[type] || '📄';
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
