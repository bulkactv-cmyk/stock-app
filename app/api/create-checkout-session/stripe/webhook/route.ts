import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Липсва STRIPE_SECRET_KEY в environment variables" },
        { status: 500 }
      );
    }

    if (!stripeWebhookSecret) {
      return NextResponse.json(
        { error: "Липсва STRIPE_WEBHOOK_SECRET в environment variables" },
        { status: 500 }
      );
    }

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: "Липсва NEXT_PUBLIC_SUPABASE_URL в environment variables" },
        { status: 500 }
      );
    }

    if (!supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Липсва SUPABASE_SERVICE_ROLE_KEY в environment variables" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2026-03-25.dahlia",
    });

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Липсва Stripe signature header." },
        { status: 400 }
      );
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      stripeWebhookSecret
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const email =
        typeof session.customer_email === "string"
          ? session.customer_email
          : typeof session.metadata?.email === "string"
          ? session.metadata.email
          : "";

      const plan =
        typeof session.metadata?.plan === "string"
          ? session.metadata.plan.toLowerCase()
          : "basic";

      if (!email) {
        return NextResponse.json(
          { error: "Липсва email в Stripe session." },
          { status: 400 }
        );
      }

      const normalizedPlan =
        plan === "basic" || plan === "pro" || plan === "unlimited"
          ? plan
          : "basic";

      const { error } = await supabase.from("user_plans").upsert(
        {
          email,
          plan: normalizedPlan,
          access_active: true,
        },
        {
          onConflict: "email",
        }
      );

      if (error) {
        console.error("SUPABASE UPSERT ERROR:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("STRIPE WEBHOOK ERROR:", error);

    return NextResponse.json(
      { error: error?.message || "Webhook error" },
      { status: 400 }
    );
  }
}