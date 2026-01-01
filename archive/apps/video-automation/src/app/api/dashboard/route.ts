import { NextResponse } from 'next/server';

// Fallback mock data when database is not available
const mockDashboardData = {
    stats: {
        totalProjects: 1,
        totalRenders: 1,
        pendingRenders: 0,
        completedToday: 0,
    },
    recentRenders: [
        {
            id: 'brain-facts-1',
            projectName: '脳の驚きの事実 3選',
            templateName: 'MedicalShorts',
            status: 'succeeded' as const,
            createdAt: new Date().toISOString(),
        },
    ],
};

export async function GET() {
    try {
        // Try to import and use Prisma, but fall back to mock data if it fails
        let useMock = false;

        try {
            const { prisma } = await import('@/lib/db');

            // Get actual counts from database
            const [projectCount, renderCount, pendingCount, recentRenders] = await Promise.all([
                prisma.item.count(),
                prisma.jobRun.count(),
                prisma.jobRun.count({
                    where: {
                        status: { in: ['queued', 'running'] },
                    },
                }),
                prisma.jobRun.findMany({
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    include: {
                        item: {
                            select: { title: true },
                        },
                        template: {
                            select: { name: true },
                        },
                    },
                }),
            ]);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const completedToday = await prisma.jobRun.count({
                where: {
                    status: 'succeeded',
                    finishedAt: { gte: today },
                },
            });

            return NextResponse.json({
                stats: {
                    totalProjects: projectCount,
                    totalRenders: renderCount,
                    pendingRenders: pendingCount,
                    completedToday,
                },
                recentRenders: recentRenders.map((run) => ({
                    id: run.id,
                    projectName: run.item.title,
                    templateName: run.template?.name || 'Unknown',
                    status: run.status as 'queued' | 'running' | 'succeeded' | 'failed',
                    createdAt: run.createdAt.toISOString(),
                })),
            });
        } catch (dbError) {
            console.warn('Database not available, using mock data:', dbError);
            useMock = true;
        }

        if (useMock) {
            return NextResponse.json(mockDashboardData);
        }
    } catch (error) {
        console.error('Dashboard API error:', error);
        // Return mock data on any error
        return NextResponse.json(mockDashboardData);
    }
}
