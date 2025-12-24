"use client";

import { useState, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";

interface TagInputProps {
    tags: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    label?: string;
    suggestions?: string[];
}

export default function TagInput({ tags, onChange, placeholder = "Add tag...", label, suggestions = [] }: TagInputProps) {
    const [input, setInput] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag(input);
        } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };

    const addTag = (value: string) => {
        const trimmed = value.trim();
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
            setInput("");
            setShowSuggestions(false);
        }
    };

    const removeTag = (index: number) => {
        onChange(tags.filter((_, i) => i !== index));
    };

    const filteredSuggestions = suggestions.filter(
        s => !tags.includes(s) && s.toLowerCase().includes(input.toLowerCase())
    );

    return (
        <div className="w-full">
            {label && <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>}
            <div className="relative">
                <div className="flex flex-wrap gap-2 p-2 bg-gray-800 border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all min-h-[42px]">
                    {tags.map((tag, index) => (
                        <span
                            key={index}
                            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-500/20 text-indigo-300 text-sm rounded-md border border-indigo-500/30 animate-in zoom-in-95 duration-200"
                        >
                            {tag}
                            <button
                                type="button"
                                onClick={() => removeTag(index)}
                                className="hover:text-white transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </span>
                    ))}
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder={tags.length === 0 ? placeholder : ""}
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 min-w-[80px]"
                    />
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && input && filteredSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                        {filteredSuggestions.map((suggestion) => (
                            <button
                                key={suggestion}
                                type="button"
                                onClick={() => addTag(suggestion)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center justify-between group"
                            >
                                {suggestion}
                                <Plus size={14} className="opacity-0 group-hover:opacity-100 text-indigo-400" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
