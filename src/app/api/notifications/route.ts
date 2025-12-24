import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/notifications - List notifications for a user
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const limit = parseInt(searchParams.get("limit") || "20");

        if (!userId) {
            return NextResponse.json(
                { error: "userId is required" },
                { status: 400 }
            );
        }

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        const unreadCount = await prisma.notification.count({
            where: { userId, isRead: false },
        });

        return NextResponse.json({
            notifications,
            unreadCount,
        });
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return NextResponse.json(
            { error: "Failed to fetch notifications" },
            { status: 500 }
        );
    }
}

// PATCH /api/notifications - Mark as read
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, markAllRead, userId } = body;

        if (markAllRead && userId) {
            await prisma.notification.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true },
            });
            return NextResponse.json({ success: true });
        }

        if (id) {
            const notification = await prisma.notification.update({
                where: { id },
                data: { isRead: true },
            });
            return NextResponse.json(notification);
        }

        return NextResponse.json(
            { error: "Invalid request" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Failed to update notification:", error);
        return NextResponse.json(
            { error: "Failed to update notification" },
            { status: 500 }
        );
    }
}
