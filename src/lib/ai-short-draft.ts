export type AiShortDraft = {
    theme: string;
    tone: string;
    title: string;
    hook: string;
    outline: string[];
    script: string;
    tags: string[];
    assets: string[];
    closing: string;
    quiz: {
        question: string;
        choices: string[];
        answer: string;
    };
    createdAt?: string;
};

const STORAGE_KEY = "ymm:ai-short-draft";

export function saveAiShortDraft(draft: AiShortDraft) {
    const payload = { ...draft, createdAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadAiShortDraft(): AiShortDraft | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as AiShortDraft;
        if (!parsed || typeof parsed !== "object") return null;
        if (!parsed.title || !parsed.script) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function clearAiShortDraft() {
    localStorage.removeItem(STORAGE_KEY);
}
