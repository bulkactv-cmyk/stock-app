import { NextResponse } from "next/server";
import { stripe } from "../../../lib/stripe";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!appUrl) {
  throw new Error("Missing NEXT_PUBLIC_APP_URL in environment variables");
}

const PRICE_IDS: Record<"basic" | "pro" | "unlimited", string> = {
  basic: "price_1TPlmj9bv613l0cODWDSH8ka",
  pro: "price_1TPlnR9bv613l0cOtOEeMEAo",
  unlimited: "price_1TPlnq9bv613l0cO5lm1X2qG",
};

type PlanType = keyof typeof PRICE_IDS;

export async function POST(req: Request) {
  try {
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