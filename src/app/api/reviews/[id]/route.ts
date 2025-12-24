import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/reviews/[id] - Get a single review
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;

        const review = await prisma.review.findUnique({
            where: { id },
            include: {
                asset: {
                    select: {
                        id: true,
                        fileName: true,
                        type: true,
                        source: true,
                        filePath: true,
                        duration: true,
                    },
                },
                reviewer: {
                    select: { id: true, name: true, email: true, image: true },
                },
                annotations: {
                    orderBy: { timecodeStart: "asc" },
                },
            },
        });

        if (!review) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 });
        }

        return NextResponse.json(review);
    } catch (error) {
        console.error("Failed to fetch review:", error);
        return NextResponse.json(
            { error: "Failed to fetch review" },
            { status: 500 }
        );
    }
}

// PATCH /api/reviews/[id] - Update review status
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, feedback } = body;

        const existing = await prisma.review.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 });
        }

        const validStatuses = ["pending", "approved", "rejected", "revision_requested"];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
                { status: 400 }
            );
        }

        const updateData: Record<string, unknown> = {};
        if (status !== undefined) updateData.status = status;
        if (feedback !== undefined) updateData.feedback = feedback;

        const review = await prisma.review.update({
            where: { id },
            data: updateData,
            include: {
                asset: { select: { id: true, fileName: true, type: true } },
                reviewer: { select: { id: true, name: true, email: true, image: true } },
                annotations: { orderBy: { timecodeStart: "asc" } },
            },
        });

        await prisma.auditLog.create({
            data: {
                action: "review",
                entityType: "review",
                entityId: review.id,
                oldValues: JSON.stringify(existing),
                newValues: JSON.stringify(review),
            },
        });

        return NextResponse.json(review);
    } catch (error) {
        console.error("Failed to update review:", error);
        return NextResponse.json(
            { error: "Failed to update review" },
            { status: 500 }
        );
    }
}

// DELETE /api/reviews/[id] - Delete a review
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;

        const existing = await prisma.review.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 });
        }

        await prisma.review.delete({ where: { id } });

        await prisma.auditLog.create({
            data: {
                action: "delete",
                entityType: "review",
                entityId: id,
                oldValues: JSON.stringify(existing),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete review:", error);
        return NextResponse.json(
            { error: "Failed to delete review" },
            { status: 500 }
        );
    }
}
