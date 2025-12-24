import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/prompts - List prompts (from all prompt packs)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");
        const search = searchParams.get("search");
        const packId = searchParams.get("packId");

        const where: Record<string, unknown> = {};

        if (type) {
            where.type = type;
        }

        if (packId) {
            where.promptPackId = packId;
        }

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { content: { contains: search } },
            ];
        }

        const prompts = await prisma.prompt.findMany({
            where,
            include: {
                promptPack: {
                    select: { id: true, name: true, seriesId: true },
                },
            },
            orderBy: { updatedAt: "desc" },
        });

        return NextResponse.json({ prompts });
    } catch (error) {
        console.error("Failed to fetch prompts:", error);
        return NextResponse.json(
            { error: "Failed to fetch prompts" },
            { status: 500 }
        );
    }
}

// POST /api/prompts - Create a new prompt
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { promptPackId, type, name, content, variables } = body;

        if (!type || !name || !content) {
            return NextResponse.json(
                { error: "type, name, and content are required" },
                { status: 400 }
            );
        }

        // If no promptPackId provided, create or use a default pack
        let targetPackId = promptPackId;

        if (!targetPackId) {
            // Find or create a default prompt pack
            let defaultPack = await prisma.promptPack.findFirst({
                where: { name: "Default Library" },
            });

            if (!defaultPack) {
                // Need a series to create the pack - create a default one
                let defaultSeries = await prisma.series.findFirst({
                    where: { title: "Prompt Library" },
                });

                if (!defaultSeries) {
                    defaultSeries = await prisma.series.create({
                        data: {
                            title: "Prompt Library",
                            description: "Default series for prompt library",
                            status: "active",
                        },
                    });
                }

                defaultPack = await prisma.promptPack.create({
                    data: {
                        seriesId: defaultSeries.id,
                        name: "Default Library",
                        category: "general",
                    },
                });
            }

            targetPackId = defaultPack.id;
        }

        const prompt = await prisma.prompt.create({
            data: {
                promptPackId: targetPackId,
                type,
                name,
                content,
                variables: JSON.stringify(variables || []),
            },
            include: {
                promptPack: {
                    select: { id: true, name: true },
                },
            },
        });

        return NextResponse.json(prompt, { status: 201 });
    } catch (error) {
        console.error("Failed to create prompt:", error);
        return NextResponse.json(
            { error: "Failed to create prompt" },
            { status: 500 }
        );
    }
}
