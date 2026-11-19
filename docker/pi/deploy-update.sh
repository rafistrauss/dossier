#!/usr/bin/env bash
set -euo pipefail

state="$HOME/.local/state/dossier-update"
branch=integration/pi-all-open-work
compose=(docker compose -p dossier -f compose.pi.yml -f docker/pi/compose.update.yml)

mkdir -p -- "$state"
exec 9>"$state.lock"
flock -n 9 || exit 0

write_status() {
  local file
  file=$(mktemp -- "$state/status.XXXXXXXX")
  printf '%s\n' "$1" > "$file"
  mv -fT -- "$file" "$state/status"
}

if [[ ! -d "$state/request" ]]; then
  if [[ ! -f "$state/status" ]]; then
    write_status ready
  fi
  exit 0
fi

result=failed
finish() {
  write_status "$result"
  rmdir -- "$state/request"
}
trap finish EXIT

if [[ $(git branch --show-current) != "$branch" || -n $(git status --porcelain) || -e $(git rev-parse --git-path MERGE_HEAD) ]]; then
  echo "Expected a clean $branch checkout without a merge in progress." >&2
  exit 1
fi

GIT_TERMINAL_PROMPT=0 git fetch --no-tags origin "refs/heads/$branch"
git -c merge.autoStash=false merge --ff-only FETCH_HEAD
"${compose[@]}" build app

# Use SQLite's online backup so committed WAL transactions are included.
"${compose[@]}" exec -T app node --disable-warning=ExperimentalWarning --input-type=module -e '
  import { mkdir } from "node:fs/promises";
  import { backup, DatabaseSync } from "node:sqlite";
  const directory = "/data/deployment-backups";
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const database = new DatabaseSync("/data/dossier.db", { readOnly: true });
  try {
    await backup(database, `${directory}/dossier-${new Date().toISOString()}.db`);
  } finally {
    database.close();
  }
'
"${compose[@]}" up -d --no-build --wait --wait-timeout 180 app
curl --fail --silent --show-error --max-time 10 http://127.0.0.1:3080/api/health
result=updated
