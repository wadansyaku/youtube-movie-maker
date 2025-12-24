"use client";

import { useState, useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
// import { HexColorPicker } from "react-colorful";
// Actually, for a "wow" factor, let's stick to a curated palette + custom hex input for now if no lib is installed.
// The prompt said "Use Vanilla CSS for maximum flexibility" but also "Next.js".
// Let's make a custom popover color picker.

interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    label?: string;
}

const PRESET_COLORS = [
    "#EF4444", "#F97316", "#F59E0B", "#10B981", "#06B6D4",
    "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899", "#111827",
    "#4B5563", "#9CA3AF", "#FFFFFF"
];

export default function ColorPicker({ color, onChange, label }: ColorPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block text-left" ref={popoverRef}>
            {label && <label className="block text-xs text-gray-400 mb-1">{label}</label>}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1.5 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors bg-opacity-50"
            >
                <div
                    className="w-6 h-6 rounded-md shadow-sm border border-white/10"
                    style={{ backgroundColor: color }}
                />
                <span className="text-sm font-mono text-gray-300 min-w-[4rem] text-left">{color}</span>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 w-56 animate-in fade-in zoom-in-95 duration-100">
                    <div className="grid grid-cols-5 gap-2 mb-3">
                        {PRESET_COLORS.map((preset) => (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                    onChange(preset);
                                    setIsOpen(false);
                                }}
                                className="w-8 h-8 rounded-full border border-white/10 hover:scale-110 transition-transform relative group"
                                style={{ backgroundColor: preset }}
                            >
                                {color === preset && (
                                    <span className="absolute inset-0 flex items-center justify-center">
                                        <Check size={14} className={preset === "#FFFFFF" ? "text-black" : "text-white"} />
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">#</span>
                        <input
                            type="text"
                            value={color.replace("#", "")}
                            onChange={(e) => onChange(`#${e.target.value}`)}
                            className="w-full bg-black/40 border border-gray-700 rounded px-2 py-1 pl-5 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
