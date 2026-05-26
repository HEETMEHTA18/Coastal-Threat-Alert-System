#!/usr/bin/env bash
# 🌊 Coastal Guardian Combined Services Runner
# Starts AI models, Node.js Backend, and React Frontend concurrently.

set -euo pipefail

# ANSI color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
# Conditionally prepend .tooling node binary path if it exists, otherwise fall back to system node
if [ -d "$ROOT_DIR/.tooling/node-official-20.19.0/node-v20.19.0-linux-x64/bin" ]; then
  export PATH="$ROOT_DIR/.tooling/node-official-20.19.0/node-v20.19.0-linux-x64/bin:$PATH"
fi


echo -e "${YELLOW}🌊 Coastal Guardian Services Launcher${NC}"
echo -e "📍 Root Directory: ${CYAN}${ROOT_DIR}${NC}"
echo -e "📍 Node.js Version: ${CYAN}$(node -v)${NC}"
echo -e "📍 Python Version: ${CYAN}$("$ROOT_DIR/.venv/bin/python" --version 2>/dev/null || python3 --version)${NC}"
echo ""

# Ports check and cleanup
cleanup_ports() {
  for port in 8000 3001 5173; do
    if lsof -i :$port -t >/dev/null; then
      echo -e "${YELLOW}⚠️  Port $port is already in use. Cleaning up...${NC}"
      fuser -k $port/tcp 2>/dev/null || true
      sleep 0.5
    fi
  done
}

cleanup_ports

# Process tracking variables
AI_PID=""
BACKEND_PID=""
FRONTEND_PID=""

# Cleanup handler on exit
cleanup() {
  echo -e "\n\n${RED}🛑 Stopping all services...${NC}"
  
  if [ -n "$AI_PID" ]; then
    kill "$AI_PID" 2>/dev/null || true
  fi
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi

  wait 2>/dev/null || true
  
  # Final port release check
  fuser -k 8000/tcp 2>/dev/null || true
  fuser -k 3001/tcp 2>/dev/null || true
  fuser -k 5173/tcp 2>/dev/null || true
  
  echo -e "${GREEN}✓ All services stopped successfully.${NC}"
}
trap cleanup EXIT INT TERM

# Start AI Models Service (FastAPI or Mock)
echo -e "${GREEN}🚀 Starting AI Models Service on port 8000...${NC}"
cd "$ROOT_DIR/ai-models"
if [ -x "$ROOT_DIR/.venv/bin/uvicorn" ]; then
  echo -e "${GREEN}✓ Found virtualenv uvicorn. Starting real FastAPI server...${NC}"
  # Run the real FastAPI server
  stdbuf -oL -eL "$ROOT_DIR/.venv/bin/uvicorn" api.main:app --host 0.0.0.0 --port 8000 2>&1 | sed -u -e "s/^/${GREEN}[AI]${NC} /" &
  AI_PID=$!
else
  echo -e "${YELLOW}⚠️  Uvicorn not found in .venv. Falling back to mock_server.py...${NC}"
  stdbuf -oL -eL "$ROOT_DIR/.venv/bin/python" mock_server.py 2>&1 | sed -u -e "s/^/${GREEN}[AI]${NC} /" &
  AI_PID=$!
fi

sleep 1.5

# Start Backend Service (Node.js/Express)
echo -e "${BLUE}🚀 Starting Backend Service on port 3001...${NC}"
cd "$ROOT_DIR/backend"
# Run backend with nodemon
stdbuf -oL -eL npm run dev 2>&1 | sed -u -e "s/^/${BLUE}[Backend]${NC} /" &
BACKEND_PID=$!

sleep 1.5

# Start Frontend Service (Vite/React)
echo -e "${CYAN}🚀 Starting Frontend Service on port 5173...${NC}"
cd "$ROOT_DIR/frontend"
# Run frontend dev server
stdbuf -oL -eL npm run dev 2>&1 | sed -u -e "s/^/${CYAN}[Frontend]${NC} /" &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}✨ All services are running! Press Ctrl+C to terminate all services together.${NC}"
echo -e "💻 Frontend:    ${CYAN}http://localhost:5173${NC}"
echo -e "🔌 Node API:    ${CYAN}http://localhost:3001/api${NC}"
echo -e "🤖 AI Models:   ${CYAN}http://localhost:8000/health${NC}"
echo ""

# Keep script running to maintain processes
wait
