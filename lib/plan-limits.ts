export type UserPlan = "basic" | "pro" | "unlimited";

export function normalizePlan(plan: string | null | undefined): UserPlan {
  if (plan === "pro") return "pro";
  if (plan === "unlimited") return "unlimited";
  return "basic";
}

export function getDailyLimit(plan: UserPlan, accessActive: boolean): number {
  if (plan === "basic" && !accessActive) return 5; // VISITOR
  if (plan === "basic" && accessActive) return 10; // BASIC платен
  if (plan === "pro") return 20;
  if (plan === "unlimited") return Number.MAX_SAFE_INTEGER;

  return 5;
}