'use client';

import { useState, useEffect } from 'react';
import { notifications, Notification } from '@/lib/notifications';

export function useNotifications() {
    const [notificationList, setNotificationList] = useState<Notification[]>([]);

    useEffect(() => {
        // Initial load
        setNotificationList(notifications.getAll());

        // Subscribe to updates
        const unsubscribe = notifications.subscribe(setNotificationList);
        return unsubscribe;
    }, []);

    return {
        notifications: notificationList,
        unreadCount: notificationList.filter(n => !n.read).length,
        markAsRead: (id: string) => notifications.markAsRead(id),
        markAllAsRead: () => notifications.markAllAsRead(),
        deleteNotification: (id: string) => notifications.delete(id),
        clearAll: () => notifications.clearAll(),
    };
}
