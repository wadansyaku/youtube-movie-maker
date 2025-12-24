'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, Loader2, Play, Pause, Download, Volume2, VolumeX } from 'lucide-react';

interface NarrationGeneratorProps {
    text?: string;
    onGenerated?: (audioUrl: string) => void;
}

interface Voice {
    id: string;
    name: string;
    category: string;
    previewUrl?: string;
}

export default function NarrationGenerator({ text: initialText = '', onGenerated }: NarrationGeneratorProps) {
    const [text, setText] = useState(initialText);
    const [isGenerating, setIsGenerating] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [voices, setVoices] = useState<Voice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<string>('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Fetch available voices
    useEffect(() => {
        const fetchVoices = async () => {
            try {
                const res = await fetch('/api/elevenlabs/voices');
                if (res.ok) {
                    const data = await res.json();
                    setVoices(data.voices || []);
                    if (data.voices?.length > 0) {
                        setSelectedVoice(data.voices[0].id);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch voices:', err);
            }
        };

        fetchVoices();
    }, []);

    useEffect(() => {
        setText(initialText);
    }, [initialText]);

    const handleGenerate = async () => {
        if (!text.trim()) {
            setError('テキストを入力してください');
            return;
        }

        if (!selectedVoice) {
            setError('ボイスを選択してください');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const res = await fetch('/api/elevenlabs/speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    voiceId: selectedVoice,
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Generation failed');
            }

            const data = await res.json();

            // Convert base64 to blob URL
            const audioBlob = new Blob(
                [Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))],
                { type: data.contentType }
            );
            const url = URL.createObjectURL(audioBlob);

            setAudioUrl(url);
            onGenerated?.(url);
        } catch (err) {
            console.error('Narration generation failed:', err);
            setError(err instanceof Error ? err.message : 'Generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    const togglePlayback = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
        }
        setIsMuted(!isMuted);
    };

    const handleDownload = () => {
        if (!audioUrl) return;

        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = `narration_${Date.now()}.mp3`;
        a.click();
    };

    const estimateCost = () => {
        const chars = text.length;
        const usd = (chars / 1000) * 0.30; // Approximate cost
        return { chars, usd: usd.toFixed(3) };
    };

    const cost = estimateCost();

    return (
        <div className="space-y-4">
            {/* Text Input */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    ナレーションテキスト
                </label>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="ナレーションに変換するテキストを入力..."
                    className="w-full h-32 bg-gray-800 border border-gray-700 rounded-xl p-4 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none"
                />
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>{text.length} 文字</span>
                    <span>推定コスト: ${cost.usd}</span>
                </div>
            </div>

            {/* Voice Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    ボイス選択
                </label>
                {voices.length > 0 ? (
                    <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        disabled={isGenerating}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white disabled:opacity-50"
                    >
                        {voices.map((voice) => (
                            <option key={voice.id} value={voice.id}>
                                {voice.name} ({voice.category})
                            </option>
                        ))}
                    </select>
                ) : (
                    <div className="text-sm text-gray-500">
                        ボイスを読み込み中... (ElevenLabs API Keyが必要です)
                    </div>
                )}
            </div>

            {/* Generate Button */}
            <button
                onClick={handleGenerate}
                disabled={isGenerating || !text.trim() || !selectedVoice}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isGenerating ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        生成中...
                    </>
                ) : (
                    <>
                        <Mic size={16} />
                        ナレーション生成
                    </>
                )}
            </button>

            {/* Audio Player */}
            {audioUrl && (
                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl space-y-3">
                    <audio
                        ref={audioRef}
                        src={audioUrl}
                        onEnded={() => setIsPlaying(false)}
                        className="hidden"
                    />

                    <div className="flex items-center gap-3">
                        <button
                            onClick={togglePlayback}
                            className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-colors"
                        >
                            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                        </button>

                        <div className="flex-1">
                            <div className="text-sm font-medium text-white">ナレーション生成完了</div>
                            <div className="text-xs text-gray-400">{text.length} 文字</div>
                        </div>

                        <button
                            onClick={toggleMute}
                            className="p-2 text-gray-400 hover:text-white rounded transition-colors"
                        >
                            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>

                        <button
                            onClick={handleDownload}
                            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                        >
                            <Download size={14} />
                            保存
                        </button>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}
        </div>
    );
}
