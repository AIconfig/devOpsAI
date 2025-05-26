#!/bin/bash

# Full service startup script for DevOps AI Platform
# This script starts both frontend and backend services

# Set base directory
BASE_DIR="/home/server/Bogdan/devOpsAI"
FRONTEND_DIR="$BASE_DIR/fronAnd"
BACKEND_DIR="$BASE_DIR/backAnd"
PID_FILE="/var/run/devopsai.pid"

echo "====================================================="
echo "= DevOps AI Platform - Starting Services            ="
echo "====================================================="
echo "$(date)"

# Create a PID file for the service
echo $$ > $PID_FILE

# Check Ollama status
echo "Checking Ollama API availability..."
OLLAMA_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:11434/api/tags || echo "000")

if [ "$OLLAMA_STATUS" = "200" ]; then
  echo "[OK] Ollama API server is running and available!"
  export OLLAMA_API_URL=http://localhost:11434
  export OLLAMA_USE_FALLBACK=False
else
  echo "[WARNING] Ollama server not found or not accessible! (code $OLLAMA_STATUS)"
  echo "Emulation mode will be used for API. For full functionality, install and run Ollama."
  export OLLAMA_API_URL=http://localhost:11434
  export OLLAMA_USE_FALLBACK=True
  
  # Try to start Ollama if installed
  if command -v ollama &> /dev/null; then
    echo "Attempting to start Ollama service..."
    systemctl start ollama
    sleep 5
  fi
fi

# Start backend
echo "Starting backend service..."
cd $BACKEND_DIR

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
  source .venv/bin/activate
fi

# Run setup if needed
if [ -f "setup_free_ai.sh" ]; then
  bash setup_free_ai.sh &> /dev/null
fi

# Run migrations
python manage.py migrate &> /dev/null

# Start Django in background
nohup python manage.py runserver 0.0.0.0:8000 > /var/log/devopsai-backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"
echo $BACKEND_PID > /var/run/devopsai-backend.pid

# Start frontend
echo "Starting frontend service..."
cd $FRONTEND_DIR

# Start frontend in production mode (vite preview)
if grep -q '"preview"' package.json; then
  nohup npm run preview -- --host 0.0.0.0 > /var/log/devopsai-frontend.log 2>&1 &
elif grep -q '"start"' package.json; then
  nohup npm run start > /var/log/devopsai-frontend.log 2>&1 &
else
  nohup npm run dev -- --host 0.0.0.0 > /var/log/devopsai-frontend.log 2>&1 &
fi
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"
echo $FRONTEND_PID > /var/run/devopsai-frontend.pid

echo "====================================================="
echo "= DevOps AI Platform started successfully!          ="
echo "= Backend PID: $BACKEND_PID                         ="
echo "= Frontend PID: $FRONTEND_PID                       ="
echo "= Logs:                                             ="
echo "= - Backend: /var/log/devopsai-backend.log          ="
echo "= - Frontend: /var/log/devopsai-frontend.log        ="
echo "====================================================="

# Exit with success - systemd will keep the service running
exit 0 