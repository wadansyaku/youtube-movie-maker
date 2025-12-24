import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/projects - List all projects
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const search = searchParams.get("search");
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");

        const where: Record<string, unknown> = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { description: { contains: search } },
            ];
        }

        const [projects, total] = await Promise.all([
            prisma.project.findMany({
                where,
                include: {
                    createdBy: {
                        select: { id: true, name: true, email: true, image: true },
                    },
                    scenes: {
                        include: {
                            shots: true,
                        },
                        orderBy: { orderIndex: "asc" },
                    },
                    _count: {
                        select: {
                            projectAssets: true,
                            exports: true,
                        },
                    },
                },
                orderBy: { updatedAt: "desc" },
                take: limit,
                skip: offset,
            }),
            prisma.project.count({ where }),
        ]);

        return NextResponse.json({
            projects,
            total,
            limit,
            offset,
        });
    } catch (error) {
        console.error("Failed to fetch projects:", error);
        return NextResponse.json(
            { error: "Failed to fetch projects" },
            { status: 500 }
        );
    }
}

// POST /api/projects - Create a new project
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, targetDurationSeconds, aspectRatio } = body;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json(
                { error: "Project name is required" },
                { status: 400 }
            );
        }

        const project = await prisma.project.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                targetDurationSeconds: targetDurationSeconds || null,
                aspectRatio: aspectRatio || "16:9",
                status: "draft",
            },
            include: {
                scenes: true,
            },
        });

        // Log creation
        await prisma.auditLog.create({
            data: {
                action: "create",
                entityType: "project",
                entityId: project.id,
                newValues: JSON.stringify(project),
            },
        });

        return NextResponse.json(project, { status: 201 });
    } catch (error) {
        console.error("Failed to create project:", error);
        return NextResponse.json(
            { error: "Failed to create project" },
            { status: 500 }
        );
    }
}
