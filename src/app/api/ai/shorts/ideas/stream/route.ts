import { generateJSON } from "@/lib/ai";

const TITLE_COUNT = 30;

type IdeaResponse = {
    tone?: string;
    titles?: string[];
};

const cleanText = (value: unknown) => {
    if (typeof value !== "string") return "";
    return value
        .replace(/^[\s"'「」]+|[\s"'「」]+$/g, "")
        .replace(/^\d+\s*[.\-:)]\s*/, "")
        .trim();
};

const ensureTitleCount = (titles: string[], theme: string) => {
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
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const theme = typeof body.theme === "string" ? body.theme.trim() : "";

        if (!theme) {
            return new Response(
                JSON.stringify({ error: "theme is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
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

        const data = (await generateJSON(prompt, {
            tone: "string",
            titles: ["string"],
        })) as IdeaResponse;

        const tone = cleanText(data?.tone) || "テンポ良く分かりやすい解説";
        const titles = ensureTitleCount(Array.isArray(data?.titles) ? data.titles : [], theme);

        const encoder = new TextEncoder();
        const abortSignal = request.signal;
        const stream = new ReadableStream({
            start(controller) {
                let isClosed = false;
                const closeStream = () => {
                    if (isClosed) return;
                    isClosed = true;
                    try {
                        controller.close();
                    } catch {
                        // Ignore closing errors.
                    }
                };

                const send = (event: string, payload: unknown) => {
                    if (isClosed || abortSignal.aborted) return false;
                    try {
                        controller.enqueue(
                            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`)
                        );
                        return true;
                    } catch {
                        closeStream();
                        return false;
                    }
                };

                const handleAbort = () => {
                    closeStream();
                };
                abortSignal.addEventListener("abort", handleAbort);

                (async () => {
                    try {
                        if (!send("tone", { tone })) return;
                        for (let i = 0; i < titles.length; i += 1) {
                            if (abortSignal.aborted || isClosed) break;
                            if (!send("title", { index: i + 1, title: titles[i] })) break;
                            await delay(60);
                        }
                        if (!abortSignal.aborted && !isClosed) {
                            send("done", { count: titles.length });
                        }
                    } catch (error) {
                        if (!isClosed) {
                            send("error", {
                                error: error instanceof Error ? error.message : "Failed to stream titles",
                            });
                        }
                    } finally {
                        abortSignal.removeEventListener("abort", handleAbort);
                        closeStream();
                    }
                })();
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to generate ideas";
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
