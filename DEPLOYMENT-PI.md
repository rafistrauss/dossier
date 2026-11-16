# Raspberry Pi deployment

Integration branch: `integration/pi-all-open-work`. It merges all three remote work branches, including PR #1. Conflicts with the original 1.9.2 salary snapshot retain the 1.14.0 port, which also supports FreeHire and experience filtering. `Dockerfile.local` is retained for history; this deployment uses the current production Dockerfile so migrations, PWA assets and Chromium match the application.

Run from `/home/pi/dossier`:

```sh
docker compose -p dossier -f compose.pi.yml up -d --build
docker compose -p dossier -f compose.pi.yml ps
docker compose -p dossier -f compose.pi.yml logs --tail=100
curl -f http://127.0.0.1:3080/api/health
```

The application is bound to loopback port 3080; Caddy provides HTTPS at `dossier.rafistrauss.com`. DNS should be a DNS-only CNAME to `rafistrauss.duckdns.org`, matching the other Pi services. Existing router forwards for ports 80 and 443 serve Caddy.

SQLite, nightly backups and exports persist in the Docker volume `dossier_data`. Do not remove that volume when upgrading. Secrets live in the ignored `.env` file. The generated sign-in password is stored in `/home/pi/.config/dossier/login-password` with owner-only access. To change it, pipe a new password to `docker run --rm -i dossier:pi-integration hash-password`, replace DOSSIER_PASSWORD in `.env`, and recreate the container. Preserve DOSSIER_SECRET because it encrypts saved keys.

AI provider and job-search settings can be configured after sign-in. No provider credentials are preconfigured.
