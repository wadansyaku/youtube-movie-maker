import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/production/templates - List all templates
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const lane = searchParams.get('lane');

        const where: Record<string, unknown> = {};
        if (type) where.type = type;
        if (lane) where.lane = lane;

        const templates = await prisma.productionTemplate.findMany({
            where,
            orderBy: [
                { isDefault: 'desc' },
                { type: 'asc' },
                { name: 'asc' },
            ],
        });

        // Parse JSON fields
        const parsed = templates.map((t) => ({
            ...t,
            content: JSON.parse(t.content),
            variables: JSON.parse(t.variables),
        }));

        return NextResponse.json({ templates: parsed });
    } catch (error) {
        console.error('Error fetching templates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch templates' },
            { status: 500 }
        );
    }
}

// POST /api/production/templates - Create a new template
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, name, lane, content, variables, isDefault } = body;

        if (!type || !name) {
            return NextResponse.json(
                { error: 'type and name are required' },
                { status: 400 }
            );
        }

        const template = await prisma.productionTemplate.create({
            data: {
                type,
                name,
                lane: lane || null,
                content: typeof content === 'string' ? content : JSON.stringify(content || {}),
                variables: typeof variables === 'string' ? variables : JSON.stringify(variables || []),
                isDefault: isDefault || false,
            },
        });

        return NextResponse.json({
            ...template,
            content: JSON.parse(template.content),
            variables: JSON.parse(template.variables),
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating template:', error);
        return NextResponse.json(
            { error: 'Failed to create template' },
            { status: 500 }
        );
    }
}
