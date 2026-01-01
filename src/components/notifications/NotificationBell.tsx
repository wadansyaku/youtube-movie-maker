'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { NOTIFICATION_TYPE_CONFIG, Notification } from '@/lib/notifications';
import Link from 'next/link';

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
    } = useNotifications();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (notification: Notification) => {
        markAsRead(notification.id);
        if (notification.link) {
            setIsOpen(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-80 bg-gray-900 rounded-xl border border-gray-800 shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b border-gray-800">
                            <span className="font-medium text-sm">通知</span>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                                    >
                                        <CheckCheck size={12} />
                                        すべて既読
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-6 text-center text-gray-500 text-sm">
                                    通知はありません
                                </div>
                            ) : (
                                notifications.slice(0, 10).map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onClick={() => handleNotificationClick(notification)}
                                        onDelete={() => deleteNotification(notification.id)}
                                    />
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-2 border-t border-gray-800 text-center">
                                <button
                                    onClick={clearAll}
                                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1 mx-auto"
                                >
                                    <Trash2 size={12} />
                                    すべてクリア
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function NotificationItem({
    notification,
    onClick,
    onDelete,
}: {
    notification: Notification;
    onClick: () => void;
    onDelete: () => void;
}) {
    const config = NOTIFICATION_TYPE_CONFIG[notification.type];
    const timeAgo = getTimeAgo(notification.createdAt);

    const content = (
        <div
            onClick={onClick}
            className={`flex items-start gap-3 p-3 hover:bg-gray-800/50 cursor-pointer ${!notification.read ? 'bg-gray-800/30' : ''
                }`}
        >
            <span className={`text-lg ${config.color}`}>{config.icon}</span>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-medium ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                        {notification.title}
                    </span>
                    <span className="text-xs text-gray-500 flex-shrink-0">{timeAgo}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{notification.message}</p>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="text-gray-600 hover:text-gray-400"
            >
                <X size={14} />
            </button>
        </div>
    );

    if (notification.link) {
        return <Link href={notification.link}>{content}</Link>;
    }
    return content;
}

function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    return new Date(date).toLocaleDateString('ja-JP');
}

export default NotificationBell;
