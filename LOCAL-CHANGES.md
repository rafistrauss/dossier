# Local salary filters

Adds minimum annual salary, salary currency, require salary data, and exclude identified estimates to Find jobs and the shared Job agent search fields. Search history and pagination preserve these filters. Existing searches remain readable without a database migration.

Minimum salary checks the lower bound supplied by JSearch or Adzuna, in the selected currency. Explicit hourly/daily/weekly/monthly amounts are annualized using 2080 hours, 260 days, 52 weeks, or 12 months. Unknown periods, currencies, lower bounds, and text-only amounts do not qualify for a minimum. No exchange-rate conversion is attempted. Arbeitsagentur does not identify a pay period in the current adapter, so its salaries do not qualify for a minimum. Requiring salary data without setting a minimum also accepts displayed text salaries.

Filters apply to each retrieved page on the server. A page can have no matches while Show more still retrieves the next page. Estimates are excluded only when the provider identifies them or labels them estimated.

Build from the parent folder with `docker compose build app`. The override selects `dossier:local-salary` and prevents pulling a replacement image. `Dockerfile.local` pins the upstream runtime and reuses its Chromium and migration tools. The build runs job-search unit tests, jobs/agent UI tests, lint on changed implementation files, and the production build/type checks before producing the runtime image.

Local changes must be carried forward explicitly when upgrading upstream Dossier. Keep the original production image and the database backup in the parent folder for rollback.
