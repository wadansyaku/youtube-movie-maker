'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'default';
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = '確認',
    cancelText = 'キャンセル',
    variant = 'default',
}: ConfirmDialogProps) {
    const [isPending, startTransition] = useTransition();

    const handleConfirm = () => {
        startTransition(async () => {
            await onConfirm();
            onClose();
        });
    };

    const variantStyles = {
        danger: {
            icon: '⚠️',
            iconBg: 'bg-red-500/10',
            confirmBtn: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
        },
        warning: {
            icon: '⚡',
            iconBg: 'bg-yellow-500/10',
            confirmBtn: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600',
        },
        default: {
            icon: '❓',
            iconBg: 'bg-primary-500/10',
            confirmBtn: 'btn-primary',
        },
    };

    const styles = variantStyles[variant];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
                    >
                        <div className="card p-6 shadow-2xl shadow-black/50">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl ${styles.iconBg}`}>
                                    <span className="text-2xl">{styles.icon}</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold mb-2">{title}</h3>
                                    <p className="text-sm text-[var(--muted)] leading-relaxed">
                                        {description}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6 justify-end">
                                <button
                                    onClick={onClose}
                                    disabled={isPending}
                                    className="btn btn-secondary px-4 py-2"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isPending}
                                    className={`px-4 py-2 rounded-lg font-medium text-white transition-all ${styles.confirmBtn} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isPending ? '処理中...' : confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Hook for easy dialog state management
export function useConfirmDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState<Omit<ConfirmDialogProps, 'isOpen' | 'onClose'> | null>(null);

    const confirm = (options: Omit<ConfirmDialogProps, 'isOpen' | 'onClose'>): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfig({
                ...options,
                onConfirm: async () => {
                    await options.onConfirm();
                    resolve(true);
                },
            });
            setIsOpen(true);
        });
    };

    const close = () => {
        setIsOpen(false);
        setConfig(null);
    };

    const DialogComponent = config ? (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={close}
            {...config}
        />
    ) : null;

    return { confirm, DialogComponent };
}
