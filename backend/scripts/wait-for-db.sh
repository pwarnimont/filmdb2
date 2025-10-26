#!/usr/bin/env bash

set -euo pipefail

MAX_WAIT_SECONDS="${DB_MAX_WAIT_SECONDS:-60}"
SLEEP_SECONDS="${DB_POLL_INTERVAL_SECONDS:-3}"
ELAPSED=0

echo "Waiting for database to become available..."

until npx prisma migrate status --schema=prisma/schema.prisma > /dev/null 2>&1; do
  if (( ELAPSED >= MAX_WAIT_SECONDS )); then
    echo "Timed out after ${ELAPSED}s waiting for database. Giving up." >&2
    exit 1
  fi

  echo "Database not ready yet (waited ${ELAPSED}s). Retrying in ${SLEEP_SECONDS}s..."
  sleep "${SLEEP_SECONDS}"
  ELAPSED=$(( ELAPSED + SLEEP_SECONDS ))
done

echo "Database is ready. Continuing startup."
