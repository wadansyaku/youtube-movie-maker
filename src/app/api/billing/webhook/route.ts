import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handleWebhookEvent } from '@/lib/billing';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');

        if (!signature) {
            return NextResponse.json(
                { error: 'Missing signature' },
                { status: 400 }
            );
        }

        // Get webhook secret
        const webhookSecretSetting = await prisma.systemSettings.findUnique({
            where: { key: 'stripe_webhook_secret' },
        });

        if (!webhookSecretSetting?.value) {
            return NextResponse.json(
                { error: 'Webhook secret not configured' },
                { status: 500 }
            );
        }

        // Get Stripe client
        const secretKeySetting = await prisma.systemSettings.findUnique({
            where: { key: 'stripe_secret_key' },
        });

        if (!secretKeySetting?.value) {
            return NextResponse.json(
                { error: 'Stripe not configured' },
                { status: 500 }
            );
        }

        const stripe = new Stripe(secretKeySetting.value, {
            apiVersion: '2025-12-15.clover',
        });

        // Verify webhook signature
        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                webhookSecretSetting.value
            );
        } catch (err) {
            console.error('Webhook signature verification failed:', err);
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 400 }
            );
        }

        // Handle the event
        await handleWebhookEvent(event);

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}
