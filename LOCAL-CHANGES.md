# Local salary filters

Adds minimum annual salary, salary currency, require salary data, and exclude identified estimates to Find jobs and the shared Job agent search fields. Search history and pagination preserve these filters. Existing searches remain readable without a database migration.

Minimum salary checks the lower bound supplied by JSearch, Adzuna, or FreeHire, in the selected currency. Explicit hourly/daily/weekly/monthly amounts are annualized using 2080 hours, 260 days, 52 weeks, or 12 months. Unknown periods, currencies, lower bounds, and text-only amounts do not qualify for a minimum. No exchange-rate conversion is attempted. Arbeitsagentur does not identify a pay period in the current adapter, so its salaries do not qualify for a minimum. Requiring salary data without setting a minimum also accepts displayed text salaries.

Filters apply to each retrieved page on the server. A page can have no matches while Show more still retrieves the next page. Estimates are excluded only when the provider identifies them or labels them estimated.

This branch uses the 1.14.0 Dockerfile, which includes the PWA assets. When upgrading an existing 1.9.2 database, record your agent salary filters before upgrading and re-enter them in Settings → Job agent → Searches. The upstream migration copies the original search fields into My search.
