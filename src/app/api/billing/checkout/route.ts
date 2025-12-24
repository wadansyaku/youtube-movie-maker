import { NextRequest, NextResponse } from 'next/server';
import * as billing from '@/lib/billing';

// Create checkout session for upgrade
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { planId } = body;

        // Validate plan
        if (!billing.PLANS[planId as billing.PlanId]) {
            return NextResponse.json(
                { error: 'Invalid plan' },
                { status: 400 }
            );
        }

        // In production, get userId from session
        const userId = 'demo-user';

        const origin = req.headers.get('origin') || 'http://localhost:3000';
        const successUrl = `${origin}/billing?success=true`;
        const cancelUrl = `${origin}/billing?canceled=true`;

        const checkoutUrl = await billing.createCheckoutSession(
            userId,
            planId as billing.PlanId,
            successUrl,
            cancelUrl
        );

        return NextResponse.json({ url: checkoutUrl });
    } catch (error) {
        console.error('Failed to create checkout:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create checkout' },
            { status: 500 }
        );
    }
}
