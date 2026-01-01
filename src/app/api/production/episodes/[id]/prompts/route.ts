import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/production/episodes/[id]/prompts
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const prompts = await prisma.generationPrompt.findMany({
            where: { episodeId: id },
            orderBy: { createdAt: 'desc' },
            include: {
                asset: {
                    select: { id: true, fileName: true, filePath: true, type: true, source: true },
                },
            },
        });

        return NextResponse.json({ prompts });
    } catch (error) {
        console.error('Error fetching prompts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch prompts' },
            { status: 500 }
        );
    }
}

// POST /api/production/episodes/[id]/prompts
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { platform, promptText, resultUrl, assetId, notes } = body;

        if (!platform || !promptText) {
            return NextResponse.json(
                { error: 'platform and promptText are required' },
                { status: 400 }
            );
        }

        const prompt = await prisma.generationPrompt.create({
            data: {
                episodeId: id,
                platform,
                promptText,
                resultUrl: resultUrl || null,
                assetId: assetId || null,
                notes: notes || null,
            },
            include: {
                asset: {
                    select: { id: true, fileName: true, filePath: true, type: true },
                },
            },
        });

        return NextResponse.json(prompt, { status: 201 });
    } catch (error) {
        console.error('Error creating prompt:', error);
        return NextResponse.json(
            { error: 'Failed to create prompt' },
            { status: 500 }
        );
    }
}
