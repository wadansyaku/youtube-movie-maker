"use client";

import { useState, useEffect } from "react";
import TagInput from "@/components/common/TagInput";

interface Rules {
    dos: string[];
    donts: string[];
    guidelines: string;
}

interface RulesEditorProps {
    data: string;
    onChange: (newData: string) => void;
}

export default function RulesEditor({ data, onChange }: RulesEditorProps) {
    const [values, setValues] = useState<Rules>({
        dos: [],
        donts: [],
        guidelines: ""
    });

    useEffect(() => {
        try {
            const parsed = JSON.parse(data);
            setValues({
                dos: Array.isArray(parsed.dos) ? parsed.dos : [],
                donts: Array.isArray(parsed.donts) ? parsed.donts : [],
                guidelines: parsed.guidelines || ""
            });
        } catch (e) {
            console.error("Failed to parse rules", e);
        }
    }, [data]);

    const updateValues = (newValues: Partial<Rules>) => {
        const updated = { ...values, ...newValues };
        setValues(updated);
        onChange(JSON.stringify(updated, null, 2));
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass p-6 rounded-xl border border-green-900/30 bg-green-900/5">
                    <h3 className="text-green-400 font-semibold mb-4 flex items-center gap-2">
                        ✓ 推奨事項 (Do&apos;s)
                    </h3>
                    <TagInput
                        tags={values.dos}
                        onChange={(tags) => updateValues({ dos: tags })}
                        placeholder="Add rule..."
                    />
                    <p className="text-xs text-gray-500 mt-2">積極的に取り入れるべき要素</p>
                </div>

                <div className="glass p-6 rounded-xl border border-red-900/30 bg-red-900/5">
                    <h3 className="text-red-400 font-semibold mb-4 flex items-center gap-2">
                        ✕ 禁止事項 (Don&apos;ts)
                    </h3>
                    <TagInput
                        tags={values.donts}
                        onChange={(tags) => updateValues({ donts: tags })}
                        placeholder="Add restriction..."
                    />
                    <p className="text-xs text-gray-500 mt-2">避けるべき要素・表現</p>
                </div>
            </div>

            <div className="glass p-6 rounded-xl border border-white/5">
                <label className="block text-sm font-medium text-gray-400 mb-2">制作ガイドライン (Guidelines)</label>
                <textarea
                    value={values.guidelines}
                    onChange={(e) => updateValues({ guidelines: e.target.value })}
                    rows={8}
                    className="w-full bg-gray-800 border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-sm leading-relaxed"
                    placeholder="その他の詳細なガイドラインや注記..."
                />
            </div>
        </div>
    );
}
