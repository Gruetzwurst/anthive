#!/usr/bin/env bash
set -e
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
exec npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
