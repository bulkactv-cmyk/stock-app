import { NextResponse } from "next/server";
import { stripe } from "../../../lib/stripe";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!appUrl) {
  throw new Error("Липсва NEXT_PUBLIC_APP_URL в environment variables");
}

const PRICE_IDS: Record<string, string> = {
  basic: "price_1TOybBQ392LlwhIsgpgzoYN1",
  pro: "price_1TOgK5Q392LlwhIs82KhiJLI",
  unlimited: "price_1TOcuRQ392LlwhIspEnHjxhg",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const plan =
      typeof body?.plan === "string" ? body.plan.trim().toLowerCase() : "";
    const email =
      typeof body?.email === "string" ? body.email.trim() : "";

    if (!plan || !PRICE_IDS[plan]) {
      return NextResponse.json(
        { error: "Невалиден план." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Липсва имейл." },
        { status: 400 }
      );
    }

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
        { error: "Stripe не върна checkout URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("STRIPE ERROR MESSAGE:", error?.message);
    console.error("STRIPE FULL ERROR:", error);

    return NextResponse.json(
      { error: error?.message || "Stripe error" },
      { status: 500 }
    );
  }
}