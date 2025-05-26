#!/bin/bash

# Script to set up the systemd service for DevOpsAI Frontend

# Make sure we're running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit 1
fi

# Set the project directory
PROJECT_DIR="/home/server/Bogdan/devOpsAI/fronAnd"

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
  echo "Error: Project directory not found: $PROJECT_DIR"
  exit 1
fi

# Make the startup script executable
chmod +x "$PROJECT_DIR/startup.sh"

# Copy the service file to systemd directory
cp "$PROJECT_DIR/startup-systemd.service" /etc/systemd/system/devopsai-frontend.service

# Reload systemd to recognize the new service
systemctl daemon-reload

# Enable the service to start on boot
systemctl enable devopsai-frontend.service

# Start the service
systemctl start devopsai-frontend.service

# Check the status
systemctl status devopsai-frontend.service

echo "DevOpsAI Frontend service has been set up and started."
echo "You can manage it with these commands:"
echo "  systemctl start devopsai-frontend.service"
echo "  systemctl stop devopsai-frontend.service"
echo "  systemctl restart devopsai-frontend.service"
echo "  systemctl status devopsai-frontend.service"
echo "  journalctl -u devopsai-frontend.service" 