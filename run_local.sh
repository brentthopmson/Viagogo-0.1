#!/bin/bash

# Configuration
APP_DIR=$(pwd)
PORT=3001

echo "----------------------------------------"
echo "Starting Viagogo Rebranded App..."
echo "----------------------------------------"

# Navigate to app directory
cd "$APP_DIR"

# Kill any process running on the target port
echo "Checking for processes on port $PORT..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows/Git Bash
    PID=$(netstat -ano | grep :$PORT | grep LISTENING | awk '{print $5}' | head -n 1)
    if [ ! -z "$PID" ]; then
        echo "Killing process $PID on port $PORT..."
        taskkill //F //PID $PID 2>/dev/null
    fi
else
    # Unix/macOS
    PID=$(lsof -t -i:$PORT)
    if [ ! -z "$PID" ]; then
        echo "Killing process $PID on port $PORT..."
        kill -9 $PID 2>/dev/null
    fi
fi

# Start the application in the background
echo "Launching npm run dev..."
nohup npm run dev > app_restart.log 2>&1 &

echo "----------------------------------------"
echo "Server restarted in background!"
echo "View logs: tail -f app_restart.log"
echo "Local URL: http://localhost:$PORT"
echo "----------------------------------------"
