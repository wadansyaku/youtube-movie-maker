import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/prompts/[id]
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;

        const prompt = await prisma.prompt.findUnique({
            where: { id },
            include: {
                promptPack: {
                    select: { id: true, name: true, seriesId: true },
                },
            },
        });

        if (!prompt) {
            return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
        }

        return NextResponse.json(prompt);
    } catch (error) {
        console.error("Failed to fetch prompt:", error);
        return NextResponse.json(
            { error: "Failed to fetch prompt" },
            { status: 500 }
        );
    }
}

// PATCH /api/prompts/[id]
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { type, name, content, variables } = body;

        const existing = await prisma.prompt.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
        }

        const updateData: Record<string, unknown> = {};
        if (type !== undefined) updateData.type = type;
        if (name !== undefined) updateData.name = name;
        if (content !== undefined) updateData.content = content;
        if (variables !== undefined) updateData.variables = JSON.stringify(variables);

        const prompt = await prisma.prompt.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(prompt);
    } catch (error) {
        console.error("Failed to update prompt:", error);
        return NextResponse.json(
            { error: "Failed to update prompt" },
            { status: 500 }
        );
    }
}

// DELETE /api/prompts/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;

        const existing = await prisma.prompt.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
        }

        await prisma.prompt.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete prompt:", error);
        return NextResponse.json(
            { error: "Failed to delete prompt" },
            { status: 500 }
        );
    }
}
