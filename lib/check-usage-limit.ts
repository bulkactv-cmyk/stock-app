import { createClient } from "./supabase/server";

type PlanName = "basic" | "pro" | "unlimited";

type UsageLimitResult = {
  allowed: boolean;
  plan: PlanName;
  accessActive: boolean;
  dailyLimit: number;
  usedToday: number;
  remainingToday: number;
};

function getDailyLimit(plan: PlanName, accessActive: boolean) {
  if (plan === "unlimited") return 999999;
  if (plan === "pro") return 20;

  // basic
  if (accessActive) return 10;

  // visitor
  return 5;
}

export async function checkUsageLimit(email: string): Promise<UsageLimitResult> {
  const supabase = await createClient();

  const { data: planData, error: planError } = await supabase
    .from("user_plans")
    .select("plan, access_active")
    .eq("email", email)
    .single();

  if (planError || !planData) {
    throw new Error("Не успях да заредя плана на потребителя.");
  }

  let currentPlan = String(planData.plan || "basic").toLowerCase() as PlanName;
  const accessActive = planData.access_active === true;

  if (currentPlan !== "basic" && currentPlan !== "pro" && currentPlan !== "unlimited") {
    currentPlan = "basic";
  }

  if ((currentPlan === "pro" || currentPlan === "unlimited") && !accessActive) {
    currentPlan = "basic";
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data: usageData, error: usageError } = await supabase
    .from("daily_usage")
    .select("analyses_used")
    .eq("email", email)
    .eq("usage_date", today)
    .maybeSingle();

  if (usageError) {
    throw new Error("Не успях да заредя дневната употреба.");
  }

  const usedToday = usageData?.analyses_used ?? 0;
  const dailyLimit = getDailyLimit(currentPlan, accessActive);
  const remainingToday = Math.max(dailyLimit - usedToday, 0);

  return {
    allowed: remainingToday > 0,
    plan: currentPlan,
    accessActive,
    dailyLimit,
    usedToday,
    remainingToday,
  };
}

export async function incrementUsage(email: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: existingRow, error: readError } = await supabase
    .from("daily_usage")
    .select("id, analyses_used")
    .eq("email", email)
    .eq("usage_date", today)
    .maybeSingle();

  if (readError) {
    throw new Error("Не успях да прочета дневната употреба.");
  }

  if (!existingRow) {
    const { error: insertError } = await supabase.from("daily_usage").insert({
      email,
      usage_date: today,
      analyses_used: 1,
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    return 1;
  }

  const newValue = (existingRow.analyses_used ?? 0) + 1;

  const { error: updateError } = await supabase
    .from("daily_usage")
    .update({
      analyses_used: newValue,
    })
    .eq("id", existingRow.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return newValue;
}