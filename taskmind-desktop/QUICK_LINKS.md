# 🔗 TaskMind Quick Setup Links - Get Your API Keys!

## 🗄️ Supabase (2 minutes)
1. **Go to**: https://dashboard.supabase.com
2. **Click**: "New Project" or select existing
3. **Navigate**: Settings → API 
4. **Copy**: 
   - Project URL (looks like: https://abc123.supabase.co)
   - anon/public key (starts with: eyJ...)
5. **Update .env.local**:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...your-key
   ```

## 📹 Zoom App (3 minutes)
1. **Go to**: https://marketplace.zoom.us/develop/create
2. **Choose**: "OAuth App"  
3. **Fill**:
   - App Name: "TaskMind Desktop"
   - App Type: "User-managed app"
   - Redirect URL: `http://localhost:3000/auth/callback`
4. **Scopes**: Add `meeting:read` and `recording:read`
5. **Copy**: Client ID and Client Secret
6. **Update .env.local**:
   ```
   VITE_ZOOM_CLIENT_ID=your_client_id
   VITE_ZOOM_CLIENT_SECRET=your_client_secret
   ```

## 💬 Slack App (3 minutes)
1. **Go to**: https://api.slack.com/apps/new
2. **Choose**: "From scratch"
3. **Name**: "TaskMind Bot"
4. **Workspace**: Select your workspace
5. **Navigate**: OAuth & Permissions → Scopes
6. **Add Bot Scopes**:
   - `chat:write`
   - `chat:write.public`
   - `channels:read`
7. **Install**: App to Workspace (green button)
8. **Copy**: Bot User OAuth Token (starts with xoxb-)
9. **Get Channel ID**: Right-click any channel → "Copy link" → ID is at the end
10. **Update .env.local**:
    ```
    VITE_SLACK_BOT_TOKEN=xoxb-your-bot-token
    VITE_SLACK_CHANNEL_ID=C1234567890
    ```

## 🚀 Final Commands (Run these after updating .env.local)
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Login to Supabase
supabase login

# Deploy all functions
./scripts/deploy-functions.sh

# Your app is already running at this point! 🎉
```

## 🎯 Test Everything
1. **Your Electron app should already be open**
2. **Settings tab** → Test each integration
3. **Meetings tab** → Connect Zoom
4. **Tasks tab** → See the Kanban board
5. **Follow the 6-step workflow from documentation**

## ⏱️ Total Time: ~8 minutes to full setup!
