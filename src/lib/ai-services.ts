/**
 * AI Services Module
 * 
 * Provides AI-powered copilot functions for the CreativeFlow Studio.
 * Uses Google Gemini API for text generation.
 */

import { generateText, generateJSON } from '@/lib/ai';
import { prisma } from '@/lib/db';

// ============================================
// Types
// ============================================

export interface OptimizedPrompt {
    optimizedPrompt: string;
    suggestions: string[];
    worldBibleApplied: boolean;
    platform: string;
}

export interface ScriptSuggestion {
    title: string;
    synopsis: string;
    scenes: {
        name: string;
        description: string;
        estimatedDuration: number;
    }[];
    estimatedTotalDuration: number;
}

export interface ShotBreakdown {
    name: string;
    description: string;
    cameraMovement: string;
    duration: number;
    promptSuggestion: string;
}

export interface SEOSuggestion {
    titles: string[];
    description: string;
    tags: string[];
    thumbnailIdeas: string[];
}

// ============================================
// Prompt Optimizer
// ============================================

export async function optimizePrompt(params: {
    rawPrompt: string;
    platform: 'runway' | 'suno' | 'stability' | 'luma' | 'kling';
    seriesId?: string;
}): Promise<OptimizedPrompt> {
    const { rawPrompt, platform, seriesId } = params;

    // Fetch World Bible if seriesId provided
    let worldBibleContext = '';
    let worldBibleApplied = false;

    if (seriesId) {
        const worldBible = await prisma.worldBible.findUnique({
            where: { seriesId },
        });

        if (worldBible) {
            worldBibleApplied = true;
            const visualStyle = JSON.parse(worldBible.visualStyle || '{}');
            const audioStyle = JSON.parse(worldBible.audioStyle || '{}');
            const rules = JSON.parse(worldBible.rules || '{}');

            worldBibleContext = `
World Bible Context:
- Visual Style: ${JSON.stringify(visualStyle)}
- Audio Style: ${JSON.stringify(audioStyle)}
- Must Include: ${rules.mustInclude?.join(', ') || 'N/A'}
- Must Avoid: ${rules.mustAvoid?.join(', ') || 'N/A'}
- Style Guidelines: ${rules.styleGuidelines?.join(', ') || 'N/A'}
`;
        }
    }

    const platformGuides: Record<string, string> = {
        runway: `
Runway Gen-3 Alpha Best Practices:
- Be specific about camera movement (slow pan, dolly zoom, tracking shot)
- Describe lighting (cinematic, dramatic shadows, soft ambient)
- Include motion keywords (flowing, drifting, walking)
- Keep prompts under 200 words
- End with quality modifiers (4K, high quality, detailed)
`,
        suno: `
Suno Music Generation Best Practices:
- Specify genre clearly (ambient electronic, cinematic orchestral)
- Include mood keywords (mysterious, uplifting, melancholic)
- Mention tempo if important (slow, moderate, fast)
- List key instruments for better control
- Use [Verse], [Chorus] structure for lyrics
`,
        stability: `
Stability AI Image Best Practices:
- Be specific about composition and framing
- Include art style references (photorealistic, anime, oil painting)
- Describe lighting and atmosphere
- Mention aspect ratio requirements
- Add quality modifiers (masterpiece, highly detailed)
`,
        luma: `
Luma AI Video Best Practices:
- Focus on realistic motion descriptions
- Describe camera angles and movements
- Include environmental details
- Mention lighting conditions
- Keep descriptions cinematic
`,
        kling: `
Kling AI Video Best Practices:
- Be specific about subject and action
- Include scene atmosphere
- Describe motion dynamics
- Reference visual style
- End with quality descriptors
`,
    };

    const prompt = `
あなたはAI映像生成のエキスパートです。以下のプロンプトを${platform}用に最適化してください。

元のプロンプト:
"${rawPrompt}"

${worldBibleContext}

${platformGuides[platform] || ''}

以下のJSON形式で返してください:
{
  "optimizedPrompt": "最適化されたプロンプト（${platform}に最適化）",
  "suggestions": ["改善提案1", "改善提案2", "改善提案3"]
}
`;

    try {
        const result = await generateJSON(prompt, {
            optimizedPrompt: '',
            suggestions: [],
        });

        return {
            optimizedPrompt: result.optimizedPrompt || rawPrompt,
            suggestions: result.suggestions || [],
            worldBibleApplied,
            platform,
        };
    } catch (error) {
        console.error('Failed to optimize prompt:', error);
        return {
            optimizedPrompt: rawPrompt,
            suggestions: ['AI最適化に失敗しました。元のプロンプトを使用してください。'],
            worldBibleApplied,
            platform,
        };
    }
}

// ============================================
// Script Generator
// ============================================

