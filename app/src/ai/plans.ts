// Price helpers for the Premium plans (shown on the Premium screen and the home banner).
import type { Plan } from './api';

export const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/** How much cheaper a plan is per month than the monthly plan, in whole percent (0 when not cheaper). */
export function savingPercent(plan: Plan, plans: Plan[]): number {
  const monthly = plans.find((p) => p.months === 1);
  if (!monthly || plan.months <= 1) return 0;
  return Math.max(Math.round((1 - plan.priceInr / (monthly.priceInr * plan.months)) * 100), 0);
}

/** The plan to mark "Best value": the one with the biggest saving (none when no plan saves). */
export function bestValuePlan(plans: Plan[]): Plan | undefined {
  const best = [...plans].sort((a, b) => savingPercent(b, plans) - savingPercent(a, plans))[0];
  return best && savingPercent(best, plans) > 0 ? best : undefined;
}

/** The lowest price per month among the plans, e.g. "₹125". */
export function lowestMonthly(plans: Plan[]): string | null {
  if (plans.length === 0) return null;
  return rupees(Math.min(...plans.map((p) => p.priceInr / p.months)));
}
