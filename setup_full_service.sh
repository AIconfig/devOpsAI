#!/bin/bash

# Script to set up the unified systemd service for DevOpsAI Platform

# Make sure we're running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit 1
fi

# Set the project directory
PROJECT_DIR="/home/server/Bogdan/devOpsAI"

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
  echo "Error: Project directory not found: $PROJECT_DIR"
  exit 1
fi

# Make the startup script executable
chmod +x "$PROJECT_DIR/start_full_service.sh"

# Copy the service file to systemd directory
cp "$PROJECT_DIR/devopsai-full.service" /etc/systemd/system/devopsai-full.service

# Install Ollama if not present
if ! command -v ollama &> /dev/null; then
  echo "Installing Ollama for AI capabilities..."
  curl -fsSL https://ollama.com/install.sh | sh
  systemctl enable ollama
  systemctl start ollama
  
  # Wait for Ollama to initialize
  echo "Waiting for Ollama to initialize..."
  sleep 10
  
  # Pull required model
  echo "Pulling AI model (llama3)..."
  ollama pull llama3
fi

# Reload systemd to recognize the new service
systemctl daemon-reload

# Stop any existing separate services if they exist
if systemctl is-active --quiet devopsai-frontend.service; then
  echo "Stopping existing frontend service..."
  systemctl stop devopsai-frontend.service
  systemctl disable devopsai-frontend.service
fi

if systemctl is-active --quiet devopsai-backend.service; then
  echo "Stopping existing backend service..."
  systemctl stop devopsai-backend.service
  systemctl disable devopsai-backend.service
fi

# Enable and start the unified service
systemctl enable devopsai-full.service
systemctl start devopsai-full.service

# Check the status
systemctl status devopsai-full.service

echo "DevOpsAI Platform unified service has been set up and started."
echo "You can manage it with these commands:"
echo "  systemctl start devopsai-full.service"
echo "  systemctl stop devopsai-full.service"
echo "  systemctl restart devopsai-full.service"
echo "  systemctl status devopsai-full.service"
echo "  journalctl -u devopsai-full.service"
echo ""
echo "Logs are available at:"
echo "  - Backend: /var/log/devopsai-backend.log"
echo "  - Frontend: /var/log/devopsai-frontend.log" 