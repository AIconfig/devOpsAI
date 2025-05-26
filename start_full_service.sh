#!/bin/bash

# Full service startup script for DevOps AI Platform
# This script starts both frontend and backend services

# Set base directory
BASE_DIR="/home/server/Bogdan/devOpsAI"
FRONTEND_DIR="$BASE_DIR/fronAnd"
BACKEND_DIR="$BASE_DIR/backAnd"

echo "====================================================="
echo "= DevOps AI Platform - Starting Services            ="
echo "====================================================="
echo "$(date)"

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
  echo "Setting up AI models..."
  bash setup_free_ai.sh
fi

# Install dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
  echo "Installing backend dependencies..."
  pip install -r requirements.txt
fi

# Run migrations
echo "Running database migrations..."
python manage.py migrate

# Start frontend
echo "Starting frontend service..."
cd $FRONTEND_DIR

# Install node dependencies if needed
if [ -f "package.json" ] && [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

# Build frontend if needed
if [ ! -d "dist" ]; then
  echo "Building frontend..."
  npm run build
fi

# Start both services with pm2 if available
if command -v pm2 &> /dev/null; then
  echo "Using pm2 to manage services..."
  
  # Stop any existing processes
  pm2 delete devopsai-backend devopsai-frontend >/dev/null 2>&1
  
  # Start backend
  cd $BACKEND_DIR
  pm2 start "python manage.py runserver 0.0.0.0:8000" --name devopsai-backend
  
  # Start frontend
  cd $FRONTEND_DIR
  if grep -q '"preview"' package.json; then
    pm2 start "npm run preview -- --host 0.0.0.0" --name devopsai-frontend
  elif grep -q '"start"' package.json; then
    pm2 start "npm run start" --name devopsai-frontend
  else
    pm2 start "npm run dev -- --host 0.0.0.0" --name devopsai-frontend
  fi
  
  # Save pm2 configuration
  pm2 save
  
  echo "Services started with pm2"
  pm2 status
else
  # Install pm2 if not available
  echo "Installing pm2 to manage services..."
  npm install -g pm2
  
  # Restart the script to use pm2
  echo "Restarting service to use pm2..."
  exec "$0"
fi

# Keep the script running (this is only reached if pm2 failed to start)
echo "====================================================="
echo "= Keeping service alive in fallback mode            ="
echo "====================================================="

# Start backend in background
cd $BACKEND_DIR
python manage.py runserver 0.0.0.0:8000 > /var/log/devopsai-backend.log 2>&1 &
BACKEND_PID=$!

# Start frontend in background
cd $FRONTEND_DIR
if grep -q '"preview"' package.json; then
  npm run preview -- --host 0.0.0.0 > /var/log/devopsai-frontend.log 2>&1 &
elif grep -q '"start"' package.json; then
  npm run start > /var/log/devopsai-frontend.log 2>&1 &
else
  npm run dev -- --host 0.0.0.0 > /var/log/devopsai-frontend.log 2>&1 &
fi
FRONTEND_PID=$!

# Wait for processes to keep service running
wait $BACKEND_PID $FRONTEND_PID

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