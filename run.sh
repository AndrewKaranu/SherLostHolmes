#!/bin/bash
# SherLostHolmes – one script to run backend, frontend, seed archived item, and open the slot machine.
# Usage: ./run.sh   (or: bash run.sh)
# Requires: MongoDB running, MONGODB_URI in backend/.env

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "==> SherLostHolmes – starting backend & frontend, seeding, then opening slot machine..."
echo ""

# 1. Backend (background)
echo "==> Starting backend on :8000..."
(cd backend && python -m uvicorn main:app --port 8000) &
BACKEND_PID=$!

# 2. Frontend (background)
echo "==> Starting frontend on :3000..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

# 3. Wait for backend to be up, then seed archived item
echo "==> Waiting for backend..."
for i in $(seq 1 15); do
  curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/ 2>/dev/null | grep -q 200 && break
  sleep 1
done
echo "==> Seeding archived test item..."
(cd backend && python seed_archived_item.py 2>/dev/null) || true

# 4. Wait for frontend to be up
echo "==> Waiting for frontend..."
for i in $(seq 1 30); do
  curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q 200 && break
  sleep 1
done

# 5. Open slot machine in browser
echo ""
echo "==> Opening http://localhost:3000/lucky-find ..."
if command -v open &>/dev/null; then
  open "http://localhost:3000/lucky-find"
elif command -v xdg-open &>/dev/null; then
  xdg-open "http://localhost:3000/lucky-find"
else
  echo "Open manually: http://localhost:3000/lucky-find"
fi

echo ""
echo "==> Done. Backend PID $BACKEND_PID, Frontend PID $FRONTEND_PID"
echo "    Stop with: kill $BACKEND_PID $FRONTEND_PID"
echo "    Slot machine: http://localhost:3000/lucky-find — click INVESTIGATE to spin."
wait
