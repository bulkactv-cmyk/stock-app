import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

type PlanType = "basic" | "pro" | "unlimited";

const PRICE_IDS: Record<PlanType, string> = {
  basic: "price_1TPlmj9bv613l0cODWDSH8ka",
  pro: "price_1TPlnR9bv613l0cOtOEeMEAo",
  unlimited: "price_1TPlnq9bv613l0cO5lm1X2qG",
};

export async function POST(req: Request) {
  try {
    // ✅ Създаваме Stripe ТУК (не извън функцията)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_APP_URL" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const plan =
      typeof body?.plan === "string"
        ? body.plan.trim().toLowerCase()
        : "";

    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (!plan || !(plan in PRICE_IDS)) {
      return NextResponse.json(
        { error: "Invalid subscription plan." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Missing customer email." },
        { status: 400 }
      );
    }

    const priceId = PRICE_IDS[plan as PlanType];

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
      error instanceof Error ? error.message : "Stripe checkout error.";

    console.error("STRIPE CHECKOUT ERROR:", error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}