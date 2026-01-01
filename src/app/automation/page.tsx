'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { generateAssetInstructions, triggerBatchRender } from './actions';
import { Loader2, FileText, Video, Upload } from 'lucide-react';

export default function AutomationPage() {
    const [isGeneratingInstructions, setIsGeneratingInstructions] = useState(false);
    const [isRendering, setIsRendering] = useState(false);
    const [jsonConfig, setJsonConfig] = useState('');

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setJsonConfig(event.target?.result as string);
            };
            reader.readAsText(file);
        }
    };

    const handleGenerateInstructions = async () => {
        if (!jsonConfig) return toast.error('Please load a JSON config first');
        setIsGeneratingInstructions(true);
        try {
            const result = await generateAssetInstructions(jsonConfig);
            // Create a blob and download
            const blob = new Blob([result], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ASSET_INSTRUCTIONS.md';
            a.click();
            toast.success('Instructions generated!');
        } catch (error) {
            toast.error('Failed to generate instructions');
        } finally {
            setIsGeneratingInstructions(false);
        }
    };

    const handleBatchRender = async () => {
        if (!jsonConfig) return toast.error('Please load a JSON config first');
        setIsRendering(true);
        try {
            // Ideally we upload the file, but for now we pass the content
            const result = await triggerBatchRender(jsonConfig);
            if (result.success) {
                toast.success('Batch render started/completed!');
            } else {
                toast.error('Render failed: ' + result.error);
            }
        } catch (error) {
            toast.error('Batch render error');
        } finally {
            setIsRendering(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-8">
                Automation Studio
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Input Section */}
                <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Upload size={20} /> Input Configuration
                    </h2>
                    <div className="mb-4">
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition"
                        />
                    </div>
                    <textarea
                        value={jsonConfig}
                        onChange={(e) => setJsonConfig(e.target.value)}
                        className="w-full h-64 bg-gray-950 border border-gray-800 rounded p-4 font-mono text-xs"
                        placeholder="Paste JSON config here or upload file..."
                    />
                </section>

                {/* Actions Section */}
                <section className="space-y-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-emerald-400">
                            <FileText size={20} /> Asset Automation
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Generate usage prompts for Suno, Midjourney, and TTS based on the video config.
                        </p>
                        <button
                            onClick={handleGenerateInstructions}
                            disabled={isGeneratingInstructions || !jsonConfig}
                            className="w-full py-3 bg-emerald-600/20 border border-emerald-600/50 hover:bg-emerald-600/30 text-emerald-300 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGeneratingInstructions ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
                            Generate Instructions (Markdown)
                        </button>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-blue-400">
                            <Video size={20} /> Batch Rendering
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Render the video using Remotion on the server.
                        </p>
                        <button
                            onClick={handleBatchRender}
                            disabled={isRendering || !jsonConfig}
                            className="w-full py-3 bg-blue-600/20 border border-blue-600/50 hover:bg-blue-600/30 text-blue-300 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isRendering ? <Loader2 className="animate-spin" size={20} /> : <Video size={20} />}
                            Trigger Render
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
