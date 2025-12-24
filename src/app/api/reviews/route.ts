import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/reviews - List reviews
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const assetId = searchParams.get("assetId");
        const reviewerId = searchParams.get("reviewerId");
        const status = searchParams.get("status");
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");

        const where: Record<string, unknown> = {};

        if (assetId) {
            where.assetId = assetId;
        }

        if (reviewerId) {
            where.reviewerId = reviewerId;
        }

        if (status) {
            where.status = status;
        }

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where,
                include: {
                    asset: {
                        select: {
                            id: true,
                            fileName: true,
                            type: true,
                            source: true,
                        },
                    },
                    reviewer: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                        },
                    },
                    annotations: {
                        orderBy: { timecodeStart: "asc" },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset,
            }),
            prisma.review.count({ where }),
        ]);

        return NextResponse.json({
            reviews,
            total,
            limit,
            offset,
        });
    } catch (error) {
        console.error("Failed to fetch reviews:", error);
        return NextResponse.json(
            { error: "Failed to fetch reviews" },
            { status: 500 }
        );
    }
}

// POST /api/reviews - Create a review request
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { assetId, reviewerId, feedback } = body;

        if (!assetId || !reviewerId) {
            return NextResponse.json(
                { error: "assetId and reviewerId are required" },
                { status: 400 }
            );
        }

        const review = await prisma.review.create({
            data: {
                assetId,
                reviewerId,
                status: "pending",
                feedback: feedback || null,
            },
            include: {
                asset: {
                    select: { id: true, fileName: true, type: true },
                },
                reviewer: {
                    select: { id: true, name: true, email: true, image: true },
                },
                annotations: true,
            },
        });

        await prisma.auditLog.create({
            data: {
                action: "create",
                entityType: "review",
                entityId: review.id,
                userId: reviewerId,
                newValues: JSON.stringify(review),
            },
        });

        return NextResponse.json(review, { status: 201 });
    } catch (error) {
        console.error("Failed to create review:", error);
        return NextResponse.json(
            { error: "Failed to create review" },
            { status: 500 }
        );
    }
}

// PATCH /api/reviews - Update a review status
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, status, feedback, revisionTemplate, reviewerId } = body;

        if (!id || !status) {
            return NextResponse.json(
                { error: "id and status are required" },
                { status: 400 }
            );
        }

        const review = await prisma.review.update({
            where: { id },
            data: {
                status,
                feedback: feedback || undefined,
                revisionTemplate: revisionTemplate || undefined,
            },
            include: {
                asset: {
                    select: { id: true, fileName: true, type: true },
                },
                reviewer: {
                    select: { id: true, name: true, email: true, image: true },
                },
                annotations: true,
            },
        });

        // Log audit
        if (reviewerId) {
            await prisma.auditLog.create({
                data: {
                    action: "update",
                    entityType: "review",
                    entityId: review.id,
                    userId: reviewerId,
                    newValues: JSON.stringify({ status, feedback }),
                },
            });
        }

        return NextResponse.json(review);
    } catch (error) {
        console.error("Failed to update review:", error);
        return NextResponse.json(
            { error: "Failed to update review" },
            { status: 500 }
        );
    }
}
