import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
    params: Promise<{ id: string; refId: string }>;
}

// POST /api/projects/[id]/references/[refId]/items - Add item to reference set
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { refId } = await params;
        const body = await request.json();
        const { filePath, externalUrl, notes } = body;

        if (!filePath && !externalUrl) {
            return NextResponse.json(
                { error: "Either filePath or externalUrl is required" },
                { status: 400 }
            );
        }

        const referenceSet = await prisma.referenceSet.findUnique({
            where: { id: refId },
        });

        if (!referenceSet) {
            return NextResponse.json(
                { error: "Reference set not found" },
                { status: 404 }
            );
        }

        const item = await prisma.referenceItem.create({
            data: {
                referenceSetId: refId,
                filePath: filePath || null,
                externalUrl: externalUrl || null,
                notes: notes?.trim() || null,
            },
        });

        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        console.error("Failed to add reference item:", error);
        return NextResponse.json(
            { error: "Failed to add reference item" },
            { status: 500 }
        );
    }
}

// DELETE /api/projects/[id]/references/[refId]/items - Delete items from reference set
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { refId } = await params;
        const body = await request.json();
        const { itemIds } = body;

        if (!Array.isArray(itemIds) || itemIds.length === 0) {
            return NextResponse.json(
                { error: "itemIds array is required" },
                { status: 400 }
            );
        }

        await prisma.referenceItem.deleteMany({
            where: {
                id: { in: itemIds },
                referenceSetId: refId,
            },
        });

        return NextResponse.json({ success: true, deleted: itemIds.length });
    } catch (error) {
        console.error("Failed to delete reference items:", error);
        return NextResponse.json(
            { error: "Failed to delete reference items" },
            { status: 500 }
        );
    }
}
