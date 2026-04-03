import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

type CreateCheckoutSessionBody = {
  agentId?: string;
};

function readStripeConfig() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_MEMBERSHIP_PRICE_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');

  if (!secretKey || !priceId || !siteUrl) {
    throw new Error(
      'Missing Stripe configuration. Set STRIPE_SECRET_KEY, STRIPE_MEMBERSHIP_PRICE_ID, and NEXT_PUBLIC_SITE_URL.'
    );
  }

  return {
    priceId,
    secretKey,
    siteUrl,
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Authentication required.' },
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as CreateCheckoutSessionBody;
    const { agentId: rawAgentId } = body;
    const agentId = rawAgentId?.trim();

    if (!agentId) {
      return Response.json({ error: 'Missing agentId' }, { status: 400 });
    }

    if (agentId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'You can only create a checkout session for yourself.' },
        },
        { status: 403 }
      );
    }

    const { priceId, secretKey, siteUrl } = readStripeConfig();

    console.log('🔥 INPUT CHECK:', {
      key: process.env.STRIPE_SECRET_KEY ? 'OK' : 'MISSING',
      price: process.env.STRIPE_MEMBERSHIP_PRICE_ID,
      site: process.env.NEXT_PUBLIC_SITE_URL,
    });

    const stripe = new Stripe(secretKey);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        agentId,
      },
      success_url: `${siteUrl}/dashboard/billing?success=true`,
      cancel_url: `${siteUrl}/dashboard/billing?cancel=true`,
    });

    console.log('SESSION:', session);

    if (!session.url) {
      return Response.json(
        { error: 'No session URL returned' },
        { status: 500 }
      );
    }

    return Response.json({
      url: session.url,
    });
  } catch (error: unknown) {
    console.error('🔥 STRIPE ERROR FULL:', JSON.stringify(error, null, 2));

    const normalizedError = error as {
      code?: string;
      message?: string;
      raw?: unknown;
      type?: string;
    };

    return Response.json(
      {
        error: normalizedError?.message,
        type: normalizedError?.type,
        code: normalizedError?.code,
        raw: normalizedError?.raw,
      },
      { status: 500 }
    );
  }
}
