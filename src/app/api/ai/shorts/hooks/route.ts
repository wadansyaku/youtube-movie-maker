import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai";

type HookResponse = {
    hooks?: string[];
};

const cleanText = (value: unknown) => {
    if (typeof value !== "string") return "";
    return value
        .replace(/^[\s"'「」]+|[\s"'「」]+$/g, "")
        .replace(/^\d+\s*[.\-:)]\s*/, "")
        .trim();
};

const ensureHooks = (hooks: string[], theme: string) => {
    const unique: string[] = [];
    const seen = new Set<string>();

    for (const hook of hooks) {
        const cleaned = cleanText(hook);
        if (!cleaned) continue;
        if (seen.has(cleaned)) continue;
        seen.add(cleaned);
        unique.push(cleaned);
    }

    while (unique.length < 3) {
        unique.push(`知らないと損する${theme}`);
    }

    return unique.slice(0, 3);
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const theme = typeof body.theme === "string" ? body.theme.trim() : "";
        const tone = typeof body.tone === "string" ? body.tone.trim() : "";
        const hookType = typeof body.hookType === "string" ? body.hookType.trim() : "";

        if (!theme) {
            return NextResponse.json(
                { error: "theme is required" },
                { status: 400 }
            );
        }

        const typeHintMap: Record<string, string> = {
            number: "数字フック",
            "pattern-break": "常識破壊",
            conclusion: "結論先出し",
            question: "疑問投げ",
        };

        const prompt = `You are a Japanese YouTube Shorts producer.
Theme: "${theme}"
Tone: "${tone || "テンポ良く分かりやすい解説"}"
Hook focus: "${typeHintMap[hookType] || "バリエーションを混ぜる"}"

Task:
- Create 3 punchy hook lines for the first 3 seconds.
- Each hook must be under 40 characters.
- Avoid numbering, quotes, or emojis.
- Provide distinct variations (数字/常識破壊/結論先出し/疑問投げ).

Return JSON with:
{
  "hooks": string[]
}`;

        const data = (await generateJSON(prompt, {
            hooks: ["string"],
        })) as HookResponse;

        const hooks = ensureHooks(Array.isArray(data?.hooks) ? data.hooks : [], theme);

        return NextResponse.json({ hooks });
    } catch (error) {
        console.error("Failed to generate hook suggestions:", error);
        const message = error instanceof Error ? error.message : "Failed to generate hooks";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
