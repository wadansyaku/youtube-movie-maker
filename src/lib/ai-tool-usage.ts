export type ToolCategory = 'llm' | 'audio' | 'video' | 'editing';

export type ToolId =
    | 'chatgpt_plus'
    | 'gemini_pro'
    | 'google_ai_studio'
    | 'suno_ai'
    | 'runway_unlimited'
    | 'capcut'
    | 'final_cut_pro';

export interface ToolDefinition {
    id: ToolId;
    label: string;
    category: ToolCategory;
}

export interface ToolUsageEntry {
    used: boolean;
    purpose: string;
    output: string;
    notes: string;
}

export interface ToolUsageData {
    version: 1;
    summary: string;
    tools: Record<ToolId, ToolUsageEntry>;
}

export type ToolUsageIssue = 'invalid_json' | 'legacy_converted' | 'unknown_format';

export const TOOL_DEFINITIONS: ToolDefinition[] = [
    { id: 'chatgpt_plus', label: 'ChatGPT Plus', category: 'llm' },
    { id: 'gemini_pro', label: 'Gemini Pro', category: 'llm' },
    { id: 'google_ai_studio', label: 'Google AI Studio', category: 'llm' },
    { id: 'suno_ai', label: 'Suno AI Premium', category: 'audio' },
    { id: 'runway_unlimited', label: 'Runway Unlimited', category: 'video' },
    { id: 'capcut', label: 'CapCut', category: 'editing' },
    { id: 'final_cut_pro', label: 'Final Cut Pro', category: 'editing' },
];

const normalizeEntry = (entry?: Partial<ToolUsageEntry>): ToolUsageEntry => ({
    used: typeof entry?.used === 'boolean' ? entry.used : Boolean(entry?.used),
    purpose: typeof entry?.purpose === 'string' ? entry.purpose : '',
    output: typeof entry?.output === 'string' ? entry.output : '',
    notes: typeof entry?.notes === 'string' ? entry.notes : '',
});

const buildTools = (
    overrides: Partial<Record<ToolId, Partial<ToolUsageEntry>>> = {}
): Record<ToolId, ToolUsageEntry> =>
    TOOL_DEFINITIONS.reduce((acc, tool) => {
        acc[tool.id] = normalizeEntry(overrides[tool.id]);
        return acc;
    }, {} as Record<ToolId, ToolUsageEntry>);

export const DEFAULT_TOOL_USAGE: ToolUsageData = {
    version: 1,
    summary: '',
    tools: buildTools(),
};

export function parseToolUsage(
    raw?: string | null
): { data: ToolUsageData; issue?: ToolUsageIssue } {
    if (!raw || raw.trim().length === 0) {
        return { data: DEFAULT_TOOL_USAGE };
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return { data: DEFAULT_TOOL_USAGE, issue: 'invalid_json' };
    }

    if (!parsed || typeof parsed !== 'object') {
        return { data: DEFAULT_TOOL_USAGE, issue: 'unknown_format' };
    }

    const parsedRecord = parsed as Record<string, unknown>;

    if (parsedRecord.tools && typeof parsedRecord.tools === 'object') {
        const tools = buildTools(parsedRecord.tools as Partial<Record<ToolId, Partial<ToolUsageEntry>>>);
        const summary = typeof parsedRecord.summary === 'string' ? parsedRecord.summary : '';

        return {
            data: {
                version: 1,
                summary,
                tools,
            },
        };
    }

    const legacyTools: Partial<Record<ToolId, Partial<ToolUsageEntry>>> = {};
    let legacyFound = false;

    const runway = parsedRecord.runway as Record<string, unknown> | undefined;
    if (runway && typeof runway === 'object') {
        legacyFound = true;
        const workflows = Array.isArray(runway.workflowsUsed)
            ? runway.workflowsUsed.join(', ')
            : '';
        const manualEdits = typeof runway.manualEdits === 'string' ? runway.manualEdits : '';
        legacyTools.runway_unlimited = {
            used: true,
            purpose: 'Video generation',
            output: workflows ? `workflowsUsed: ${workflows}` : '',
            notes: manualEdits,
        };
    }

    const suno = parsedRecord.suno as Record<string, unknown> | undefined;
    if (suno && typeof suno === 'object') {
        legacyFound = true;
        const outputParts: string[] = [];
        if (typeof suno.tracksGenerated === 'number') {
            outputParts.push(`tracksGenerated: ${suno.tracksGenerated}`);
        }
        if (typeof suno.selectedTrack === 'string' && suno.selectedTrack.trim().length > 0) {
            outputParts.push(`selectedTrack: ${suno.selectedTrack.trim()}`);
        }
        legacyTools.suno_ai = {
            used: true,
            purpose: 'Music generation',
            output: outputParts.join(', '),
            notes: typeof suno.selectionReason === 'string' ? suno.selectionReason : '',
        };
    }

    if (legacyFound) {
        return {
            data: {
                version: 1,
                summary: '',
                tools: buildTools(legacyTools),
            },
            issue: 'legacy_converted',
        };
    }

    return { data: DEFAULT_TOOL_USAGE, issue: 'unknown_format' };
}

export function serializeToolUsage(data: ToolUsageData): string {
    return JSON.stringify(
        {
            version: 1,
            summary: typeof data.summary === 'string' ? data.summary : '',
            tools: buildTools(data.tools),
        },
        null,
        2
    );
}
