# 🚀 TaskMind Desktop Setup Guide

## ✅ Completed Steps
- ✅ OpenAI API Key configured
- ✅ Supabase CLI installed
- ✅ Development server ready
- ✅ All edge functions created

## 🔧 Next Steps

### 1. 🗄️ Configure Supabase
1. Go to [dashboard.supabase.com](https://dashboard.supabase.com)
2. Create/select your project
3. Go to Settings → API
4. Copy your Project URL and anon key
5. Update `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

### 2. 📹 Set Up Zoom App
1. Go to [marketplace.zoom.us](https://marketplace.zoom.us)
2. Create OAuth App
3. Configure scopes: `meeting:read`, `recording:read`
4. Set redirect URL: `http://localhost:3000/auth/callback`
5. Update `.env.local`:
   ```env
   VITE_ZOOM_CLIENT_ID=your_client_id
   VITE_ZOOM_CLIENT_SECRET=your_client_secret
   ```

### 3. 💬 Create Slack App
1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create new app
3. Add Bot Token Scopes:
   - `chat:write`
   - `chat:write.public` 
   - `channels:read`
4. Install app to workspace
5. Update `.env.local`:
   ```env
   VITE_SLACK_BOT_TOKEN=xoxb-your-bot-token
   VITE_SLACK_CHANNEL_ID=your_channel_id
   ```

### 4. 🚀 Deploy Edge Functions
```bash
# Login to Supabase
supabase login

# Make deployment script executable
chmod +x scripts/deploy-functions.sh

# Deploy all functions
./scripts/deploy-functions.sh
```

### 5. 📊 Run Database Migrations
```bash
supabase db push
```

### 6. 🎯 Test Your Setup
1. Your dev server is already running!
2. Open the app (Electron window)
3. Go to Settings tab → Test Slack integration
4. Go to Meetings tab → Connect Zoom account
5. Follow the 6-step workflow from documentation

## 📋 The 6-Step Workflow (From Documentation)

1. **Connect Zoom Account** → Click "Connect Zoom" in Meetings tab
2. **Configure Slack Integration** → Go to Settings tab, test connection
3. **Sync Meetings** → Click "Sync Meetings" to fetch recordings
4. **Extract Tasks** → Click "Extract & Create Tasks" on meetings
5. **Manage Tasks** → Use Kanban board in Tasks tab
6. **View Analytics** → Check Summaries tab for insights

## 🆘 Need Help?
- Check the Settings tab for connection status
- All services have test buttons
- Error messages will guide you through fixes

## 🎉 You're Almost There!
Once you complete these steps, you'll have a fully functional AI-powered task management system! 