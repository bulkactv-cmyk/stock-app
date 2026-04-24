import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

type PlanType = "basic" | "pro" | "unlimited";

async function getCurrentUserPlan(
  supabase: Awaited<ReturnType<typeof createClient>>,
  email: string
) {
  const { data: planData } = await supabase
    .from("user_plans")
    .select("plan, access_active")
    .eq("email", email)
    .single();

  let currentPlan = String(planData?.plan || "basic") as PlanType;
  const accessActive = planData?.access_active === true;

  if ((currentPlan === "pro" || currentPlan === "unlimited") && !accessActive) {
    currentPlan = "basic";
  }

  return currentPlan;
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const currentPlan = await getCurrentUserPlan(supabase, user.email);

  if (currentPlan === "basic") {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("email", user.email)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const currentPlan = await getCurrentUserPlan(supabase, user.email);

  if (currentPlan === "basic") {
    return NextResponse.json(
      { error: "Alerts са налични само за PRO и Unlimited план." },
      { status: 403 }
    );
  }

  const body = await req.json();

  const symbol =
    typeof body?.symbol === "string" ? body.symbol.trim().toUpperCase() : "";

  const assetType = body?.assetType === "crypto" ? "crypto" : "stock";
  const conditionType = body?.conditionType === "below" ? "below" : "above";
  const targetPrice = Number(body?.targetPrice);

  if (!symbol) {
    return NextResponse.json({ error: "Липсва символ." }, { status: 400 });
  }

  if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
    return NextResponse.json({ error: "Невалидна цена." }, { status: 400 });
  }

  const { error } = await supabase.from("alerts").insert({
    email: user.email,
    symbol,
    asset_type: assetType,
    condition_type: conditionType,
    target_price: targetPrice,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const currentPlan = await getCurrentUserPlan(supabase, user.email);

  if (currentPlan === "basic") {
    return NextResponse.json(
      { error: "Alerts са налични само за PRO и Unlimited план." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const id = typeof body?.id === "string" ? body.id : "";

  if (!id) {
    return NextResponse.json({ error: "Липсва id." }, { status: 400 });
  }

  const { error } = await supabase
    .from("alerts")
    .delete()
    .eq("email", user.email)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}