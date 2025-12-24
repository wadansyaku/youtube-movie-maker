"use client";

import { useState, useEffect } from "react";
import TagInput from "@/components/common/TagInput";

interface Settings {
    period: string;
    location: string;
    atmosphere: string[];
    details: string;
}

interface SettingsEditorProps {
    data: string;
    onChange: (newData: string) => void;
}

export default function SettingsEditor({ data, onChange }: SettingsEditorProps) {
    const [values, setValues] = useState<Settings>({
        period: "",
        location: "",
        atmosphere: [],
        details: ""
    });

    useEffect(() => {
        try {
            const parsed = JSON.parse(data);
            setValues({
                period: parsed.period || "",
                location: parsed.location || "",
                atmosphere: Array.isArray(parsed.atmosphere) ? parsed.atmosphere : [],
                details: parsed.details || ""
            });
        } catch (e) {
            console.error("Failed to parse settings", e);
        }
    }, [data]);

    const updateValues = (newValues: Partial<Settings>) => {
        const updated = { ...values, ...newValues };
        setValues(updated);
        onChange(JSON.stringify(updated, null, 2));
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass p-6 rounded-xl border border-white/5">
                    <label className="block text-sm font-medium text-gray-400 mb-2">時代設定 (Period)</label>
                    <input
                        type="text"
                        value={values.period}
                        onChange={(e) => updateValues({ period: e.target.value })}
                        className="w-full bg-gray-800 border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="例: Future, 1980s, Ancient Rome..."
                    />
                </div>
                <div className="glass p-6 rounded-xl border border-white/5">
                    <label className="block text-sm font-medium text-gray-400 mb-2">主な舞台 (Location)</label>
                    <input
                        type="text"
                        value={values.location}
                        onChange={(e) => updateValues({ location: e.target.value })}
                        className="w-full bg-gray-800 border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="例: Neo Tokyo, Mars Colony, Abandoned Hotel..."
                    />
                </div>
            </div>

            <div className="glass p-6 rounded-xl border border-white/5">
                <TagInput
                    label="雰囲気・空気感 (Atmosphere)"
                    placeholder="例: Foggy, Dusty, Clean, Sterile, Chaotic..."
                    tags={values.atmosphere}
                    onChange={(tags) => updateValues({ atmosphere: tags })}
                    suggestions={["Dark", "Bright", "Foggy", "Rainy", "Dystopian", "Utopian"]}
                />
            </div>

            <div className="glass p-6 rounded-xl border border-white/5">
                <label className="block text-sm font-medium text-gray-400 mb-2">詳細設定 (Details)</label>
                <textarea
                    value={values.details}
                    onChange={(e) => updateValues({ details: e.target.value })}
                    rows={8}
                    className="w-full bg-gray-800 border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-sm leading-relaxed"
                    placeholder="世界観のルール、技術レベル、社会構造などの詳細な設定..."
                />
            </div>
        </div>
    );
}
