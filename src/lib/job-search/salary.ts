import type { FoundPosting, SearchQuery } from "./search";

/** Explicit provider amounts only: never guess a currency or period from free text. */
export function salaryData(minimum: number | null | undefined, currency: string | null | undefined, period: string | null | undefined, estimated: boolean | null = null): NonNullable<FoundPosting["salaryData"]> {
  // Full-time equivalents, not a promise of actual hours worked.
  const multiplier: Record<string, number> = { YEAR: 1, ANNUAL: 1, ANNUALLY: 1, YEARLY: 1, MONTH: 12, MONTHLY: 12, WEEK: 52, WEEKLY: 52, DAY: 260, DAILY: 260, HOUR: 2080, HOURLY: 2080 };
  const factor = multiplier[period?.trim().toUpperCase() ?? ""];
  const annual = minimum && minimum > 0 && factor ? minimum * factor : null;
  return { minimumAnnual: annual && Number.isFinite(annual) ? annual : null, currency: currency?.trim().toUpperCase() ?? "", estimated };
}

export function matchesSalary(posting: FoundPosting, query: SearchQuery): boolean {
  const data = posting.salaryData;
  if (query.excludeEstimatedSalary && (data?.estimated === true || /\bestimated\b/i.test(posting.salary))) return false;
  if (query.requireSalary && !posting.salary.trim() && data?.minimumAnnual == null) return false;
  if (!query.minimumSalary) return true;
  // A maximum alone cannot establish that the lower end meets the user's minimum.
  return data?.minimumAnnual != null && data.currency === (query.salaryCurrency ?? "USD") && data.minimumAnnual >= query.minimumSalary;
}
