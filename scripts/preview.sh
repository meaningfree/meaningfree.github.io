#!/usr/bin/env bash
# DotCity / site local preview for QA before release.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-8765}"
cd "$ROOT"
echo "Preview: http://127.0.0.1:${PORT}/simcity/"
echo "Site root: http://127.0.0.1:${PORT}/"
exec python3 -m http.server "$PORT" --bind 0.0.0.0
