import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const PRICE_TO_PLAN: Record<string, "basic" | "pro" | "unlimited"> = {
  "price_1TQ0dM60gnc7J6cZDm2SGJId": "basic",
  "price_1TQ0e060gnc7J6cZZTUaENKt": "pro",
  "price_1TQ0eU60gnc7J6cZ1eKtargn": "unlimited",
};

function getStripeClient() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  return new Stripe(stripeSecretKey);
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function getCustomerEmail(
  stripe: Stripe,
  customerId: string | null | undefined
) {
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
  try {
    const stripe = getStripeClient();
    const supabaseAdmin = getSupabaseAdmin();

    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing Stripe signature." },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Missing STRIPE_WEBHOOK_SECRET." },
        { status: 500 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Webhook signature verification failed.";

      console.error("STRIPE SIGNATURE ERROR:", message);

      return NextResponse.json({ error: message }, { status: 400 });
    }

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
        email = await getCustomerEmail(stripe, fullSession.customer);
      } else if (fullSession.customer && "email" in fullSession.customer) {
        email = fullSession.customer.email || null;
      }

      const stripeCustomerId =
        typeof fullSession.customer === "string"
          ? fullSession.customer
          : fullSession.customer?.id || null;

      const stripeSubscriptionId =
        typeof fullSession.subscription === "string"
          ? fullSession.subscription
          : fullSession.subscription?.id || null;

      console.log("CHECKOUT SESSION:", {
        sessionId: session.id,
        email,
        priceId,
        plan,
        stripeCustomerId,
        stripeSubscriptionId,
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
          email: email.toLowerCase(),
          plan,
          access_active: true,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
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

      const email = await getCustomerEmail(stripe, customerId);

      if (email) {
        const { error } = await supabaseAdmin
          .from("user_plans")
          .update({ access_active: true })
          .eq("email", email.toLowerCase());

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

      const email = await getCustomerEmail(stripe, customerId);

      if (email) {
        const { error } = await supabaseAdmin
          .from("user_plans")
          .update({
            plan: "basic",
            access_active: false,
          })
          .eq("email", email.toLowerCase());

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