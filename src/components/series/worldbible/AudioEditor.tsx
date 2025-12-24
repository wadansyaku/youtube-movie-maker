"use client";

import { useState, useEffect } from "react";
import TagInput from "@/components/common/TagInput";

interface AudioStyle {
    genre: string[];
    mood: string[];
    tempo: string[];
    instruments: string[];
}

interface AudioEditorProps {
    data: string;
    onChange: (newData: string) => void;
}

export default function AudioEditor({ data, onChange }: AudioEditorProps) {
    const [values, setValues] = useState<AudioStyle>({
        genre: [],
        mood: [],
        tempo: [],
        instruments: [],
    });

    useEffect(() => {
        try {
            const parsed = JSON.parse(data);
            setValues({
                genre: Array.isArray(parsed.genre) ? parsed.genre : (parsed.genre ? [parsed.genre] : []),
                mood: Array.isArray(parsed.mood) ? parsed.mood : (parsed.mood ? [parsed.mood] : []),
                tempo: Array.isArray(parsed.tempo) ? parsed.tempo : (parsed.tempo ? [parsed.tempo] : []),
                instruments: Array.isArray(parsed.instruments) ? parsed.instruments : [],
            });
        } catch (e) {
            console.error("Failed to parse audio style", e);
        }
    }, [data]);

    const updateValues = (newValues: Partial<AudioStyle>) => {
        const updated = { ...values, ...newValues };
        setValues(updated);
        onChange(JSON.stringify(updated, null, 2));
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="glass p-6 rounded-xl border border-white/5">
                <TagInput
                    label="ジャンル (Genre)"
                    placeholder="例: Lo-Fi, Orchestral, EDM, Jazz..."
                    tags={values.genre}
                    onChange={(tags) => updateValues({ genre: tags })}
                    suggestions={["Cinematic", "Ambient", "Rock", "Jazz", "Electronic", "Classical", "Lo-Fi"]}
                />
            </div>

            <div className="glass p-6 rounded-xl border border-white/5">
                <TagInput
                    label="ムード (Mood)"
                    placeholder="例: Melancholic, Uplifting, Tense, Mysterious..."
                    tags={values.mood}
                    onChange={(tags) => updateValues({ mood: tags })}
                    suggestions={["Epic", "Sad", "Happy", "Tense", "Relaxing", "Dark", "Romantic"]}
                />
            </div>

            <div className="glass p-6 rounded-xl border border-white/5">
                <TagInput
                    label="テンポ (Tempo)"
                    placeholder="例: Slow, Fast, 120BPM, Dynamic..."
                    tags={values.tempo}
                    onChange={(tags) => updateValues({ tempo: tags })}
                    suggestions={["Slow", "Medium", "Fast", "Variable", "Adagio", "Allegro"]}
                />
            </div>

            <div className="glass p-6 rounded-xl border border-white/5">
                <TagInput
                    label="主な楽器・サウンド (Instruments)"
                    placeholder="例: Piano, Synth, Strings, Bass..."
                    tags={values.instruments}
                    onChange={(tags) => updateValues({ instruments: tags })}
                    suggestions={["Piano", "Synthesizer", "Violin", "Drums", "Acoustic Guitar", "Electric Guitar"]}
                />
            </div>
        </div>
    );
}
