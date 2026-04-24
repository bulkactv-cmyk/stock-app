export type UserPlan = "basic" | "pro" | "unlimited";

/**
 * Нормализира план от база/вход
 */
export function normalizePlan(plan: string | null | undefined): UserPlan {
  if (!plan) return "basic";

  const p = plan.toLowerCase().trim();

  if (p === "pro") return "pro";
  if (p === "unlimited") return "unlimited";

  return "basic";
}

/**
 * Връща дневен лимит според план и активен достъп
 */
export function getDailyLimit(
  plan: UserPlan,
  accessActive: boolean
): number {
  // ❗ Няма активен абонамент → visitor режим
  if (!accessActive) {
    return 5;
  }

  // ✅ Активни платени планове
  switch (plan) {
    case "basic":
      return 10;

    case "pro":
      return 20;

    case "unlimited":
      return Infinity; // по-добре от MAX_SAFE_INTEGER

    default:
      return 5;
  }
}