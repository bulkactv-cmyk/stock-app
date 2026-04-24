import { createClient } from "./supabase/server";
import {
  getDailyLimit,
  normalizePlan,
  type UserPlan,
} from "./plan-limits";

type UsageLimitResult = {
  allowed: boolean;
  plan: UserPlan;
  accessActive: boolean;
  dailyLimit: number;
  usedToday: number;
  remainingToday: number;
};

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function checkUsageLimit(
  email: string
): Promise<UsageLimitResult> {
  const supabase = await createClient();

  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    throw new Error("Липсва имейл на потребителя.");
  }

  const { data: planData, error: planError } = await supabase
    .from("user_plans")
    .select("plan, access_active")
    .eq("email", cleanEmail)
    .maybeSingle();

  if (planError) {
    throw new Error("Не успях да заредя плана на потребителя.");
  }

  let currentPlan = normalizePlan(planData?.plan);
  const accessActive = planData?.access_active === true;

  if ((currentPlan === "pro" || currentPlan === "unlimited") && !accessActive) {
    currentPlan = "basic";
  }

  const today = getTodayDate();

  const { data: usageData, error: usageError } = await supabase
    .from("daily_usage")
    .select("analyses_used")
    .eq("email", cleanEmail)
    .eq("usage_date", today)
    .maybeSingle();

  if (usageError) {
    throw new Error("Не успях да заредя дневната употреба.");
  }

  const usedToday = usageData?.analyses_used ?? 0;
  const dailyLimit = getDailyLimit(currentPlan, accessActive);

  const remainingToday =
    dailyLimit === Infinity ? Infinity : Math.max(dailyLimit - usedToday, 0);

  return {
    allowed: remainingToday > 0,
    plan: currentPlan,
    accessActive,
    dailyLimit,
    usedToday,
    remainingToday,
  };
}

export async function incrementUsage(email: string): Promise<number> {
  const supabase = await createClient();

  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    throw new Error("Липсва имейл на потребителя.");
  }

  const today = getTodayDate();

  const { data: existingRow, error: readError } = await supabase
    .from("daily_usage")
    .select("id, analyses_used")
    .eq("email", cleanEmail)
    .eq("usage_date", today)
    .maybeSingle();

  if (readError) {
    throw new Error("Не успях да прочета дневната употреба.");
  }

  if (!existingRow) {
    const { error: insertError } = await supabase.from("daily_usage").insert({
      email: cleanEmail,
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