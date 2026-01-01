// Template System for YouTube Video Production

export type TemplateType =
    | 'long_script'      // 長尺動画台本
    | 'shorts_script'    // Shorts台本
    | 'thumbnail'        // サムネイルブリーフ
    | 'description'      // YouTube説明文
    | 'metadata';        // タイトル/タグプリセット

export interface TemplateVariable {
    key: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'textarea';
    options?: string[];  // for select type
    defaultValue?: string | number;
    required?: boolean;
}

export interface Template {
    id: string;
    type: TemplateType;
    name: string;
    description?: string;
    lane?: string;       // null = all lanes
    content: string;     // Template with {{variable}} placeholders
    variables: TemplateVariable[];
    isDefault?: boolean;
}

// Built-in templates
export const BUILT_IN_TEMPLATES: Omit<Template, 'id'>[] = [
    {
        type: 'long_script',
        name: '医学解説 ベーシック',
        description: 'Med/Bio解説動画用の基本構成',
        lane: 'med_bio',
        content: `# {{topic}}\n\n## フック (0-15秒)\n{{hook}}\n\n## 導入 (15-45秒)\n- この動画では{{topic}}について解説します\n- なぜ重要なのか: {{importance}}\n\n## 本編\n### ポイント1: {{point1_title}}\n{{point1_content}}\n\n### ポイント2: {{point2_title}}\n{{point2_content}}\n\n### ポイント3: {{point3_title}}\n{{point3_content}}\n\n## まとめ\n- 今日のポイントをおさらい\n- {{key_takeaway}}\n\n## CTA\n{{cta}}`,
        variables: [
            { key: 'topic', label: 'トピック', type: 'text', required: true },
            { key: 'hook', label: 'フック', type: 'textarea', required: true },
            { key: 'importance', label: 'なぜ重要か', type: 'textarea' },
            { key: 'point1_title', label: 'ポイント1タイトル', type: 'text' },
            { key: 'point1_content', label: 'ポイント1内容', type: 'textarea' },
            { key: 'point2_title', label: 'ポイント2タイトル', type: 'text' },
            { key: 'point2_content', label: 'ポイント2内容', type: 'textarea' },
            { key: 'point3_title', label: 'ポイント3タイトル', type: 'text' },
            { key: 'point3_content', label: 'ポイント3内容', type: 'textarea' },
            { key: 'key_takeaway', label: 'キーポイント', type: 'textarea' },
            { key: 'cta', label: 'CTA', type: 'textarea', defaultValue: 'チャンネル登録お願いします！' },
        ],
        isDefault: true,
    },
    {
        type: 'shorts_script',
        name: 'Shorts: 驚きファクト',
        description: '短い驚きの事実を伝えるフォーマット',
        content: `【驚愕】{{hook_line}}\n\n実は{{fact}}\n\n{{explanation}}\n\n{{call_to_action}}`,
        variables: [
            { key: 'hook_line', label: 'フック一言', type: 'text', required: true },
            { key: 'fact', label: '驚きの事実', type: 'textarea', required: true },
            { key: 'explanation', label: '説明', type: 'textarea' },
            { key: 'call_to_action', label: 'CTA', type: 'text', defaultValue: 'フォローして次も見逃すな！' },
        ],
    },
    {
        type: 'description',
        name: '標準説明文',
        description: 'YouTube説明文の標準テンプレート',
        content: `{{summary}}\n\n⏰ タイムスタンプ\n{{timestamps}}\n\n📚 参考資料\n{{references}}\n\n🔔 チャンネル登録はこちら\n{{channel_link}}\n\n#{{tag1}} #{{tag2}} #{{tag3}}`,
        variables: [
            { key: 'summary', label: '動画の概要', type: 'textarea', required: true },
            { key: 'timestamps', label: 'タイムスタンプ', type: 'textarea' },
            { key: 'references', label: '参考資料', type: 'textarea' },
            { key: 'channel_link', label: 'チャンネルリンク', type: 'text' },
            { key: 'tag1', label: 'タグ1', type: 'text' },
            { key: 'tag2', label: 'タグ2', type: 'text' },
            { key: 'tag3', label: 'タグ3', type: 'text' },
        ],
    },
    {
        type: 'thumbnail',
        name: 'サムネイル: インパクト型',
        description: '視線を引くインパクト重視のサムネイル',
        content: `【構成】\nメイン要素: {{main_element}}\nテキスト: {{text}} (3語以内)\n色使い: {{colors}}\n表情/ポーズ: {{expression}}\n\n【イメージ】\n{{image_description}}`,
        variables: [
            { key: 'main_element', label: 'メイン要素', type: 'text', required: true },
            { key: 'text', label: 'テキスト (3語以内)', type: 'text', required: true },
            { key: 'colors', label: '色使い', type: 'text', defaultValue: '赤/黄/黒' },
            { key: 'expression', label: '表情/ポーズ', type: 'text' },
            { key: 'image_description', label: 'イメージ詳細', type: 'textarea' },
        ],
    },
];

/**
 * Apply template with variable values
 */
export function applyTemplate(template: Template, values: Record<string, string | number>): string {
    let result = template.content;

    for (const variable of template.variables) {
        const value = values[variable.key] ?? variable.defaultValue ?? '';
        const placeholder = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g');
        result = result.replace(placeholder, String(value));
    }

    return result;
}

/**
 * Extract variables from template content
 */
export function extractVariables(content: string): string[] {
    const matches = content.match(/\{\{([^}]+)\}\}/g) || [];
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
}

/**
 * Validate template values
 */
export function validateTemplateValues(
    template: Template,
    values: Record<string, string | number>
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const variable of template.variables) {
        if (variable.required && !values[variable.key]) {
            errors.push(`${variable.label} は必須です`);
        }
    }

    return { valid: errors.length === 0, errors };
}
