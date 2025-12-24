/**
 * Stripe Billing Client
 * 
 * Manages subscriptions, usage tracking, and payments.
 */

import Stripe from 'stripe';
import { prisma } from '@/lib/db';

// Initialize Stripe client
const getStripeClient = async (): Promise<Stripe | null> => {
    const setting = await prisma.systemSettings.findUnique({
        where: { key: 'stripe_secret_key' },
    });

    if (!setting?.value) {
        return null;
    }

    return new Stripe(setting.value, {
        apiVersion: '2025-12-15.clover',
    });
};

// Plan definitions
export const PLANS = {
    free: {
        id: 'free',
        name: 'Free',
        description: '試用プラン',
        price: 0,
        currency: 'jpy',
        stripePriceId: null as string | null,
        limits: {
            aiCalls: 5,
            videoMinutes: 0,
            narrationChars: 0,
            thumbnails: 2,
        },
    },
    creator: {
        id: 'creator',
        name: 'Creator',
        description: '個人クリエイター向け',
        price: 1980,
        currency: 'jpy',
        stripePriceId: 'price_creator_monthly', // Set in Stripe Dashboard
        limits: {
            aiCalls: 100,
            videoMinutes: 10,
            narrationChars: 50000,
            thumbnails: 50,
        },
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        description: 'プロ制作者向け',
        price: 4980,
        currency: 'jpy',
        stripePriceId: 'price_pro_monthly',
        limits: {
            aiCalls: -1, // Unlimited
            videoMinutes: 60,
            narrationChars: 200000,
            thumbnails: -1,
        },
    },
    team: {
        id: 'team',
        name: 'Team',
        description: 'チーム・企業向け',
        price: 9800,
        currency: 'jpy',
        stripePriceId: 'price_team_monthly',
        limits: {
            aiCalls: -1,
            videoMinutes: -1,
            narrationChars: -1,
            thumbnails: -1,
        },
    },
} as const;

export type PlanId = keyof typeof PLANS;

interface UsageRecord {
    aiCalls: number;
    videoMinutes: number;
    narrationChars: number;
    thumbnails: number;
    periodStart: Date;
    periodEnd: Date;
}

/**
 * Get or create user subscription record
 */
export async function getUserSubscription(userId: string) {
    // For now, using SystemSettings as a simple KV store
    // In production, you'd have a proper Subscription model
    const key = `subscription_${userId}`;
    const setting = await prisma.systemSettings.findUnique({
        where: { key },
    });

    if (!setting) {
        // Default to free plan
        return {
            planId: 'free' as PlanId,
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        };
    }

    return JSON.parse(setting.value);
}

/**
 * Get current usage for a user
 */
export async function getUserUsage(userId: string): Promise<UsageRecord> {
    const key = `usage_${userId}`;
    const setting = await prisma.systemSettings.findUnique({
        where: { key },
    });

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    if (!setting) {
        return {
            aiCalls: 0,
            videoMinutes: 0,
            narrationChars: 0,
            thumbnails: 0,
            periodStart,
            periodEnd,
        };
    }

    const usage = JSON.parse(setting.value);

    // Reset if new period
    if (new Date(usage.periodEnd) < now) {
        return {
            aiCalls: 0,
            videoMinutes: 0,
            narrationChars: 0,
            thumbnails: 0,
            periodStart,
            periodEnd,
        };
    }

    return usage;
}

/**
 * Increment usage counter
 */
export async function incrementUsage(
    userId: string,
    type: 'aiCalls' | 'videoMinutes' | 'narrationChars' | 'thumbnails',
    amount: number = 1
): Promise<{ allowed: boolean; current: number; limit: number }> {
    const subscription = await getUserSubscription(userId);
    const plan = PLANS[subscription.planId as PlanId];
    const limit = plan.limits[type];

    // Check limit (-1 means unlimited)
    const usage = await getUserUsage(userId);
    const current = usage[type] + amount;

    if (limit !== -1 && current > limit) {
        return { allowed: false, current: usage[type], limit };
    }

    // Update usage
    const key = `usage_${userId}`;
    const newUsage = {
        ...usage,
        [type]: current,
    };

    await prisma.systemSettings.upsert({
        where: { key },
        update: { value: JSON.stringify(newUsage) },
        create: { key, value: JSON.stringify(newUsage) },
    });

    return { allowed: true, current, limit };
}

/**
 * Check if user can perform action
 */
export async function checkUsageLimit(
    userId: string,
    type: 'aiCalls' | 'videoMinutes' | 'narrationChars' | 'thumbnails',
    amount: number = 1
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    const subscription = await getUserSubscription(userId);
    const plan = PLANS[subscription.planId as PlanId];
    const limit = plan.limits[type];

    if (limit === -1) {
        return { allowed: true, remaining: -1, limit: -1 };
    }

    const usage = await getUserUsage(userId);
    const remaining = limit - usage[type];

    return {
        allowed: remaining >= amount,
        remaining: Math.max(0, remaining),
        limit,
    };
}

/**
 * Create Stripe Checkout Session for subscription
 */
export async function createCheckoutSession(
    userId: string,
    planId: PlanId,
    successUrl: string,
    cancelUrl: string
): Promise<string | null> {
    const stripe = await getStripeClient();
    if (!stripe) {
        throw new Error('Stripe not configured');
    }

    const plan = PLANS[planId];
    if (!plan.stripePriceId) {
        throw new Error('Plan does not have a Stripe price');
    }

    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
            {
                price: plan.stripePriceId,
                quantity: 1,
            },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
            userId,
            planId,
        },
    });

    return session.url;
}

/**
 * Create Stripe Customer Portal Session
 */
export async function createPortalSession(
    userId: string,
    returnUrl: string
): Promise<string | null> {
    const stripe = await getStripeClient();
    if (!stripe) {
        throw new Error('Stripe not configured');
    }

    // Get customer ID from subscription
    const subscription = await getUserSubscription(userId);
    if (!subscription.stripeCustomerId) {
        throw new Error('No Stripe customer found');
    }

    const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: returnUrl,
    });

    return session.url;
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const { userId, planId } = session.metadata || {};

            if (userId && planId) {
                const key = `subscription_${userId}`;
                await prisma.systemSettings.upsert({
                    where: { key },
                    update: {
                        value: JSON.stringify({
                            planId,
                            status: 'active',
                            stripeCustomerId: session.customer,
                            stripeSubscriptionId: session.subscription,
                            currentPeriodStart: new Date(),
                            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        }),
                    },
                    create: {
                        key,
                        value: JSON.stringify({
                            planId,
                            status: 'active',
                            stripeCustomerId: session.customer,
                            stripeSubscriptionId: session.subscription,
                            currentPeriodStart: new Date(),
                            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        }),
                    },
                });
            }
            break;
        }

        case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription;
            // Update subscription status
            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            // Downgrade to free plan
            break;
        }
    }
}

/**
 * Check if Stripe is configured
 */
export async function isConfigured(): Promise<boolean> {
    const stripe = await getStripeClient();
    return stripe !== null;
}

/**
 * Set Stripe API keys
 */
export async function setApiKeys(secretKey: string, publishableKey: string) {
    await prisma.systemSettings.upsert({
        where: { key: 'stripe_secret_key' },
        update: { value: secretKey },
        create: { key: 'stripe_secret_key', value: secretKey },
    });

    await prisma.systemSettings.upsert({
        where: { key: 'stripe_publishable_key' },
        update: { value: publishableKey },
        create: { key: 'stripe_publishable_key', value: publishableKey },
    });
}
