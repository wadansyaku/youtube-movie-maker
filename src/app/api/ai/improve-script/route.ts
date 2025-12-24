import { NextResponse } from "next/server";
import { generateText } from "@/lib/ai";

interface ImproveScriptRequest {
    script: string;
    style?: "formal" | "casual" | "dramatic" | "educational";
    targetLength?: "shorter" | "same" | "longer";
    language?: string;
}

export async function POST(request: Request) {
    try {
        const body: ImproveScriptRequest = await request.json();
        const { script, style = "casual", targetLength = "same", language = "ja" } = body;

        if (!script || typeof script !== "string" || script.trim().length === 0) {
            return NextResponse.json(
                { error: "Script is required" },
                { status: 400 }
            );
        }

        const styleInstructions: Record<string, string> = {
            formal: "Use formal, professional language suitable for business or educational content.",
            casual: "Use conversational, friendly language that feels natural and engaging.",
            dramatic: "Use dramatic, impactful language with tension and emotion.",
            educational: "Use clear, informative language that explains concepts well.",
        };

        const lengthInstructions: Record<string, string> = {
            shorter: "Make it more concise, roughly 70% of the original length.",
            same: "Keep approximately the same length.",
            longer: "Expand with more detail, roughly 130% of the original length.",
        };

        const prompt = `You are a professional script writer. Improve the following video script.

INSTRUCTIONS:
1. ${styleInstructions[style]}
2. ${lengthInstructions[targetLength]}
3. Fix any grammar or spelling errors
4. Improve flow and pacing
5. Make it more engaging for viewers
6. Keep the original message and intent
7. Respond in ${language === "ja" ? "Japanese" : "English"}

ORIGINAL SCRIPT:
${script}

IMPROVED SCRIPT:`;

        const improved = await generateText(prompt, 0.7);

        // Extract key changes made
        const changesPrompt = `List 3-5 key improvements made to this script. Be concise, one line each.

Original: "${script.substring(0, 200)}..."
Improved: "${improved.substring(0, 200)}..."

List improvements in ${language === "ja" ? "Japanese" : "English"}:`;

        let changes: string[] = [];
        try {
            const changesText = await generateText(changesPrompt, 0.3);
            changes = changesText
                .split("\n")
                .filter(line => line.trim())
                .map(line => line.replace(/^[\d\-\.\*]+\s*/, "").trim())
                .slice(0, 5);
        } catch {
            changes = ["Script improved for better engagement"];
        }

        return NextResponse.json({
            improved: improved.trim(),
            changes,
            originalLength: script.length,
            improvedLength: improved.trim().length,
        });
    } catch (error) {
        console.error("Failed to improve script:", error);

        const message = error instanceof Error ? error.message : "Failed to improve script";

        // Check if it's an API key error
        if (message.includes("API Key")) {
            return NextResponse.json(
                { error: message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Failed to improve script. Please check your Gemini API key in settings." },
            { status: 500 }
        );
    }
}
