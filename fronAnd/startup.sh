#!/bin/bash

# Automation script for DevOpsAI Frontend

# Set the project directory
PROJECT_DIR="/home/server/Bogdan/devOpsAI/fronAnd"

# Go to project directory
cd $PROJECT_DIR || { echo "Error: Project directory not found"; exit 1; }

echo "==== Starting DevOpsAI Frontend ===="
echo "Current directory: $(pwd)"

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install || { echo "Error: Failed to install dependencies"; exit 1; }
fi

# Build the project
echo "Building the project..."
npm run build || { echo "Error: Build failed"; exit 1; }

# Check if build was successful
if [ ! -d "dist" ]; then
  echo "Error: Build directory not found"
  exit 1
fi

# Check if package.json has a start script
if grep -q '"start"' package.json; then
  echo "Starting application with npm start..."
  npm start
else
  echo "Starting application with npm run dev..."
  npm run dev
fi

# Keep script running
echo "Application started. Press Ctrl+C to stop."
tail -f /dev/null 