#!/usr/bin/env bash

set -euo pipefail

MAX_WAIT_SECONDS="${DB_MAX_WAIT_SECONDS:-60}"
SLEEP_SECONDS="${DB_POLL_INTERVAL_SECONDS:-3}"
ELAPSED=0

echo "Waiting for database to become available (probing TCP connection to DATABASE_URL)..."

check_db() {
  node <<'NODE'
const {URL} = require('url');
const net = require('net');

const rawUrl = process.env.DATABASE_URL;
let host = process.env.DB_HOST || 'db';
let port = Number(process.env.DB_PORT || 5432);

if (rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    host = parsed.hostname || host;
    port = Number(parsed.port) || port;
  } catch (err) {
    console.error(`Invalid DATABASE_URL: ${err.message}`);
    process.exit(1);
  }
} else {
  console.error('DATABASE_URL is not set; falling back to DB_HOST/DB_PORT');
}

const timeoutMs = Number(process.env.DB_CONNECT_TIMEOUT_MS || 1000);

const socket = net.createConnection({host, port}, () => {
  socket.end();
  process.exit(0);
});

socket.setTimeout(timeoutMs);
socket.on('timeout', () => {
  console.error(`Connection to ${host}:${port} timed out after ${timeoutMs}ms`);
  socket.destroy();
  process.exit(1);
});

socket.on('error', (err) => {
  const detail =
    err && (err.message || err.code) ? `${err.message ?? ''}${err.code ? ` (code ${err.code})` : ''}` : String(err);
  console.error(`Connection error: ${detail}`);
  process.exit(1);
});
NODE
}

until output=$(check_db 2>&1); do
  if (( ELAPSED >= MAX_WAIT_SECONDS )); then
    echo "Timed out after ${ELAPSED}s waiting for database. Giving up." >&2
    echo "Last error:"
    printf '%s\n' "$output" >&2
    exit 1
  fi

  echo "Database not ready yet (waited ${ELAPSED}s). Retrying in ${SLEEP_SECONDS}s..."
  printf 'Connection check error: %s\n' "$output"
  sleep "${SLEEP_SECONDS}"
  ELAPSED=$(( ELAPSED + SLEEP_SECONDS ))
done

echo "Database is ready. Continuing startup."
