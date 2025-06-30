#!/bin/bash

# TaskMind Desktop - Complete AI Copilot System
# Real-time meeting intelligence with GPT-4o integration

set -e

echo "🧠 ====================================="
echo "🧠 TaskMind Desktop - AI Copilot System"
echo "🧠 ====================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the correct directory
if [[ ! -f "package.json" ]]; then
    echo -e "${RED}❌ Please run this script from the taskmind-desktop directory${NC}"
    exit 1
fi

echo -e "${BLUE}🔧 Building TaskMind Copilot...${NC}"

# Clean previous build
echo "   🧹 Cleaning previous build..."
rm -rf dist

# Build main process
echo "   📦 Building main process..."
npx tsc src/main/main.ts --outDir dist --target es2020 --module commonjs --skipLibCheck --esModuleInterop

# Build preload script
echo "   🔗 Building preload script..."
npx tsc src/preload/preload.ts --outDir dist --target es2020 --module commonjs --skipLibCheck --esModuleInterop

# Build renderer (React app)
echo "   ⚛️  Building React renderer..."
npx esbuild src/renderer/index.tsx --bundle --outfile=dist/renderer.js --target=es2020 --format=iife --platform=browser

# Copy HTML and CSS files
echo "   📄 Copying HTML and CSS files..."
cp src/renderer/index.html dist/
cp src/renderer/*.css dist/

# Verify build
if [[ ! -f "dist/main.js" ]] || [[ ! -f "dist/preload.js" ]] || [[ ! -f "dist/renderer.js" ]]; then
    echo -e "${RED}❌ Build failed! Missing required files.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo ""

# Show build summary
echo -e "${BLUE}📊 Build Summary:${NC}"
echo "   📁 dist/"
echo "   ├── main.js      ($(du -h dist/main.js | cut -f1))"
echo "   ├── preload.js   ($(du -h dist/preload.js | cut -f1))"
echo "   ├── renderer.js  ($(du -h dist/renderer.js | cut -f1))"
echo "   └── index.html   ($(du -h dist/index.html | cut -f1))"
echo ""

# Show features
echo -e "${YELLOW}🚀 TaskMind Copilot Features:${NC}"
echo "   🎤 Real-time audio capture with Whisper AI"
echo "   🧠 GPT-4o powered intelligent responses"
echo "   ⚡ Global hotkeys (⌘⇧T, ⌘⇧R, ⌘⇧L, ⌘⇧H)"
echo "   💫 Beautiful glassmorphism floating overlay"
echo "   🔄 Automatic question detection in meetings"
echo "   📊 Task board integration & context awareness"
echo "   🍎 Native macOS notifications"
echo ""

echo -e "${BLUE}🚀 Launching TaskMind Desktop...${NC}"
echo ""

# Launch the application
./node_modules/.bin/electron dist/main.js

echo ""
echo -e "${GREEN}👋 TaskMind Copilot session ended.${NC}"
echo "   📝 Check the console for any error messages"
echo "   🔄 Run this script again to restart the application"
echo "" 