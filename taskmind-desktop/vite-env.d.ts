/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_ZOOM_CLIENT_ID: string
  readonly VITE_ZOOM_REDIRECT_URI: string
  readonly VITE_SLACK_BOT_TOKEN: string
  readonly VITE_SLACK_CHANNEL_ID: string
  readonly VITE_APP_ENV: string
  readonly VITE_APP_VERSION: string
  readonly VITE_SUPABASE_PROJECT_REF: string
  readonly NODE_ENV: string
  readonly SUPABASE_SERVICE_ROLE_KEY: string
  readonly ZOOM_CLIENT_SECRET: string
  readonly SLACK_WEBHOOK_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 