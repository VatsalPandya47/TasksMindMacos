#!/bin/bash

# Deploy TaskMind Supabase Edge Functions
echo "🚀 Deploying TaskMind Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Array of functions to deploy
functions=(
    "extract-zoom-transcript"
    "process-transcript" 
    "notifySlack"
    "sync-zoom-meetings"
    "summarize"
    "ai-task-extractor"
)

# Deploy each function
for func in "${functions[@]}"; do
    echo "📦 Deploying $func..."
    if supabase functions deploy $func --project-ref $SUPABASE_PROJECT_REF; then
        echo "✅ $func deployed successfully"
    else
        echo "❌ Failed to deploy $func"
        exit 1
    fi
done

echo "🎉 All edge functions deployed successfully!"

# Set environment secrets if they're provided
echo "🔑 Setting environment secrets..."

# Required secrets
secrets=(
    "OPENAI_API_KEY"
    "ZOOM_CLIENT_ID" 
    "ZOOM_CLIENT_SECRET"
    "SLACK_BOT_TOKEN"
    "SLACK_CHANNEL_ID"
)

for secret in "${secrets[@]}"; do
    if [ ! -z "${!secret}" ]; then
        echo "Setting $secret..."
        supabase secrets set $secret="${!secret}" --project-ref $SUPABASE_PROJECT_REF
    else
        echo "⚠️  $secret not set in environment"
    fi
done

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Configure your environment variables"
echo "2. Test the functions in Supabase dashboard"
echo "3. Run 'npm run dev' to start the development server" 