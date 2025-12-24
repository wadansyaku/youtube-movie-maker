'use client';

import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
    return (
        <Sonner
            theme="dark"
            position="bottom-right"
            expand={true}
            richColors
            closeButton
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-[#161620] group-[.toaster]:text-white group-[.toaster]:border-white/10 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl",
                    description: "group-[.toaster]:text-[var(--muted)]",
                    actionButton:
                        "group-[.toaster]:bg-primary-500 group-[.toaster]:text-white group-[.toaster]:rounded-lg",
                    cancelButton:
                        "group-[.toaster]:bg-[#2a2a3a] group-[.toaster]:text-white group-[.toaster]:rounded-lg",
                    success: "group-[.toaster]:border-green-500/20",
                    error: "group-[.toaster]:border-red-500/20",
                    warning: "group-[.toaster]:border-yellow-500/20",
                    info: "group-[.toaster]:border-blue-500/20",
                },
                duration: 4000,
            }}
            {...props}
        />
    );
};

export { Toaster };
