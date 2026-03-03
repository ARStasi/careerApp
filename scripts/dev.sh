#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required but was not found in PATH."
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Error: node is required but was not found in PATH."
  exit 1
fi

if ! node -e "const [maj,min]=process.versions.node.split('.').map(Number); process.exit((maj===20&&min>=19)|| (maj===22&&min>=12)?0:1)" >/dev/null 2>&1; then
  echo "Error: Node.js 20.19+ or 22.12+ is required for Vite."
  echo "Current version: $(node -p 'process.versions.node')"
  exit 1
fi

if [[ -x "$BACKEND_DIR/.venv/bin/python" ]]; then
  BACKEND_PYTHON="$BACKEND_DIR/.venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
  BACKEND_PYTHON="python3"
else
  echo "Error: python3 is required but was not found in PATH."
  exit 1
fi

if ! "$BACKEND_PYTHON" -c "import uvicorn" >/dev/null 2>&1; then
  echo "Error: Python package 'uvicorn' is not installed for $BACKEND_PYTHON."
  echo "Install backend dependencies with: pip install -r backend/requirements.txt"
  exit 1
fi

cleanup() {
  kill "${BACKEND_PID:-}" "${FRONTEND_PID:-}" 2>/dev/null || true
  wait "${BACKEND_PID:-}" "${FRONTEND_PID:-}" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

echo "Starting backend on http://localhost:8000 ..."
(
  cd "$BACKEND_DIR"
  exec "$BACKEND_PYTHON" -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
) &
BACKEND_PID=$!

echo "Starting frontend on http://localhost:5173 ..."
(
  cd "$FRONTEND_DIR"
  exec npm run dev -- --host 127.0.0.1 --port 5173
) &
FRONTEND_PID=$!

while true; do
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    wait "$BACKEND_PID"
    break
  fi

  if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    wait "$FRONTEND_PID"
    break
  fi

  sleep 1
done
