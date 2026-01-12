import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai";

const TITLE_COUNT = 30;

type IdeaResponse = {
    tone?: string;
    titles?: string[];
};

function cleanText(value: unknown) {
    if (typeof value !== "string") return "";
    return value
        .replace(/^[\s"'「」]+|[\s"'「」]+$/g, "")
        .replace(/^\d+\s*[.\-:)]\s*/, "")
        .trim();
}

function ensureTitleCount(titles: string[], theme: string) {
    const unique: string[] = [];
    const seen = new Set<string>();

    for (const title of titles) {
        const cleaned = cleanText(title);
        if (!cleaned) continue;
        if (seen.has(cleaned)) continue;
        seen.add(cleaned);
        unique.push(cleaned);
    }

    while (unique.length < TITLE_COUNT) {
        unique.push(`${theme}のショートアイデア${unique.length + 1}`);
    }

    return unique.slice(0, TITLE_COUNT);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const theme = typeof body.theme === "string" ? body.theme.trim() : "";

        if (!theme) {
            return NextResponse.json(
                { error: "theme is required" },
                { status: 400 }
            );
        }

        const prompt = `You are a Japanese YouTube Shorts producer.
Theme: "${theme}"

Task:
- Propose 30 unique, punchy Japanese titles for Shorts.
- Keep each title under 40 characters.
- Avoid numbering, quotes, or emojis.
- Titles should be varied but consistent with the theme.
- Also suggest one provisional tone (e.g., テンポ良く分かりやすい解説).

Return JSON with:
{
  "tone": string,
  "titles": string[]
}`;

        const data = await generateJSON(prompt, {
            tone: "string",
            titles: ["string"],
        }) as IdeaResponse;

        const tone = cleanText(data?.tone) || "テンポ良く分かりやすい解説";
        const titles = ensureTitleCount(Array.isArray(data?.titles) ? data.titles : [], theme);

        return NextResponse.json({ tone, titles });
    } catch (error) {
        console.error("Failed to generate ideas:", error);
        const message = error instanceof Error ? error.message : "Failed to generate ideas";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
