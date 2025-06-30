# 🚀 TaskMind Desktop

## 🌟 Overview

TaskMind Desktop is a native macOS application built with Electron and React, designed to be your AI-powered task management and meeting assistant.

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript
- **Desktop Framework**: Electron
- **Styling**: Tailwind CSS
- **Backend**: Supabase
- **AI Integration**: OpenAI GPT-4o
- **Meeting Integration**: Zoom OAuth

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm
- Supabase account
- OpenAI API key
- Zoom Developer Account

### Installation

1. Clone the repository
```bash
git clone https://github.com/VatsalPandya47/TaskMind.Dev
cd taskmind-desktop
```

2. Install dependencies
```bash
npm install
```

3. Zoom OAuth Configuration
- Create a Zoom App in the [Zoom Marketplace](https://marketplace.zoom.us/)
- Configure OAuth scopes:
  * `meeting:read`
  * `recording:read`
  * `user:read`
- Set Redirect URI: `taskmind://zoom-oauth`

4. Create `.env.local` file
```bash
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

5. Development Mode
```bash
npm run dev
```

## 🔐 Authentication

The app uses Supabase for authentication with:
- Sign Up
- Sign In
- Sign Out
- Persistent Session Management

## 🤖 Zoom Integration

- OAuth-based Zoom meeting retrieval
- Automatic meeting sync
- Meeting recording and transcript access
- Secure token management

## 🤖 AI Task Extraction

Utilizes GPT-4o to:
- Extract tasks from meeting transcripts
- Automatically create and prioritize tasks
- Integrate with Supabase edge functions

## 🔧 Scripts

- `npm run dev`: Start development server
- `npm run build`: Build production app
- `npm run dist`: Create macOS `.dmg`
- `npm start`: Launch Electron app

## 🌈 Features

- 📋 Task Management Dashboard
- 🤖 AI Meeting Assistant
- 🎙 Whisper Transcription
- 🔄 Supabase Sync
- 📦 Auto-updates
- 🎥 Zoom Meeting Integration

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License

## 🙌 Acknowledgements

- Electron
- React
- Supabase
- OpenAI
- Zoom 