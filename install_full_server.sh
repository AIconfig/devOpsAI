#!/bin/bash

# Full installation script for DevOps AI platform
# This script installs and sets up:
# 1. Ollama (AI model server)
# 2. Backend Django application with AI assistant
# 3. Frontend React application
# 4. Nginx as a reverse proxy

echo "====================================================="
echo "= DevOps AI Platform - Full Server Installation     ="
echo "====================================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit 1
fi

# Set base directory
BASE_DIR="/home/server/Bogdan/devOpsAI"
FRONTEND_DIR="$BASE_DIR/fronAnd"
BACKEND_DIR="$BASE_DIR/backAnd"

# Create project directories if they don't exist
mkdir -p $FRONTEND_DIR
mkdir -p $BACKEND_DIR

# Install system dependencies
echo "Installing system dependencies..."
apt update
apt install -y curl wget git python3 python3-pip python3-venv nodejs npm nginx

# Install Ollama
echo "Installing Ollama..."
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama service
echo "Starting Ollama service..."
systemctl enable ollama
systemctl start ollama

# Wait for Ollama to initialize
echo "Waiting for Ollama to initialize..."
sleep 10

# Pull required AI models
echo "Pulling required AI models for Ollama..."
ollama pull llama3

# Setup backend
echo "Setting up backend..."
cd $BACKEND_DIR

# Make backend scripts executable
chmod +x startup.sh setup-service.sh
if [ -f "setup_free_ai.sh" ]; then
  chmod +x setup_free_ai.sh
fi

# Install backend as a service
./setup-service.sh

# Setup frontend
echo "Setting up frontend..."
cd $FRONTEND_DIR

# Make frontend scripts executable
chmod +x startup.sh setup-service.sh

# Install frontend as a service
./setup-service.sh

# Setup Nginx
echo "Configuring Nginx as reverse proxy..."
cat > /etc/nginx/sites-available/devopsai << EOF
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend admin
    location /admin/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend static files
    location /static/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/devopsai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx

echo "====================================================="
echo "= DevOps AI Platform installation complete!         ="
echo "= Access your application at: http://YOUR_SERVER_IP ="
echo "====================================================="
echo "Services running:"
echo "- Ollama AI (port 11434)"
echo "- Backend Django (port 8000)"
echo "- Frontend React (port 5173)"
echo "- Nginx proxy (port 80)"
echo "=====================================================" 