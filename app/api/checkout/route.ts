import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

type PlanType = "basic" | "pro" | "unlimited";

const PRICE_IDS: Record<PlanType, string> = {
  basic: "price_1TQ0dM60gnc7J6cZDm2SGJId",
  pro: "price_1TQ0e060gnc7J6cZZTUaENKt",
  unlimited: "price_1TQ0eU60gnc7J6cZ1eKtargn",
};

function isPlanType(plan: string): plan is PlanType {
  return plan === "basic" || plan === "pro" || plan === "unlimited";
}

export async function POST(req: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY." },
        { status: 500 }
      );
    }

    if (!appUrl) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_SITE_URL." },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    const body = await req.json();

    const rawPlan =
      typeof body?.plan === "string"
        ? body.plan.trim().toLowerCase()
        : "";

    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (!isPlanType(rawPlan)) {
      return NextResponse.json(
        { error: "Invalid plan selected." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Missing customer email." },
        { status: 400 }
      );
    }

    const plan: PlanType = rawPlan;
    const priceId = PRICE_IDS[plan];

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        plan,
        email,
      },
      success_url: `${appUrl}/success?plan=${encodeURIComponent(plan)}`,
      cancel_url: `${appUrl}/pricing`,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return checkout URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Checkout session failed.";

    console.error("CHECKOUT ROUTE ERROR:", error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}