#!/bin/bash
DIR="/home/user/cable-scanner-pwa"
PORT=5173
LOG_FILE="/tmp/vite.log"

echo "🔄 [1/3] Cleaning up any existing server process on port $PORT..."
fuser -k ${PORT}/tcp 2>/dev/null || pkill -f "vite dev" 2>/dev/null || true
sleep 1

echo "🚀 [2/3] Launching Cable Scanner PWA server..."
cd "$DIR"
nohup npx vite dev --host 0.0.0.0 --port $PORT > "$LOG_FILE" 2>&1 &

echo "⏳ [3/3] Waiting for server web port..."
SUCCESS=0
for i in $(seq 1 10); do
  sleep 1
  if curl -sk -m 2 "http://localhost:${PORT}/" >/dev/null 2>&1; then
    SUCCESS=1
    break
  fi
done

if [ $SUCCESS -eq 1 ]; then
  echo ""
  echo "=================================================="
  echo "✅ Cable Scanner PWA is LIVE & RUNNING!"
  echo "=================================================="
  echo "🌐 Access URL: http://192.168.0.9:${PORT}"
  echo "⚡ Server is responsive. Triggering FNT sync in background..."
  echo "=================================================="
  # Trigger FNT indexing in background asynchronously
  curl -sk "http://localhost:${PORT}/api/public/health" >/dev/null 2>&1 &
  exit 0
else
  echo "⚠️ Server failed to start on port $PORT. Check log: $LOG_FILE"
  tail -n 15 "$LOG_FILE"
  exit 1
fi
