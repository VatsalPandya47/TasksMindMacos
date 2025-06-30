#!/bin/bash

# TaskMind Desktop Complete Setup Script
echo "🚀 TaskMind Desktop Complete Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the taskmind-desktop directory"
    exit 1
fi

print_info "Starting complete TaskMind setup..."

# Step 1: Check prerequisites
print_info "Checking prerequisites..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check Supabase CLI
if command -v supabase &> /dev/null; then
    SUPABASE_VERSION=$(supabase --version)
    print_status "Supabase CLI found: $SUPABASE_VERSION"
else
    print_error "Supabase CLI not found"
    exit 1
fi

# Step 2: Install dependencies if needed
print_info "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies..."
    npm install
    print_status "Dependencies installed"
else
    print_status "Dependencies already installed"
fi

# Step 3: Check environment configuration
print_info "Checking environment configuration..."

if [ ! -f ".env.local" ]; then
    print_error ".env.local file not found"
    exit 1
fi

# Step 4: Validate environment variables
print_info "Validating environment variables..."

# Source the environment file
set -a
source .env.local
set +a

# Check OpenAI
if [[ "$VITE_OPENAI_API_KEY" == "your_openai_api_key" ]] || [[ -z "$VITE_OPENAI_API_KEY" ]]; then
    print_error "OpenAI API key not configured"
    echo "Please set VITE_OPENAI_API_KEY in .env.local"
    exit 1
else
    print_status "OpenAI API key configured"
fi

# Check Supabase
if [[ "$VITE_SUPABASE_URL" == "your_supabase_url" ]] || [[ -z "$VITE_SUPABASE_URL" ]]; then
    print_warning "Supabase URL not configured"
    echo "🌐 Please visit: https://dashboard.supabase.com"
    echo "📋 Copy your Project URL and update VITE_SUPABASE_URL in .env.local"
    SUPABASE_MISSING=true
else
    print_status "Supabase URL configured"
fi

if [[ "$VITE_SUPABASE_ANON_KEY" == "your_supabase_anon_key" ]] || [[ -z "$VITE_SUPABASE_ANON_KEY" ]]; then
    print_warning "Supabase anon key not configured"
    echo "🔑 Copy your anon key and update VITE_SUPABASE_ANON_KEY in .env.local"
    SUPABASE_MISSING=true
else
    print_status "Supabase anon key configured"
fi

# Check Zoom
if [[ "$VITE_ZOOM_CLIENT_ID" == "your_zoom_client_id" ]] || [[ -z "$VITE_ZOOM_CLIENT_ID" ]]; then
    print_warning "Zoom credentials not configured"
    echo "📹 Please visit: https://marketplace.zoom.us"
    echo "📋 Create OAuth App and update VITE_ZOOM_CLIENT_ID in .env.local"
    ZOOM_MISSING=true
else
    print_status "Zoom credentials configured"
fi

# Check Slack
if [[ "$VITE_SLACK_BOT_TOKEN" == "your_slack_bot_token" ]] || [[ -z "$VITE_SLACK_BOT_TOKEN" ]]; then
    print_warning "Slack credentials not configured"
    echo "💬 Please visit: https://api.slack.com/apps"
    echo "📋 Create Slack App and update VITE_SLACK_BOT_TOKEN in .env.local"
    SLACK_MISSING=true
else
    print_status "Slack credentials configured"
fi

# Step 5: Deploy functions if Supabase is configured
if [[ "$SUPABASE_MISSING" != "true" ]]; then
    print_info "Attempting to deploy edge functions..."
    
    # Check if user is logged into Supabase
    if supabase status &> /dev/null; then
        print_status "Supabase project connected"
        
        # Deploy functions
        print_info "Deploying edge functions..."
        
        functions=("extract-zoom-transcript" "process-transcript" "sync-zoom-meetings" "notifySlack" "summarize" "ai-task-extractor")
        
        for func in "${functions[@]}"; do
            echo "📦 Deploying $func..."
            if supabase functions deploy $func; then
                print_status "$func deployed successfully"
            else
                print_error "Failed to deploy $func"
            fi
        done
        
        # Run migrations
        print_info "Running database migrations..."
        if supabase db push; then
            print_status "Database migrations completed"
        else
            print_warning "Database migrations may have failed"
        fi
        
    else
        print_warning "Not connected to Supabase project"
        echo "🔑 Run: supabase login"
        echo "🔗 Then run: supabase link --project-ref YOUR_PROJECT_REF"
    fi
else
    print_warning "Skipping Supabase deployment - credentials needed"
fi

# Step 6: Create quick links document
print_info "Creating quick reference..."

cat > QUICK_LINKS.md << 'EOF'
# 🔗 TaskMind Quick Setup Links

## 🗄️ Supabase Setup
1. **Dashboard**: https://dashboard.supabase.com
2. **Go to**: Your Project → Settings → API
3. **Copy**: Project URL and anon key
4. **Update**: `.env.local` with your credentials

## 📹 Zoom App Setup  
1. **Marketplace**: https://marketplace.zoom.us
2. **Create**: OAuth App
3. **Scopes**: `meeting:read`, `recording:read`
4. **Redirect**: `http://localhost:3000/auth/callback`
5. **Update**: `.env.local` with Client ID and Secret

## 💬 Slack App Setup
1. **API Portal**: https://api.slack.com/apps
2. **Create**: New App
3. **Scopes**: `chat:write`, `chat:write.public`, `channels:read`
4. **Install**: App to workspace
5. **Update**: `.env.local` with Bot Token and Channel ID

## 🚀 Commands to Run After Setup
```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
./scripts/deploy-functions.sh

# Start development
npm run dev
```

## 📱 Testing Your Setup
1. Open the Electron app
2. Go to Settings tab → Test integrations
3. Go to Meetings tab → Connect Zoom
4. Follow the 6-step workflow from documentation
EOF

print_status "Quick reference created: QUICK_LINKS.md"

# Final status
echo ""
echo "🎯 Setup Status Summary:"
echo "========================"

[[ "$VITE_OPENAI_API_KEY" != "your_openai_api_key" ]] && print_status "OpenAI: Configured" || print_error "OpenAI: Missing"
[[ "$SUPABASE_MISSING" != "true" ]] && print_status "Supabase: Configured" || print_warning "Supabase: Needs setup"
[[ "$ZOOM_MISSING" != "true" ]] && print_status "Zoom: Configured" || print_warning "Zoom: Needs setup"  
[[ "$SLACK_MISSING" != "true" ]] && print_status "Slack: Configured" || print_warning "Slack: Needs setup"

echo ""
if [[ "$SUPABASE_MISSING" == "true" ]] || [[ "$ZOOM_MISSING" == "true" ]] || [[ "$SLACK_MISSING" == "true" ]]; then
    print_info "Next steps:"
    echo "1. 📖 Check QUICK_LINKS.md for setup instructions"
    echo "2. 🔧 Configure missing services"
    echo "3. 🚀 Run this script again"
else
    print_status "🎉 All services configured! You're ready to use TaskMind!"
    echo "🚀 Your development server should be running"
    echo "📱 Open the Electron app and start using TaskMind!"
fi 