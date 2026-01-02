import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const selectionReason = String(body.selectionReason || "").trim();

        if (!selectionReason) {
            return NextResponse.json(
                { error: "selectionReason is required" },
                { status: 400 }
            );
        }

        const existing = await prisma.ideaKernelIdea.findUnique({
            where: { id: params.id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        if (existing.status === "SELECTED") {
            return NextResponse.json(
                { error: "Already selected" },
                { status: 400 }
            );
        }

        const updated = await prisma.ideaKernelIdea.update({
            where: { id: params.id },
            data: {
                status: "SELECTED",
                selectionReason,
                selectedAt: new Date(),
            },
        });

        return NextResponse.json({ idea: updated });
    } catch (error) {
        console.error("Failed to select idea:", error);
        return NextResponse.json(
            { error: "Failed to select idea" },
            { status: 500 }
        );
    }
}
