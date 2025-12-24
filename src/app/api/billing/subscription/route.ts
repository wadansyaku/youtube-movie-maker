import { NextRequest, NextResponse } from 'next/server';
import * as billing from '@/lib/billing';

// Get current subscription and usage
export async function GET(req: NextRequest) {
    try {
        // In production, get userId from session
        const userId = 'demo-user';

        const subscription = await billing.getUserSubscription(userId);
        const usage = await billing.getUserUsage(userId);
        const plan = billing.PLANS[subscription.planId as billing.PlanId];

        return NextResponse.json({
            subscription: {
                planId: subscription.planId,
                planName: plan.name,
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd,
            },
            usage: {
                aiCalls: {
                    used: usage.aiCalls,
                    limit: plan.limits.aiCalls,
                },
                videoMinutes: {
                    used: usage.videoMinutes,
                    limit: plan.limits.videoMinutes,
                },
                narrationChars: {
                    used: usage.narrationChars,
                    limit: plan.limits.narrationChars,
                },
                thumbnails: {
                    used: usage.thumbnails,
                    limit: plan.limits.thumbnails,
                },
            },
            periodStart: usage.periodStart,
            periodEnd: usage.periodEnd,
        });
    } catch (error) {
        console.error('Failed to get subscription:', error);
        return NextResponse.json(
            { error: 'Failed to get subscription info' },
            { status: 500 }
        );
    }
}
