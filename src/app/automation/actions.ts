'use server';

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function generateAssetInstructions(jsonContent: string) {
    try {
        const videoConfig = JSON.parse(jsonContent);

        let instructions = `# AI Asset Instructions for: ${videoConfig.title}\n\n`;
        instructions += `Use these prompts to generate assets for your video.\n\n`;

        // 1. Suno AI Prompts
        instructions += `## 🎵 Suno AI (BGM)\n`;
        instructions += `**Context:** Medical education, ${videoConfig.themeLabel}\n`;
        instructions += `**Prompt:**\n`;
        instructions += `> Lo-fi hip hop, study beats, calm, minimal, instrumental, no lyrics, high quality, focus, 80bpm\n\n`;
        instructions += `**Settings:**\n- Instrumental: ON\n- Loopable: ON\n\n`;

        // 2. ChatGPT/Gemini Prompts (Script)
        instructions += `## 📝 Script Refinement Prompt\n`;
        instructions += `**Context:** Refining narration for a ${videoConfig.duration || 15}s YouTube Short.\n`;
        instructions += `**Prompt:**\n`;
        instructions += `> You are a medical connector. Rewrite the script to be more engaging for medical students. Tone: Professional but accessible.\n>\n`;

        if (videoConfig.sections) {
            videoConfig.sections.forEach((section: any, index: number) => {
                const text = section.onScreenText || section.question || '(Visual content)';
                instructions += `> [Section ${index + 1}: ${section.type}] ${text}\n`;
            });
        }
        instructions += `\n`;

        // 3. Image Prompts
        instructions += `## 🎨 Image Generation Prompts\n`;
        if (videoConfig.sections) {
            const imageSections = videoConfig.sections.filter((s: any) => s.image || s.type === 'keypoint');
            if (imageSections.length > 0) {
                imageSections.forEach((section: any) => {
                    const description = section.onScreenText || 'Medical illustration';
                    instructions += `**Prompt:** Medical illustration of ${description}, flat design, clean white background, high resolution, 9:16 aspect ratio\n\n`;
                });
            } else {
                instructions += `(No specific image assets defined)\n`;
            }
        }

        return instructions;

    } catch (error) {
        console.error('Error generating instructions:', error);
        throw new Error('Failed to generate instructions');
    }
}

export async function triggerBatchRender(jsonContent: string) {
    // 1. Save JSON to a temp file
    const tempDir = path.join(process.cwd(), 'public', 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    // Check if we can parse it to get a title or ID
    let filename = `render-${Date.now()}.json`;
    try {
        const parsed = JSON.parse(jsonContent);
        if (parsed.title) {
            filename = `${parsed.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        }
    } catch (e) { }

    const inputPath = path.join(tempDir, filename);
    fs.writeFileSync(inputPath, jsonContent);

    const outputFilename = filename.replace('.json', '.mp4');
    const outputPath = path.join(process.cwd(), 'public', 'output', outputFilename);
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
        console.log(`Starting render for ${inputPath} -> ${outputPath}`);
        // Command assumes 'npx remotion' works and finds the config/root
        // We use the 'MedicalShorts' composition ID we just registered in Root.tsx
        const cmd = `npx remotion render MedicalShorts "${outputPath}" --props="${inputPath}" --log=info --concurrency=1`;

        // Note: In a real production app, this should be a background job. 
        // For a local tool, exec is okay but might timeout on Vercel.
        const { stdout, stderr } = await execAsync(cmd);
        console.log('Render output:', stdout);

        return { success: true, outputPath: `/output/${outputFilename}` };
    } catch (error: any) {
        console.error('Render failed:', error);
        return { success: false, error: error.message || String(error) };
    }
}
