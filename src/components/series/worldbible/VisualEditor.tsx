"use client";

import { useState, useEffect } from "react";
import ColorPicker from "@/components/common/ColorPicker";
import TagInput from "@/components/common/TagInput";
import { Info } from "lucide-react";

interface VisualStyle {
    colorPalette: string[];
    lightingStyle: string[];
    cameraStyle: string[];
    artStyle: string[];
}

interface VisualEditorProps {
    data: string; // JSON string
    onChange: (newData: string) => void;
}

export default function VisualEditor({ data, onChange }: VisualEditorProps) {
    const [values, setValues] = useState<VisualStyle>({
        colorPalette: ["#000000", "#FFFFFF"],
        lightingStyle: [],
        cameraStyle: [],
        artStyle: [],
    });

    useEffect(() => {
        try {
            const parsed = JSON.parse(data);
            setValues({
                colorPalette: Array.isArray(parsed.colorPalette) ? parsed.colorPalette : [],
                lightingStyle: Array.isArray(parsed.lightingStyle) ? parsed.lightingStyle :
                    (typeof parsed.lightingStyle === 'string' ? [parsed.lightingStyle] : []),
                cameraStyle: Array.isArray(parsed.cameraStyle) ? parsed.cameraStyle :
                    (typeof parsed.cameraStyle === 'string' ? [parsed.cameraStyle] : []),
                artStyle: Array.isArray(parsed.artStyle) ? parsed.artStyle : [],
            });
        } catch (e) {
            console.error("Failed to parse visual style", e);
        }
    }, [data]);

    const updateValues = (newValues: Partial<VisualStyle>) => {
        const updated = { ...values, ...newValues };
        setValues(updated);
        onChange(JSON.stringify(updated, null, 2));
    };

    const addColor = () => {
        updateValues({ colorPalette: [...values.colorPalette, "#3B82F6"] });
    };

    const updateColor = (index: number, color: string) => {
        const newPalette = [...values.colorPalette];
        newPalette[index] = color;
        updateValues({ colorPalette: newPalette });
    };

    const removeColor = (index: number) => {
        updateValues({ colorPalette: values.colorPalette.filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Color Palette */}
            <div className="glass p-6 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-white">カラーパレット</h3>
                    <div className="tooltip" data-tip="作品の基調となる色">
                        <Info size={14} className="text-gray-500" />
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                    {values.colorPalette.map((color, index) => (
                        <div key={index} className="relative group">
                            <ColorPicker
                                color={color}
                                onChange={(c) => updateColor(index, c)}
                            />
                            {values.colorPalette.length > 1 && (
                                <button
                                    onClick={() => removeColor(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        onClick={addColor}
                        className="w-10 h-10 rounded-lg border border-dashed border-gray-600 flex items-center justify-center text-gray-500 hover:text-white hover:border-gray-400 transition-colors"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Tags Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass p-6 rounded-xl border border-white/5">
                    <TagInput
                        label="ライティングスタイル"
                        placeholder="例: High Contast, Cinematic, Neon, Natural..."
                        tags={values.lightingStyle}
                        onChange={(tags) => updateValues({ lightingStyle: tags })}
                        suggestions={["Cinematic", "Natural", "Studio", "Neon Noir", "High Key", "Low Key", "Rembrandt"]}
                    />
                </div>

                <div className="glass p-6 rounded-xl border border-white/5">
                    <TagInput
                        label="カメラスタイル"
                        placeholder="例: Wide Angle, Handheld, Drone, Macro..."
                        tags={values.cameraStyle}
                        onChange={(tags) => updateValues({ cameraStyle: tags })}
                        suggestions={["Wide Angle", "Telephoto", "Handheld", "Steadicam", "Drone Shot", "Macro", "Dutch Angle"]}
                    />
                </div>

                <div className="glass p-6 rounded-xl border border-white/5 md:col-span-2">
                    <TagInput
                        label="アートスタイル・参照"
                        placeholder="例: Cyberpunk, Wes Anderson style, Anime, Oil Painting..."
                        tags={values.artStyle}
                        onChange={(tags) => updateValues({ artStyle: tags })}
                        suggestions={["Cyberpunk", "Steampunk", "Realistic", "Anime", "Noir", "Wes Anderson", "Ghibli-esque"]}
                    />
                </div>
            </div>
        </div>
    );
}
