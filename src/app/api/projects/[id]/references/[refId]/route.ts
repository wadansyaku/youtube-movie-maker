import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
    params: Promise<{ id: string; refId: string }>;
}

// GET /api/projects/[id]/references/[refId] - Get a single reference set
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { refId } = await params;

        const referenceSet = await prisma.referenceSet.findUnique({
            where: { id: refId },
            include: {
                items: { orderBy: { createdAt: "desc" } },
            },
        });

        if (!referenceSet) {
            return NextResponse.json(
                { error: "Reference set not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(referenceSet);
    } catch (error) {
        console.error("Failed to fetch reference set:", error);
        return NextResponse.json(
            { error: "Failed to fetch reference set" },
            { status: 500 }
        );
    }
}

// PATCH /api/projects/[id]/references/[refId] - Update a reference set
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { refId } = await params;
        const body = await request.json();
        const { name, description } = body;

        const existing = await prisma.referenceSet.findUnique({ where: { id: refId } });
        if (!existing) {
            return NextResponse.json(
                { error: "Reference set not found" },
                { status: 404 }
            );
        }

        const updateData: Record<string, unknown> = {};
        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description?.trim() || null;

        const referenceSet = await prisma.referenceSet.update({
            where: { id: refId },
            data: updateData,
            include: { items: true },
        });

        await prisma.auditLog.create({
            data: {
                action: "update",
                entityType: "reference_set",
                entityId: referenceSet.id,
                oldValues: JSON.stringify(existing),
                newValues: JSON.stringify(referenceSet),
            },
        });

        return NextResponse.json(referenceSet);
    } catch (error) {
        console.error("Failed to update reference set:", error);
        return NextResponse.json(
            { error: "Failed to update reference set" },
            { status: 500 }
        );
    }
}

// DELETE /api/projects/[id]/references/[refId] - Delete a reference set
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { refId } = await params;

        const existing = await prisma.referenceSet.findUnique({ where: { id: refId } });
        if (!existing) {
            return NextResponse.json(
                { error: "Reference set not found" },
                { status: 404 }
            );
        }

        await prisma.referenceSet.delete({ where: { id: refId } });

        await prisma.auditLog.create({
            data: {
                action: "delete",
                entityType: "reference_set",
                entityId: refId,
                oldValues: JSON.stringify(existing),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete reference set:", error);
        return NextResponse.json(
            { error: "Failed to delete reference set" },
            { status: 500 }
        );
    }
}
