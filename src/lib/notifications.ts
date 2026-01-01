// Notification System for YouTube Movie Maker

export type NotificationType =
    | 'review_requested'    // レビュー依頼
    | 'review_completed'    // レビュー完了
    | 'comment_added'       // コメント追加
    | 'mention'             // メンション
    | 'export_ready'        // エクスポート完了
    | 'job_completed'       // ジョブ完了
    | 'job_failed'          // ジョブ失敗
    | 'system';             // システム通知

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    createdAt: Date;
    link?: string;           // クリック時の遷移先
    metadata?: Record<string, unknown>;
}

// In-memory notification store (would use DB in production)
let notificationStore: Notification[] = [];
let subscribers: Set<(notifications: Notification[]) => void> = new Set();

function generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function notifySubscribers() {
    subscribers.forEach(fn => fn([...notificationStore]));
}

export const notifications = {
    /**
     * Create a new notification
     */
    create(params: {
        type: NotificationType;
        title: string;
        message: string;
        link?: string;
        metadata?: Record<string, unknown>;
    }): Notification {
        const notification: Notification = {
            id: generateId(),
            type: params.type,
            title: params.title,
            message: params.message,
            read: false,
            createdAt: new Date(),
            link: params.link,
            metadata: params.metadata,
        };
        notificationStore.unshift(notification);
        notifySubscribers();
        return notification;
    },

    /**
     * Mark notification as read
     */
    markAsRead(notificationId: string): void {
        const notification = notificationStore.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            notifySubscribers();
        }
    },

    /**
     * Mark all notifications as read
     */
    markAllAsRead(): void {
        notificationStore.forEach(n => n.read = true);
        notifySubscribers();
    },

    /**
     * Delete a notification
     */
    delete(notificationId: string): void {
        notificationStore = notificationStore.filter(n => n.id !== notificationId);
        notifySubscribers();
    },

    /**
     * Clear all notifications
     */
    clearAll(): void {
        notificationStore = [];
        notifySubscribers();
    },

    /**
     * Get all notifications
     */
    getAll(): Notification[] {
        return [...notificationStore];
    },

    /**
     * Get unread count
     */
    getUnreadCount(): number {
        return notificationStore.filter(n => !n.read).length;
    },

    /**
     * Subscribe to notification updates
     */
    subscribe(callback: (notifications: Notification[]) => void): () => void {
        subscribers.add(callback);
        return () => subscribers.delete(callback);
    },
};

// Notification type configurations
export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, {
    icon: string;
    color: string;
}> = {
    review_requested: { icon: '👁️', color: 'text-yellow-400' },
    review_completed: { icon: '✅', color: 'text-green-400' },
    comment_added: { icon: '💬', color: 'text-blue-400' },
    mention: { icon: '@', color: 'text-purple-400' },
    export_ready: { icon: '📦', color: 'text-indigo-400' },
    job_completed: { icon: '✨', color: 'text-green-400' },
    job_failed: { icon: '❌', color: 'text-red-400' },
    system: { icon: 'ℹ️', color: 'text-gray-400' },
};

export type Notifications = typeof notifications;
