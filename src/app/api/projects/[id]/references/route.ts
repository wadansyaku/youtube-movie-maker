import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/projects/[id]/references - Get all reference sets for a project
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id: projectId } = await params;

        const referenceSets = await prisma.referenceSet.findMany({
            where: { projectId },
            include: {
                items: {
                    orderBy: { createdAt: "desc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(referenceSets);
    } catch (error) {
        console.error("Failed to fetch reference sets:", error);
        return NextResponse.json(
            { error: "Failed to fetch reference sets" },
            { status: 500 }
        );
    }
}

// POST /api/projects/[id]/references - Create a new reference set
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { id: projectId } = await params;
        const body = await request.json();
        const { name, description, items } = body;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json(
                { error: "Reference set name is required" },
                { status: 400 }
            );
        }

        const referenceSet = await prisma.referenceSet.create({
            data: {
                projectId,
                name: name.trim(),
                description: description?.trim() || null,
                items: items?.length
                    ? {
                        create: items.map((item: { filePath?: string; externalUrl?: string; notes?: string }) => ({
                            filePath: item.filePath || null,
                            externalUrl: item.externalUrl || null,
                            notes: item.notes || null,
                        })),
                    }
                    : undefined,
            },
            include: {
                items: true,
            },
        });

        await prisma.auditLog.create({
            data: {
                action: "create",
                entityType: "reference_set",
                entityId: referenceSet.id,
                newValues: JSON.stringify(referenceSet),
            },
        });

        return NextResponse.json(referenceSet, { status: 201 });
    } catch (error) {
        console.error("Failed to create reference set:", error);
        return NextResponse.json(
            { error: "Failed to create reference set" },
            { status: 500 }
        );
    }
}
