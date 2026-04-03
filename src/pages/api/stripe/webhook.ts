import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { buffer } from "micro";
import { refreshAgentActivationStatus } from "@/lib/agent-activation";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const config = {
  api: {
    bodyParser: false,
  },
};

function addOneYear(date: Date) {
  const nextDate = new Date(date);
  nextDate.setFullYear(nextDate.getFullYear() + 1);
  return nextDate;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const secretKey = process.env.STRIPE_SECRET_KEY || "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  console.log("ENV CHECK:", {
    secretKey: !!secretKey,
    webhookSecret: !!webhookSecret,
  });

  if (!secretKey || !webhookSecret) {
    console.error("❌ Missing Stripe webhook config");
    return res.status(500).send("Missing Stripe webhook config");
  }

  const stripe = new Stripe(secretKey);
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown signature error";
    console.error("❌ Signature verification failed:", message);
    return res.status(400).send(`Webhook Error: ${message}`);
  }

  console.log("EVENT TYPE:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const agentId = session.metadata?.agentId?.trim();
    const sessionId = session.id;

    console.log("🔥 CHECKOUT COMPLETE:", {
      sessionId,
      agentId,
      paymentStatus: session.payment_status,
    });

    if (!agentId) {
      console.error("❌ Missing agentId in metadata");
      return res.status(200).send("No agentId");
    }

    try {
      const supabase = createSupabaseAdminClient();
      const now = new Date();
      const paidAt = now.toISOString();

      const stripeSessionId = sessionId;
      const stripeCustomerId =
        typeof session.customer === "string" ? session.customer : null;
      const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : null;
      const currency = session.currency?.toUpperCase() ?? "USD";
      const amount =
        typeof session.amount_total === "number"
          ? session.amount_total / 100
          : 1000;

      const { data: existingPaymentBySession, error: paymentSessionLookupError } =
        await supabase
          .from("membership_payments")
          .select("id")
          .eq("stripe_session_id", stripeSessionId)
          .maybeSingle();

      if (paymentSessionLookupError) {
        console.error("❌ Payment session lookup failed:", paymentSessionLookupError);
        return res.status(200).send("OK");
      }

      if (existingPaymentBySession) {
        console.log("ℹ️ Duplicate Stripe session ignored:", stripeSessionId);
        return res.status(200).send("OK");
      }

      const { data: existingMembership, error: membershipLookupError } =
        await supabase
          .from("memberships")
          .select(
            "id, plan_name, renewal_period, status, starts_at, expires_at"
          )
          .eq("agent_id", agentId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (membershipLookupError) {
        console.error("❌ Membership lookup failed:", membershipLookupError);
        return res.status(200).send("OK");
      }

      let membershipId = existingMembership?.id ?? null;
      const isRenewal = existingMembership?.status === "active";
      const renewalBaseDate =
        isRenewal && existingMembership?.expires_at
          ? new Date(existingMembership.expires_at)
          : now;
      const newEndDate = addOneYear(renewalBaseDate).toISOString();
      const startsAt = isRenewal
        ? existingMembership?.starts_at ?? paidAt
        : paidAt;

      console.log("🧠 MEMBERSHIP LOGIC:", {
        mode: isRenewal ? "renewal" : "new",
        newEndDate,
      });

      if (membershipId) {
        const { error: membershipUpdateError } = await supabase
          .from("memberships")
          .update({
            amount,
            currency,
            expires_at: newEndDate,
            plan_name: existingMembership?.plan_name ?? "CRLA Annual Membership",
            renewal_period: existingMembership?.renewal_period ?? "annual",
            starts_at: startsAt,
            status: "active",
            stripe_customer_id: stripeCustomerId,
            stripe_session_id: stripeSessionId,
          })
          .eq("id", membershipId);

        if (membershipUpdateError) {
          console.error("❌ Membership update failed:", membershipUpdateError);
          return res.status(200).send("OK");
        }
      } else {
        const { data: insertedMembership, error: membershipInsertError } =
          await supabase
            .from("memberships")
            .insert({
              agent_id: agentId,
              amount,
              currency,
              expires_at: newEndDate,
              plan_name: "CRLA Annual Membership",
              renewal_period: "annual",
              starts_at: startsAt,
              status: "active",
              stripe_customer_id: stripeCustomerId,
              stripe_session_id: stripeSessionId,
            })
            .select("id")
            .single();

        if (membershipInsertError || !insertedMembership) {
          console.error("❌ Membership insert failed:", membershipInsertError);
          return res.status(200).send("OK");
        }

        membershipId = insertedMembership.id;
      }

      const { error: paymentInsertError } = await supabase
        .from("membership_payments")
        .insert({
          agent_id: agentId,
          amount,
          currency,
          membership_id: membershipId,
          paid_at: paidAt,
          status: "paid",
          stripe_payment_intent_id: paymentIntentId,
          stripe_session_id: stripeSessionId,
        });

      if (paymentInsertError) {
        console.error("❌ Payment insert failed:", paymentInsertError);
        return res.status(200).send("OK");
      }

      await refreshAgentActivationStatus(agentId, supabase);
    } catch (error) {
      console.error("❌ Webhook DB logic failed:", error);
      return res.status(200).send("OK");
    }
  } else {
    console.log("ℹ️ Ignored event:", event.type);
  }

  return res.status(200).send("OK");
}
