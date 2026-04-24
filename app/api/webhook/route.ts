import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const PRICE_TO_PLAN: Record<string, "basic" | "pro" | "unlimited"> = {
  "price_1TOybBQ392LlwhIsgpgzoYN1": "basic",
  "price_1TOgK5Q392LlwhIs82KhiJLI": "pro",
  "price_1TOcuRQ392LlwhIspEnHjxhg": "unlimited",
};

async function getCustomerEmail(customerId: string | null | undefined) {
  if (!customerId) return null;

  const customer = await stripe.customers.retrieve(customerId);

  if ("deleted" in customer && customer.deleted === true) {
    return null;
  }

  if ("email" in customer) {
    return customer.email || null;
  }

  return null;
}

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Webhook signature verification failed.";

    console.error("STRIPE SIGNATURE ERROR:", message);

    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items", "customer"],
      });

      const priceId = fullSession.line_items?.data?.[0]?.price?.id || null;
      const plan = priceId ? PRICE_TO_PLAN[priceId] : null;

      let email: string | null = null;

      if (fullSession.customer_details?.email) {
        email = fullSession.customer_details.email;
      } else if (fullSession.customer_email) {
        email = fullSession.customer_email;
      } else if (typeof fullSession.customer === "string") {
        email = await getCustomerEmail(fullSession.customer);
      } else if (
        fullSession.customer &&
        "email" in fullSession.customer
      ) {
        email = fullSession.customer.email || null;
      }

      console.log("CHECKOUT SESSION:", {
        sessionId: session.id,
        email,
        priceId,
        plan,
      });

      if (!email || !plan) {
        return NextResponse.json({
          received: true,
          warning: "Missing email or plan.",
          email,
          priceId,
          plan,
        });
      }

      const { error } = await supabaseAdmin.from("user_plans").upsert(
        {
          email,
          plan,
          access_active: true,
        },
        { onConflict: "email" }
      );

      if (error) {
        console.error("SUPABASE UPSERT ERROR:", error);
        throw error;
      }
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;

      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : null;

      const email = await getCustomerEmail(customerId);

      if (email) {
        const { error } = await supabaseAdmin
          .from("user_plans")
          .update({ access_active: true })
          .eq("email", email);

        if (error) {
          console.error("SUPABASE UPDATE ERROR:", error);
          throw error;
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : null;

      const email = await getCustomerEmail(customerId);

      if (email) {
        const { error } = await supabaseAdmin
          .from("user_plans")
          .update({
            plan: "basic",
            access_active: false,
          })
          .eq("email", email);

        if (error) {
          console.error("SUPABASE UPDATE ERROR:", error);
          throw error;
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error("WEBHOOK HANDLER ERROR:", error);

    return NextResponse.json(
      {
        error: "Webhook handler failed.",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "Stripe webhook endpoint is active. Use POST only." },
    { status: 405 }
  );
}