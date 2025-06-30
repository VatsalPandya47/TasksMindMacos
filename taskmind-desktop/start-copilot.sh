#!/bin/bash

# TaskMind Copilot Startup Script
echo "🧠 Starting TaskMind Copilot..."

# Navigate to the correct directory
cd "$(dirname "$0")"

# Check if we're in the right directory
if [ ! -f "dist/main.js" ]; then
    echo "❌ Error: dist/main.js not found. Please build the project first."
    echo "Run: npx tsc"
    exit 1
fi

# Check if Electron is installed
if [ ! -f "node_modules/.bin/electron" ]; then
    echo "❌ Error: Electron not found. Please install dependencies."
    echo "Run: npm install"
    exit 1
fi

echo "✅ Starting TaskMind Copilot Desktop..."
echo "📝 Features:"
echo "   • Real-time AI meeting intelligence" 
echo "   • Global hotkeys: ⌘⇧T (Ask), ⌘⇧H (Hide/Show)"
echo "   • Native notifications"
echo "   • Task board integration"
echo "   • Audio transcription with Whisper"
echo ""
echo "🚀 Launching app..."

# Start the application
./node_modules/.bin/electron dist/main.js
