#!/bin/bash

echo "🧠 Starting TaskMind Desktop..."

# Kill any existing processes
pkill -f "TaskMind" 2>/dev/null || true

# Start the application
./node_modules/.bin/electron dist/main.js

echo "TaskMind Desktop started!" 