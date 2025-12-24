'use client';

import Link from 'next/link';
import { useState } from 'react';
import { updateWorldBible } from '@/app/actions';
import { generateWorldBible } from '@/app/settings/actions';
import VisualEditor from './worldbible/VisualEditor';
import AudioEditor from './worldbible/AudioEditor';
import CharacterEditor from './worldbible/CharacterEditor';
import SettingsEditor from './worldbible/SettingsEditor';
import RulesEditor from './worldbible/RulesEditor';
import { Loader2, Sparkles, Save, Check } from 'lucide-react';

interface WorldBible {
    id: string;
    seriesId: string;
    visualStyle: string;
    audioStyle: string;
    characters: string;
    settings: string;
    rules: string;
}

interface Props {
    seriesId: string;
    seriesTitle: string;
    worldBible: WorldBible;
}

type TabType = 'visual' | 'audio' | 'characters' | 'settings' | 'rules';

export default function WorldBibleEditor({ seriesId, seriesTitle, worldBible }: Props) {
    const [activeTab, setActiveTab] = useState<TabType>('visual');
    const [visualStyle, setVisualStyle] = useState(
        JSON.stringify(JSON.parse(worldBible.visualStyle), null, 2)
    );
    const [audioStyle, setAudioStyle] = useState(
        JSON.stringify(JSON.parse(worldBible.audioStyle), null, 2)
    );
    const [characters, setCharacters] = useState(
        JSON.stringify(JSON.parse(worldBible.characters), null, 2)
    );
    const [settings, setSettings] = useState(
        JSON.stringify(JSON.parse(worldBible.settings), null, 2)
    );
    const [rules, setRules] = useState(
        JSON.stringify(JSON.parse(worldBible.rules), null, 2)
    );
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const tabs: { key: TabType; label: string; icon: string }[] = [
        { key: 'visual', label: 'ビジュアル', icon: '🎨' },
        { key: 'audio', label: 'オーディオ', icon: '🎵' },
        { key: 'characters', label: 'キャラクター', icon: '👤' },
        { key: 'settings', label: '舞台設定', icon: '🏙️' },
        { key: 'rules', label: 'ルール', icon: '📋' },
    ];

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.set('visualStyle', visualStyle);
            formData.set('audioStyle', audioStyle);
            formData.set('characters', characters);
            formData.set('settings', settings);
            formData.set('rules', rules);
            await updateWorldBible(seriesId, formData);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleAiAssist = async () => {
        const concept = prompt('シリーズのコンセプトやテーマを入力してください（例: Cyberpunk 2077, Wes Anderson style）:');
        if (!concept) return;

        setIsGenerating(true);
        try {
            const suggestion = await generateWorldBible(concept);

            // Update states with suggested values (check if exists first)
            if (suggestion.visualStyle) setVisualStyle(JSON.stringify(suggestion.visualStyle, null, 2));
            if (suggestion.audioStyle) setAudioStyle(JSON.stringify(suggestion.audioStyle, null, 2));
            // Characters and settings are arrays, ensure they are stringified arrays
            if (suggestion.characters) setCharacters(JSON.stringify(suggestion.characters, null, 2));
            if (suggestion.settings) setSettings(JSON.stringify(suggestion.settings, null, 2));
            if (suggestion.rules) setRules(JSON.stringify(suggestion.rules, null, 2));

            setActiveTab('visual');
            alert('AI提案を適用しました。内容を確認し、問題なければ保存してください。');
        } catch (e) {
            alert('AI生成に失敗しました: ' + e);
        } finally {
            setIsGenerating(false);
        }
    };

    const getCurrentValue = () => {
        switch (activeTab) {
            case 'visual': return visualStyle;
            case 'audio': return audioStyle;
            case 'characters': return characters;
            case 'settings': return settings;
            case 'rules': return rules;
        }
    };

    const setCurrentValue = (value: string) => {
        switch (activeTab) {
            case 'visual': setVisualStyle(value); break;
            case 'audio': setAudioStyle(value); break;
            case 'characters': setCharacters(value); break;
            case 'settings': setSettings(value); break;
            case 'rules': setRules(value); break;
        }
    };

    return (
        <div className="p-8 animate-fade-in">
            {/* Breadcrumb */}
            <div className="text-sm text-[var(--muted)] mb-4">
                <Link href="/series" className="hover:text-white">シリーズ</Link>
                <span className="mx-2">/</span>
                <Link href={`/series/${seriesId}`} className="hover:text-white">{seriesTitle}</Link>
                <span className="mx-2">/</span>
                <span>World Bible</span>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <span>📚</span> World Bible
                    </h1>
                    <p className="text-[var(--muted)] text-sm mt-1">
                        シリーズ全体の世界観・スタイルを定義します
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleAiAssist}
                        disabled={isGenerating}
                        className="btn btn-secondary flex items-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>生成中...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                <span>AI Assist</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn btn-primary flex items-center gap-2 min-w-[100px] justify-center"
                    >
                        {saving ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : saved ? (
                            <Check size={16} />
                        ) : (
                            <Save size={16} />
                        )}
                        {saving ? '保存中' : saved ? '保存完了' : '保存'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 border-b border-[var(--card-border)]">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab.key
                            ? 'bg-[var(--card-bg)] text-white border-t border-x border-[var(--card-border)]'
                            : 'text-[var(--muted)] hover:text-white'
                            }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Editor Content */}
            <div className="min-h-[500px]">
                {activeTab === 'visual' && (
                    <VisualEditor data={visualStyle} onChange={setVisualStyle} />
                )}
                {activeTab === 'audio' && (
                    <AudioEditor data={audioStyle} onChange={setAudioStyle} />
                )}
                {activeTab === 'characters' && (
                    <CharacterEditor data={characters} onChange={setCharacters} />
                )}
                {activeTab === 'settings' && (
                    <SettingsEditor data={settings} onChange={setSettings} />
                )}
                {activeTab === 'rules' && (
                    <RulesEditor data={rules} onChange={setRules} />
                )}
            </div>

            {/* Help Section */}
            <div className="mt-6 glass rounded-xl p-5">
                <h3 className="font-medium mb-3">📖 World Bible の使い方</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-[var(--muted)]">
                    <div>
                        <strong className="text-white">ビジュアル:</strong> カラーパレット、ライティング、カメラスタイル
                    </div>
                    <div>
                        <strong className="text-white">オーディオ:</strong> ジャンル、テンポ、ムード、使用楽器
                    </div>
                    <div>
                        <strong className="text-white">キャラクター:</strong> 登場人物の外見・性格・声のトーン
                    </div>
                    <div>
                        <strong className="text-white">舞台設定:</strong> 場所、時代、雰囲気の詳細
                    </div>
                    <div className="col-span-2">
                        <strong className="text-white">ルール:</strong> 必須要素、禁止事項、スタイルガイドライン
                    </div>
                </div>
            </div>
        </div>
    );
}
