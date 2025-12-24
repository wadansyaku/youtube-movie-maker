import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/reviews/[id]/annotations - Add annotation to review
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { id: reviewId } = await params;
        const body = await request.json();
        const { timecodeStart, timecodeEnd, xPosition, yPosition, comment } = body;

        if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
            return NextResponse.json(
                { error: "Comment is required" },
                { status: 400 }
            );
        }

        const review = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!review) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 });
        }

        const annotation = await prisma.reviewAnnotation.create({
            data: {
                reviewId,
                timecodeStart: timecodeStart || null,
                timecodeEnd: timecodeEnd || null,
                xPosition: xPosition || null,
                yPosition: yPosition || null,
                comment: comment.trim(),
            },
        });

        return NextResponse.json(annotation, { status: 201 });
    } catch (error) {
        console.error("Failed to add annotation:", error);
        return NextResponse.json(
            { error: "Failed to add annotation" },
            { status: 500 }
        );
    }
}

// DELETE /api/reviews/[id]/annotations - Delete annotations
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id: reviewId } = await params;
        const body = await request.json();
        const { annotationIds } = body;

        if (!Array.isArray(annotationIds) || annotationIds.length === 0) {
            return NextResponse.json(
                { error: "annotationIds array is required" },
                { status: 400 }
            );
        }

        await prisma.reviewAnnotation.deleteMany({
            where: {
                id: { in: annotationIds },
                reviewId,
            },
        });

        return NextResponse.json({ success: true, deleted: annotationIds.length });
    } catch (error) {
        console.error("Failed to delete annotations:", error);
        return NextResponse.json(
            { error: "Failed to delete annotations" },
            { status: 500 }
        );
    }
}
