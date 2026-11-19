"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Country } from "@/lib/job-search/countries";
import { EXPERIENCE_LEVELS, POSTED_WITHIN, RADII_KM, type JobSource, type RadiusKm, type SearchQuery } from "@/lib/job-search/search";
import { portalNames, sourceCovers, sourceInfo } from "@/lib/job-search/sources";

// A search's fields, as Find jobs asks them (E14-6) and Settings → Job agent
// saves its search (E16-7).

export type SearchFieldErrors = { keywords?: string; country?: string };

/**
 * The country against the portals switched on (#517): an `error` when none
 * of them lists jobs there, else a `note` naming those that don't, since a
 * search asks all of them.
 */
export function countryCoverage(sources: readonly JobSource[], query: SearchQuery, countries: readonly Country[]): { error?: string; note?: string } {
  const missing = query.country ? sources.filter((source) => !sourceCovers(source, query.country)) : [];
  if (missing.length === 0) return {};
  const name = countries.find((country) => country.code === query.country)?.name ?? query.country.toUpperCase();
  if (missing.length === sources.length) return { error: sources.length === 1 ? `${portalNames(sources)} doesn't list jobs in ${name}.` : `None of your portals lists jobs in ${name}.` };
  return { note: `${portalNames(missing)} ${missing.length === 1 ? "doesn't" : "don't"} list jobs in ${name}.` };
}

/**
 * The distance against the portals switched on (#517): off only when none
 * of them takes one, else a note naming those that ignore it.
 */
function distanceSupport(sources: readonly JobSource[]): { off: boolean; note?: string } {
  const without = sources.filter((source) => !sourceInfo(source).radius);
  if (without.length === 0) return { off: false };
  if (without.length === sources.length) return { off: true, note: sources.length === 1 ? `${portalNames(sources)} has no distance filter` : "None of your portals has a distance filter" };
  return { off: false, note: `${portalNames(without)} ${without.length === 1 ? "ignores" : "ignore"} the distance` };
}

/** What, Where, Country, Within, Posted and Level, for a grid; Remote only is RemoteOnlyField. */
export function SearchFields({
  value,
  onChange,
  sources,
  countries,
  errors = {},
  onBlur,
}: {
  value: SearchQuery;
  onChange: (patch: Partial<SearchQuery>) => void;
  /** The portals switched on: a search asks all of them. */
  sources: readonly JobSource[];
  countries: readonly Country[];
  errors?: SearchFieldErrors;
  /** For text fields that save once typing is done. */
  onBlur?: () => void;
}) {
  const coverage = countryCoverage(sources, value, countries);
  const distance = distanceSupport(sources);
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
      <Select label="Country" value={value.country} hint={coverage.note} error={errors.country ?? coverage.error} onChange={(event) => onChange({ country: event.target.value })}>
        <option value="">Choose a country</option>
        {countries.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </Select>
      <Select
        label="Within"
        value={value.radiusKm === null ? "any" : String(value.radiusKm)}
        disabled={distance.off || !value.place.trim()}
        hint={distance.off ? distance.note : value.place.trim() ? distance.note : "Add a place first"}
        onChange={(event) => onChange({ radiusKm: event.target.value === "any" ? null : (Number(event.target.value) as RadiusKm) })}
      >
        {RADII_KM.map((km) => (
          <option key={km} value={km}>
            {km} km
          </option>
        ))}
        {/* No radius sent at all: for a portal where one breaks the search (public #138). */}
        <option value="any">Any distance</option>
      </Select>
      <Select label="Posted" value={value.postedWithin} onChange={(event) => onChange({ postedWithin: event.target.value as SearchQuery["postedWithin"] })}>
        {POSTED_WITHIN.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <Select
        label="Level"
        hint="Read from each posting's title and the years it asks for"
        value={value.experience ?? "any"}
        // A new lowest level starts as the only one; "Up to" widens it.
        onChange={(event) => onChange({ experience: event.target.value as SearchQuery["experience"], experienceTo: undefined })}
      >
        {EXPERIENCE_LEVELS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      {value.experience && value.experience !== "any" && (
        <Select
          label="Up to"
          hint="For a range, such as Senior to Lead or director"
          value={value.experienceTo ?? value.experience}
          onChange={(event) => onChange({ experienceTo: event.target.value === value.experience ? undefined : (event.target.value as SearchQuery["experienceTo"]) })}
        >
          {EXPERIENCE_LEVELS.slice(EXPERIENCE_LEVELS.findIndex((option) => option.value === value.experience)).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      )}
      <div className="col-span-full flex flex-col gap-4">
        <div className="grid max-w-lg grid-cols-1 sm:grid-cols-2 gap-4">
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
export function RemoteOnlyField({ value, onChange, sources }: { value: SearchQuery; onChange: (patch: Partial<SearchQuery>) => void; sources: readonly JobSource[] }) {
  return (
    <Checkbox
      label="Remote only"
      checked={value.remoteOnly}
      onChange={(event) => onChange({ remoteOnly: event.target.checked })}
      hint={sources.includes("ADZUNA") && value.remoteOnly ? "Adzuna has no remote filter, so this adds “remote” to your search." : undefined}
    />
  );
}
