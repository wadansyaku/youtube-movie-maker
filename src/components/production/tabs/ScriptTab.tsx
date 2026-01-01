'use client';

import { Mic, Sparkles, FileText, CheckSquare } from 'lucide-react';
import { ProductionEpisode, ORIGINALITY_CHECKS } from '../types';

interface Props {
    episode: ProductionEpisode;
    hookScript: string;
    setHookScript: (value: string) => void;
    ctaScript: string;
    setCtaScript: (value: string) => void;
    ttsText: string;
    setTtsText: (value: string) => void;
    originalityChecks: Record<string, boolean>;
    setOriginalityChecks: (value: Record<string, boolean>) => void;
}

export function ScriptTab({
    episode,
    hookScript,
    setHookScript,
    ctaScript,
    setCtaScript,
    ttsText,
    setTtsText,
    originalityChecks,
    setOriginalityChecks,
}: Props) {
    return (
        <div className="space-y-6">
            {/* Hook */}
            <Section title="フック (0-15秒)" icon={<Sparkles size={18} />}>
                <textarea
                    value={hookScript}
                    onChange={(e) => setHookScript(e.target.value)}
                    placeholder="結論の先出し、視聴者の興味を引く一言"
                    className="textarea min-h-[100px]"
                />
                <p className="text-xs text-gray-500 mt-2">
                    💡 視聴者が最初の15秒で離脱しないよう、核心をすぐに伝えましょう
                </p>
            </Section>

            {/* TTS Text */}
            <Section title="TTS原稿" icon={<Mic size={18} />}>
                <textarea
                    value={ttsText}
                    onChange={(e) => setTtsText(e.target.value)}
                    placeholder="音声合成用のテキスト"
                    className="textarea min-h-[250px]"
                />
                {episode.ttsDictionary.length > 0 && (
                    <div className="mt-3 p-3 bg-gray-800/50 rounded-lg">
                        <div className="text-xs text-gray-400 mb-2">📖 読み辞書:</div>
                        <div className="flex flex-wrap gap-2">
                            {episode.ttsDictionary.map((d, i) => (
                                <span key={i} className="text-xs bg-gray-700 px-2 py-1 rounded">
                                    {d.term} → {d.reading}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                <div className="flex gap-2 mt-3">
                    <span className="text-xs text-gray-500">
                        文字数: {ttsText.length}
                    </span>
                    <span className="text-xs text-gray-500">
                        推定朗読時間: {Math.ceil(ttsText.length / 5)}秒
                    </span>
                </div>
            </Section>

            {/* CTA */}
            <Section title="CTA (視聴者アクション)" icon={<FileText size={18} />}>
                <textarea
                    value={ctaScript}
                    onChange={(e) => setCtaScript(e.target.value)}
                    placeholder="チャンネル登録、次回予告など"
                    className="textarea min-h-[80px]"
                />
            </Section>

            {/* Originality Checks */}
            <Section title="独自性チェック" icon={<CheckSquare size={18} />}>
                <p className="text-xs text-gray-400 mb-4">
                    YouTube収益化審査対応のため、以下の独自コンテンツ要素を確認してください
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ORIGINALITY_CHECKS.map((check) => (
                        <label
                            key={check.key}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${originalityChecks[check.key]
                                    ? 'bg-green-500/10 border border-green-500/30'
                                    : 'bg-gray-800/30 border border-gray-700/50 hover:bg-gray-800/50'
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={originalityChecks[check.key] || false}
                                onChange={(e) =>
                                    setOriginalityChecks({ ...originalityChecks, [check.key]: e.target.checked })
                                }
                                className="w-4 h-4 rounded border-gray-600 bg-gray-800"
                            />
                            <span className="text-sm">{check.label}</span>
                        </label>
                    ))}
                </div>
            </Section>
        </div>
    );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
            <h3 className="flex items-center gap-2 font-medium mb-4 text-sm text-gray-300">
                {icon}
                {title}
            </h3>
            {children}
        </div>
    );
}
