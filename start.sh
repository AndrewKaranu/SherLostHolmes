#!/bin/bash
# SherLostHolmes - Complete Startup Script
# This script starts everything you need

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "🎰 SherLostHolmes - Starting Everything..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Kill any existing processes on ports 8000 and 3000
echo -e "${YELLOW}Clearing ports 8000 and 3000...${NC}"
lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

# Install backend dependencies if needed
echo -e "${YELLOW}Checking backend dependencies...${NC}"
cd "$ROOT/backend"
if ! python3 -c "import email_validator" 2>/dev/null; then
  echo "Installing email-validator..."
  pip3 install 'pydantic[email]' --user 2>/dev/null || echo "⚠ Could not install email-validator (may need manual install)"
fi

# Start Backend
echo -e "${GREEN}Starting Backend on port 8000...${NC}"
python3 -m uvicorn main:app --reload --port 8000 > /tmp/sherlost_backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "Waiting for backend to be ready..."
for i in {1..15}; do
  if curl -s http://127.0.0.1:8000/api/data > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running!${NC}"
    break
  fi
  sleep 1
done

# Seed test data
echo -e "${YELLOW}Seeding test data...${NC}"
cd "$ROOT/backend"
python3 seed_archived_item.py 2>&1 || echo -e "${RED}⚠ Seed script failed (might already exist)${NC}"

# Start Frontend
echo -e "${GREEN}Starting Frontend on port 3000...${NC}"
cd "$ROOT/frontend"

# Install frontend dependencies
echo -e "${YELLOW}Checking frontend dependencies...${NC}"
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/next" ]; then
  echo -e "${YELLOW}Installing frontend dependencies...${NC}"
  npm install
fi

npm run dev > /tmp/sherlost_frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend to start
echo "Waiting for frontend to be ready..."
for i in {1..30}; do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is running!${NC}"
    break
  fi
  sleep 1
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Everything is running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Backend:  http://127.0.0.1:8000"
echo "Frontend: http://localhost:3000"
echo "Slot Machine: http://localhost:3000/lucky-find"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "To stop servers:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Opening slot machine in browser..."
sleep 2

if command -v open &>/dev/null; then
  open "http://localhost:3000/lucky-find"
elif command -v xdg-open &>/dev/null; then
  xdg-open "http://localhost:3000/lucky-find"
else
  echo "Please open: http://localhost:3000/lucky-find"
fi

echo ""
echo "Logs:"
echo "  Backend:  tail -f /tmp/sherlost_backend.log"
echo "  Frontend: tail -f /tmp/sherlost_frontend.log"
