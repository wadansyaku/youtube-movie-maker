import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai";

type ShortsPackage = {
    title?: string;
    tone?: string;
    hook?: string;
    outline?: string[];
    script?: string;
    tags?: string[];
    assets?: string[];
    closing?: string;
    quiz?: {
        question?: string;
        choices?: string[];
        answer?: string;
    };
};

function cleanText(value: unknown) {
    if (typeof value !== "string") return "";
    return value
        .replace(/^[\s"'「」]+|[\s"'「」]+$/g, "")
        .replace(/^\d+\s*[.\-:)]\s*/, "")
        .trim();
}

function cleanList(list: unknown, fallback: string[] = []) {
    if (!Array.isArray(list)) return fallback;
    const items = list.map(cleanText).filter(Boolean);
    return items.length > 0 ? items : fallback;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const theme = typeof body.theme === "string" ? body.theme.trim() : "";
        const title = typeof body.title === "string" ? body.title.trim() : "";
        const toneInput = typeof body.tone === "string" ? body.tone.trim() : "";

        if (!theme) {
            return NextResponse.json(
                { error: "theme is required" },
                { status: 400 }
            );
        }

        const prompt = `You are a Japanese YouTube Shorts script writer.

Theme: "${theme}"
Title: "${title || "テーマに沿った短いタイトル"}"
Tone: "${toneInput || "テンポ良く分かりやすい解説"}"

Task:
- Write a short hook (1-2 lines) that grabs attention.
- Provide a concise outline (3-6 beats).
- Write a full script for a 40-60 second Shorts (around 350-500 Japanese characters).
- Provide 10-15 YouTube tags (no #, short phrases).
- Provide 5-8 asset ideas (visuals/footage/B-roll).
- Provide a closing CTA (1-2 lines).
- Provide a simple quiz: question + 3 choices + answer (choose one of the choices).

Return JSON with:
{
  "title": string,
  "tone": string,
  "hook": string,
  "outline": string[],
  "script": string,
  "tags": string[],
  "assets": string[],
  "closing": string,
  "quiz": { "question": string, "choices": string[], "answer": string }
}`;

        const data = await generateJSON(prompt, {
            title: "string",
            tone: "string",
            hook: "string",
            outline: ["string"],
            script: "string",
            tags: ["string"],
            assets: ["string"],
            closing: "string",
            quiz: {
                question: "string",
                choices: ["string"],
                answer: "string",
            },
        }) as ShortsPackage;

        const outline = cleanList(data?.outline, [
            `${theme}のポイント1`,
            `${theme}のポイント2`,
            `${theme}のポイント3`,
        ]);

        const tags = cleanList(data?.tags, [theme]).slice(0, 15);
        const assets = cleanList(data?.assets, [
            `${theme}のイメージ`,
            "テキスト強調用の背景",
            "関連するB-roll",
        ]).slice(0, 8);
        const quizChoices = cleanList(data?.quiz?.choices, ["A", "B", "C"]).slice(0, 3);
        const quizAnswer = quizChoices.includes(cleanText(data?.quiz?.answer))
            ? cleanText(data?.quiz?.answer)
            : quizChoices[0];

        return NextResponse.json({
            title: cleanText(data?.title) || title || `${theme}ショート`,
            tone: cleanText(data?.tone) || toneInput || "テンポ良く分かりやすい解説",
            hook: cleanText(data?.hook) || `${theme}で驚くべき事実、知っていますか？`,
            outline,
            script: cleanText(data?.script) || outline.join("。"),
            tags,
            assets,
            closing: cleanText(data?.closing) || "フォローして続きもチェック！",
            quiz: {
                question: cleanText(data?.quiz?.question) || `${theme}に関するクイズです。`,
                choices: quizChoices,
                answer: quizAnswer,
            },
        });
    } catch (error) {
        console.error("Failed to generate shorts package:", error);
        const message = error instanceof Error ? error.message : "Failed to generate shorts package";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
