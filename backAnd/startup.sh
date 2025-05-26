#!/bin/bash

# Automation script for DevOpsAI Backend

# Set the project directory
PROJECT_DIR="/home/server/Bogdan/devOpsAI/backAnd"

# Go to project directory
cd $PROJECT_DIR || { echo "Error: Project directory not found"; exit 1; }

echo "==== Starting DevOpsAI Backend ===="
echo "Current directory: $(pwd)"

# Check if virtual environment exists, if not create it
if [ ! -d ".venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv .venv || { echo "Error: Failed to create virtual environment"; exit 1; }
fi

# Activate virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate || { echo "Error: Failed to activate virtual environment"; exit 1; }

# Install dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
  echo "Installing dependencies..."
  pip install -r requirements.txt || { echo "Error: Failed to install dependencies"; exit 1; }
fi

# Check Ollama API availability
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
fi

# Run AI setup if needed
if [ -f "setup_free_ai.sh" ]; then
  echo "Setting up AI models..."
  bash setup_free_ai.sh || { echo "Warning: AI setup script execution failed"; }
fi

# Run migrations
echo "Running database migrations..."
python manage.py migrate || { echo "Error: Failed to run migrations"; exit 1; }

# Start the Django server
echo "Starting Django backend server..."
python manage.py runserver 0.0.0.0:8000

# Keep script running (this won't be reached with the runserver command above)
echo "Application started. Press Ctrl+C to stop." 