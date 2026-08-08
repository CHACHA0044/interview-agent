#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-${BACKEND_PORT:-8000}}"
AI_PORT="${AI_PORT:-8002}"
AGENT_PORT="${AGENT_PORT:-8001}"

echo "================================================================"
echo "Starting Single-Container Backend (Render / Local)"
echo "  Gateway:          0.0.0.0:${PORT}"
echo "  Interview Agent:  127.0.0.1:${AGENT_PORT}"
echo "  AI Intelligence:  127.0.0.1:${AI_PORT}"
echo "================================================================"

AI_PID=""
AGENT_PID=""

cleanup() {
    echo "Shutting down internal services..."
    if [ -n "${AI_PID}" ] && kill -0 "${AI_PID}" 2>/dev/null; then
        kill -TERM "${AI_PID}" 2>/dev/null || true
    fi
    if [ -n "${AGENT_PID}" ] && kill -0 "${AGENT_PID}" 2>/dev/null; then
        kill -TERM "${AGENT_PID}" 2>/dev/null || true
    fi
    wait 2>/dev/null || true
}
trap cleanup SIGTERM SIGINT EXIT

export PYTHONPATH="/app/shared:/app/services/ai-intelligence:/app/services/interview-agent:/app/services/gateway:${PYTHONPATH:-}"

# 1. Start AI Intelligence service on 127.0.0.1:8002
echo "Launching AI Intelligence service..."
(cd /app/services/ai-intelligence && python -m uvicorn app.main:app --host 127.0.0.1 --port "${AI_PORT}") &
AI_PID=$!

# 2. Start Interview Agent service on 127.0.0.1:8001
echo "Launching Interview Agent service..."
(cd /app/services/interview-agent && python -m uvicorn app.main:app --host 127.0.0.1 --port "${AGENT_PORT}") &
AGENT_PID=$!

wait_for_health() {
    local name="$1"
    local url="$2"
    local max_attempts=30
    local attempt=1

    echo "Waiting for ${name} liveness at ${url}..."
    while [ $attempt -le $max_attempts ]; do
        if python -c "import urllib.request; urllib.request.urlopen('${url}')" >/dev/null 2>&1; then
            echo "  ✓ ${name} is ready!"
            return 0
        fi

        if ! kill -0 "${AI_PID}" 2>/dev/null; then
            echo "ERROR: AI Intelligence process terminated unexpectedly!"
            exit 1
        fi
        if ! kill -0 "${AGENT_PID}" 2>/dev/null; then
            echo "ERROR: Interview Agent process terminated unexpectedly!"
            exit 1
        fi

        sleep 1
        attempt=$((attempt + 1))
    done

    echo "ERROR: ${name} failed to respond at ${url} within ${max_attempts} seconds."
    exit 1
}

wait_for_health "AI Intelligence" "http://127.0.0.1:${AI_PORT}/health"
wait_for_health "Interview Agent" "http://127.0.0.1:${AGENT_PORT}/health"

# 3. Start Gateway service on 0.0.0.0:$PORT
echo "Launching Gateway service on 0.0.0.0:${PORT}..."
cd /app/services/gateway
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT}"