export async function generateScript(params: {
    seriesId: string;
    concept: string;
    targetDuration?: number;
}): Promise<ScriptSuggestion> {
    const { seriesId, concept, targetDuration = 180 } = params;

    // Fetch series and World Bible for context
    const series = await prisma.series.findUnique({
        where: { id: seriesId },
        include: { worldBible: true },
    });

    let worldBibleContext = '';
    if (series?.worldBible) {
        const visualStyle = JSON.parse(series.worldBible.visualStyle || '{}');
        const audioStyle = JSON.parse(series.worldBible.audioStyle || '{}');
        const characters = JSON.parse(series.worldBible.characters || '[]');
        const settings = JSON.parse(series.worldBible.settings || '[]');

        worldBibleContext = `
シリーズ: "${series.title}"
${series.description ? `説明: ${series.description}` : ''}

World Bible:
- ビジュアルスタイル: ${JSON.stringify(visualStyle)}
- オーディオスタイル: ${JSON.stringify(audioStyle)}
- キャラクター: ${JSON.stringify(characters)}
- 舞台設定: ${JSON.stringify(settings)}
`;
    }

    const prompt = `
あなたはプロの映像脚本家です。以下のコンセプトに基づき、エピソードのスクリプトを提案してください。

コンセプト:
"${concept}"

${worldBibleContext}

目標尺: ${targetDuration}秒

以下のJSON形式で返してください:
{
  "title": "エピソードタイトル",
  "synopsis": "50-100文字程度の概要",
  "scenes": [
    {
      "name": "シーン名",
      "description": "シーンの詳細説明（撮影指示含む）",
      "estimatedDuration": 秒数
    }
  ],
  "estimatedTotalDuration": 合計秒数
}

注意:
- 各シーンは30-60秒程度が目安
- World Bibleのスタイルを維持
- AI生成に適した具体的な映像描写を含める
`;

    try {
        const result = await generateJSON(prompt, {
            title: '',
            synopsis: '',
            scenes: [],
            estimatedTotalDuration: 0,
        }, 'gemini-1.5-pro');

        return {
            title: result.title || 'Untitled Episode',
            synopsis: result.synopsis || '',
            scenes: result.scenes || [],
            estimatedTotalDuration: result.estimatedTotalDuration || targetDuration,
        };
    } catch (error) {
        console.error('Failed to generate script:', error);
        throw new Error('スクリプト生成に失敗しました');
    }
}

// ============================================
// Shot Description AI
// ============================================

export async function describeShots(params: {
    sceneDescription: string;
    seriesId?: string;
}): Promise<ShotBreakdown[]> {
    const { sceneDescription, seriesId } = params;

    // Fetch World Bible for visual style
    let visualContext = '';
    if (seriesId) {
        const worldBible = await prisma.worldBible.findUnique({
            where: { seriesId },
        });
        if (worldBible) {
            const visualStyle = JSON.parse(worldBible.visualStyle || '{}');
            visualContext = `
ビジュアルスタイル基準:
${JSON.stringify(visualStyle, null, 2)}
`;
        }
    }

    const prompt = `
あなたは映像監督です。以下のシーン説明を具体的なショットに分解してください。

シーン説明:
"${sceneDescription}"

${visualContext}

以下のJSON形式で返してください:
{
  "shots": [
    {
      "name": "ショット名（例: SHOT_001_OPENING）",
      "description": "具体的な映像の説明",
      "cameraMovement": "カメラワーク（pan, tilt, dolly, static, tracking等）",
      "duration": 秒数,
      "promptSuggestion": "AI映像生成用プロンプト案"
    }
  ]
}

注意:
- 各ショットは5-15秒程度
- カメラワークは具体的に
- AI生成を想定した具体的なプロンプトを提案
`;

    try {
        const result = await generateJSON(prompt, { shots: [] }, 'gemini-1.5-pro');
        return result.shots || [];
    } catch (error) {
        console.error('Failed to describe shots:', error);
        throw new Error('ショット分解に失敗しました');
    }
}

// ============================================
// SEO Generator
// ============================================

export async function generateSEO(params: {
    episodeTitle: string;
    synopsis: string;
    targetAudience?: string;
}): Promise<SEOSuggestion> {
    const { episodeTitle, synopsis, targetAudience = '一般視聴者' } = params;

    const prompt = `
あなたはYouTube SEOの専門家です。以下の動画コンテンツに対し、検索最適化されたメタデータを提案してください。

エピソードタイトル: "${episodeTitle}"
概要: "${synopsis}"
ターゲット視聴者: ${targetAudience}

以下のJSON形式で返してください:
{
  "titles": ["タイトル案1（最大60文字）", "タイトル案2", "タイトル案3"],
  "description": "説明文（300-500文字、キーワード含む）",
  "tags": ["タグ1", "タグ2", "タグ3", "..."],
  "thumbnailIdeas": ["サムネイル案1", "サムネイル案2"]
}

注意:
- タイトルは興味を引く表現を使用
- 説明文は最初の100文字が特に重要
- タグは関連キーワードを10-15個
- サムネイルは視覚的に魅力的な案を提案
`;

    try {
        const result = await generateJSON(prompt, {
            titles: [],
            description: '',
            tags: [],
            thumbnailIdeas: [],
        });

        return {
            titles: result.titles || [episodeTitle],
            description: result.description || synopsis,
            tags: result.tags || [],
            thumbnailIdeas: result.thumbnailIdeas || [],
        };
    } catch (error) {
        console.error('Failed to generate SEO:', error);
        throw new Error('SEO生成に失敗しました');
    }
}
