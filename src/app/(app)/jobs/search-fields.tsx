"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Country } from "@/lib/job-search/countries";
import { POSTED_WITHIN, RADII_KM, type JobSource, type RadiusKm, type SearchQuery } from "@/lib/job-search/search";
import { SOURCE_INFO, sourceCovers } from "@/lib/job-search/sources";

// A search's fields, as Find jobs asks them (E14-6) and Settings → Job agent
// saves its search (E16-7).

export type SearchFieldErrors = { keywords?: string; country?: string };

/** Why `source` can't search the country, in words, or undefined. */
export function uncoveredCountry(source: JobSource | null, query: SearchQuery, countries: readonly Country[]): string | undefined {
  if (!source || !query.country || sourceCovers(source, query.country)) return undefined;
  const name = countries.find((country) => country.code === query.country)?.name ?? query.country.toUpperCase();
  return `${SOURCE_INFO[source].name} doesn't list jobs in ${name}.`;
}

/** What, Where, Country, Within and Posted, for a grid; Remote only is RemoteOnlyField. */
export function SearchFields({
  value,
  onChange,
  source,
  countries,
  errors = {},
  onBlur,
}: {
  value: SearchQuery;
  onChange: (patch: Partial<SearchQuery>) => void;
  source: JobSource | null;
  countries: readonly Country[];
  errors?: SearchFieldErrors;
  /** For text fields that save once typing is done. */
  onBlur?: () => void;
}) {
  const uncovered = uncoveredCountry(source, value, countries);
  return (
    <>
      <Input
        label="What"
        className="sm:col-span-2 lg:col-span-1"
        value={value.keywords}
        placeholder="Job title, skill or company"
        error={errors.keywords}
        onChange={(event) => onChange({ keywords: event.target.value })}
        onBlur={onBlur}
      />
      <Input label="Where" value={value.place} placeholder="City or region" onChange={(event) => onChange({ place: event.target.value })} onBlur={onBlur} />
      <Select label="Country" value={value.country} error={errors.country ?? uncovered} onChange={(event) => onChange({ country: event.target.value })}>
        <option value="">Choose a country</option>
        {countries.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </Select>
      <Select
        label="Within"
        value={String(value.radiusKm)}
        disabled={!value.place.trim()}
        hint={value.place.trim() ? undefined : "Add a place first"}
        onChange={(event) => onChange({ radiusKm: Number(event.target.value) as RadiusKm })}
      >
        {RADII_KM.map((km) => (
          <option key={km} value={km}>
            {km} km
          </option>
        ))}
      </Select>
      <Select label="Posted" value={value.postedWithin} onChange={(event) => onChange({ postedWithin: event.target.value as SearchQuery["postedWithin"] })}>
        {POSTED_WITHIN.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <div className="col-span-full flex flex-col gap-4">
        <div className="grid max-w-lg grid-cols-2 gap-4">
          <Input label="Minimum annual salary" type="number" min={0} max={1_000_000_000} step="any"
            value={value.minimumSalary ?? ""} placeholder="Any salary"
            onChange={(event) => {
              const amount = event.target.valueAsNumber;
              onChange({ minimumSalary: Number.isFinite(amount) ? Math.min(1_000_000_000, Math.max(0, amount)) : undefined });
            }} onBlur={onBlur} />
          <Select label="Salary currency" value={value.salaryCurrency ?? "USD"} onChange={(event) => onChange({ salaryCurrency: event.target.value })}>
            {["USD", "EUR", "GBP", "CAD", "AUD", "CHF", "INR", "NZD", "BRL", "MXN", "PLN", "SGD", "ZAR"].map((currency) => <option key={currency} value={currency}>{currency}</option>)}
          </Select>
        </div>
        <div className="flex flex-wrap gap-4">
          <Checkbox label="Require salary data" checked={value.requireSalary ?? false} onChange={(event) => onChange({ requireSalary: event.target.checked })} />
          <Checkbox label="Exclude estimated salaries" checked={value.excludeEstimatedSalary ?? false} onChange={(event) => onChange({ excludeEstimatedSalary: event.target.checked })} />
        </div>
        <details className="text-label text-muted">
          <summary className="cursor-pointer">How salary matching works</summary>
          <p className="mt-2">Filters apply to each page as it loads. A minimum checks the lower end of the range in the selected currency; salaries without a numeric amount, currency or pay period are excluded. Hourly pay assumes 40 hours/week, weekly pay 52 weeks/year, daily pay 260 days/year, and monthly pay 12 months/year. No currency conversion. Estimates are excluded only when identified by the source.</p>
        </details>
      </div>
    </>
  );
}

/** "Remote only", with what it means on Adzuna, which has no such filter. */
export function RemoteOnlyField({ value, onChange, source }: { value: SearchQuery; onChange: (patch: Partial<SearchQuery>) => void; source: JobSource | null }) {
  return (
    <Checkbox
      label="Remote only"
      checked={value.remoteOnly}
      onChange={(event) => onChange({ remoteOnly: event.target.checked })}
      hint={source === "ADZUNA" && value.remoteOnly ? "Adzuna has no remote filter, so this adds “remote” to your search." : undefined}
    />
  );
}
