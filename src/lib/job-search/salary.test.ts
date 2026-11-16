import { describe, expect, it } from "vitest";
import { EMPTY_QUERY, foundPostingSchema, queryFromParams, searchHref, searchQuerySchema } from "./search";
import { matchesSalary, salaryData } from "./salary";

const posting = foundPostingSchema.parse({ source: "JSEARCH", externalId: "salary-test", title: "Engineer", company: "Example", place: "", remote: true, salary: "USD 120,000–180,000 a year", postedAt: null, url: "", via: "", description: "", complete: true });
const query = { ...EMPTY_QUERY, keywords: "engineer", minimumSalary: 120000, salaryCurrency: "USD" };

describe("salary filters", () => {
  it("uses the lower end, includes an exact match, and does not convert currencies", () => {
    expect(matchesSalary({ ...posting, salaryData: salaryData(120000, "USD", "YEAR") }, query)).toBe(true);
    expect(matchesSalary({ ...posting, salaryData: salaryData(119999, "USD", "YEAR") }, query)).toBe(false);
    expect(matchesSalary({ ...posting, salaryData: salaryData(150000, "EUR", "YEAR") }, query)).toBe(false);
  });
  it("annualizes explicitly stated periods with full-time assumptions", () => {
    for (const [amount, period] of [[60, "HOUR"], [500, "DAY"], [2500, "WEEK"], [11000, "MONTH"]] as const) {
      expect(matchesSalary({ ...posting, salaryData: salaryData(amount, "usd", period) }, query)).toBe(true);
    }
    expect(salaryData(60, "USD", "HOUR").minimumAnnual).toBe(124800);
  });
  it("does not invent a minimum, period, or currency when the source omits it", () => {
    for (const data of [undefined, salaryData(null, "USD", "YEAR"), salaryData(200000, "USD", null), salaryData(200000, null, "YEAR")]) {
      expect(matchesSalary({ ...posting, salaryData: data }, query)).toBe(false);
    }
    expect(matchesSalary(posting, EMPTY_QUERY)).toBe(true);
  });
  it("can independently require salary data and exclude identified estimates", () => {
    expect(matchesSalary({ ...posting, salary: "" }, { ...EMPTY_QUERY, requireSalary: true })).toBe(false);
    expect(matchesSalary(posting, { ...EMPTY_QUERY, requireSalary: true })).toBe(true);
    expect(matchesSalary({ ...posting, salaryData: salaryData(150000, "USD", "YEAR", true) }, { ...query, excludeEstimatedSalary: true })).toBe(false);
    expect(matchesSalary({ ...posting, salary: "USD 150,000 a year (estimated)" }, { ...EMPTY_QUERY, excludeEstimatedSalary: true })).toBe(false);
    expect(matchesSalary(posting, { ...EMPTY_QUERY, excludeEstimatedSalary: true })).toBe(true);
  });
  it("round-trips all filters and keeps old stored searches valid", () => {
    const filtered = { ...query, requireSalary: true, excludeEstimatedSalary: true };
    expect(queryFromParams(Object.fromEntries(new URL(searchHref(filtered), "http://localhost").searchParams))).toEqual(filtered);
    expect(searchQuerySchema.parse(EMPTY_QUERY)).toEqual(EMPTY_QUERY);
    expect(searchQuerySchema.safeParse({ ...query, minimumSalary: -1 }).success).toBe(false);
    expect(searchQuerySchema.safeParse({ ...query, minimumSalary: Infinity }).success).toBe(false);
  });
});
