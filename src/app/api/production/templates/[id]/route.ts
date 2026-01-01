import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/production/templates/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const template = await prisma.productionTemplate.findUnique({
            where: { id },
        });

        if (!template) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            ...template,
            content: JSON.parse(template.content),
            variables: JSON.parse(template.variables),
        });
    } catch (error) {
        console.error('Error fetching template:', error);
        return NextResponse.json(
            { error: 'Failed to fetch template' },
            { status: 500 }
        );
    }
}

// PATCH /api/production/templates/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, lane, content, variables, isDefault } = body;

        const updateData: Record<string, unknown> = {};
        if (name !== undefined) updateData.name = name;
        if (lane !== undefined) updateData.lane = lane;
        if (content !== undefined) {
            updateData.content = typeof content === 'string' ? content : JSON.stringify(content);
        }
        if (variables !== undefined) {
            updateData.variables = typeof variables === 'string' ? variables : JSON.stringify(variables);
        }
        if (isDefault !== undefined) updateData.isDefault = isDefault;

        const template = await prisma.productionTemplate.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            ...template,
            content: JSON.parse(template.content),
            variables: JSON.parse(template.variables),
        });
    } catch (error) {
        console.error('Error updating template:', error);
        return NextResponse.json(
            { error: 'Failed to update template' },
            { status: 500 }
        );
    }
}

// DELETE /api/production/templates/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        await prisma.productionTemplate.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting template:', error);
        return NextResponse.json(
            { error: 'Failed to delete template' },
            { status: 500 }
        );
    }
}
