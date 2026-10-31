#!/usr/bin/env bash
# Copy the shared design system + data into each app repo (source of truth: ./shared)
set -e
cd "$(dirname "$0")"
for r in student-hm technician-hm supervisor-hm; do
  rm -rf "$r/src/ds" "$r/src/data" "$r/src/fig"
  cp -r shared/src/ds shared/src/data shared/src/fig "$r/src/"
  cp shared/src/index.css "$r/src/index.css"
  cp shared/tailwind.config.js "$r/tailwind.config.js"
done
echo synced
