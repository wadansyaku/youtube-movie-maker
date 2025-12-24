"use client";

import { useState, useEffect } from "react";
import { Plus, User, Trash2, Edit2, X, Save } from "lucide-react";
import TagInput from "@/components/common/TagInput";

interface Character {
    id: string;
    name: string;
    role: string; // Protagonist, Antagonist, etc.
    description: string;
    visualTraits: string[];
    voiceTraits: string[];
}

interface CharacterEditorProps {
    data: string;
    onChange: (newData: string) => void;
}

export default function CharacterEditor({ data, onChange }: CharacterEditorProps) {
    const [characters, setCharacters] = useState<Character[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);

    // Form State
    const [formState, setFormState] = useState<Character>({
        id: "",
        name: "",
        role: "",
        description: "",
        visualTraits: [],
        voiceTraits: [],
    });

    useEffect(() => {
        try {
            const parsed = JSON.parse(data);
            setCharacters(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
            console.error("Failed to parse characters", e);
        }
    }, [data]);

    const updateCharacters = (newCharacters: Character[]) => {
        setCharacters(newCharacters);
        onChange(JSON.stringify(newCharacters, null, 2));
    };

    const handleAdd = () => {
        setEditingCharacter(null);
        setFormState({
            id: crypto.randomUUID(),
            name: "",
            role: "Main Character",
            description: "",
            visualTraits: [],
            voiceTraits: [],
        });
        setIsModalOpen(true);
    };

    const handleEdit = (char: Character) => {
        setEditingCharacter(char);
        setFormState({ ...char });
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Delete this character?")) {
            updateCharacters(characters.filter(c => c.id !== id));
        }
    };

    const handleSave = () => {
        if (!formState.name) return alert("Name is required");

        let newChars = [...characters];
        if (editingCharacter) {
            newChars = newChars.map(c => c.id === editingCharacter.id ? formState : c);
        } else {
            newChars.push(formState);
        }

        updateCharacters(newChars);
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Character Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Add Card */}
                <button
                    onClick={handleAdd}
                    className="h-full min-h-[200px] border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-gray-900/50 transition-all group"
                >
                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3 group-hover:bg-indigo-500/20 transition-colors">
                        <Plus size={24} />
                    </div>
                    <span className="font-medium">キャラクター追加</span>
                </button>

                {/* Character Cards */}
                {characters.map((char) => (
                    <div key={char.id} className="glass rounded-xl overflow-hidden border border-white/5 hover:border-indigo-500/30 transition-colors group relative">
                        <div className="p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg leading-tight">{char.name}</h3>
                                        <span className="text-xs text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                                            {char.role}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(char)} className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(char.id)} className="p-1.5 hover:bg-red-900/50 rounded text-gray-400 hover:text-red-400">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                                {char.description || "No description provided."}
                            </p>

                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {char.visualTraits.slice(0, 3).map((trait, i) => (
                                    <span key={i} className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                                        {trait}
                                    </span>
                                ))}
                                {char.visualTraits.length > 3 && (
                                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                                        +{char.visualTraits.length - 3}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#1a1a2e] border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-black/20 sticky top-0 backdrop-blur-md z-10">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <User size={20} className="text-indigo-400" />
                                {editingCharacter ? "キャラクター編集" : "キャラクター新規作成"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">名前 *</label>
                                    <input
                                        type="text"
                                        value={formState.name}
                                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                                        className="w-full bg-gray-800 border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="例: John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">役割 (Role)</label>
                                    <input
                                        type="text"
                                        value={formState.role}
                                        onChange={(e) => setFormState({ ...formState, role: e.target.value })}
                                        className="w-full bg-gray-800 border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="例: 主人公"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">説明・背景</label>
                                <textarea
                                    value={formState.description}
                                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                                    rows={4}
                                    className="w-full bg-gray-800 border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="キャラクターの性格、経歴、物語での役割など..."
                                />
                            </div>

                            <div>
                                <TagInput
                                    label="外見的特徴 (Visual Traits)"
                                    placeholder="例: Tall, Blue Eyes, Cybernetic Arm..."
                                    tags={formState.visualTraits}
                                    onChange={(tags) => setFormState({ ...formState, visualTraits: tags })}
                                />
                            </div>

                            <div>
                                <TagInput
                                    label="声・話し方の特徴 (Voice Traits)"
                                    placeholder="例: Deep voice, British accent, Fast talker..."
                                    tags={formState.voiceTraits}
                                    onChange={(tags) => setFormState({ ...formState, voiceTraits: tags })}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700 bg-black/20">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleSave}
                                className="btn btn-primary flex items-center gap-2"
                            >
                                <Save size={18} />
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
