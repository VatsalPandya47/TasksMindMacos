// Environment Configuration Helper
export const environment = {
  // Supabase
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: import.meta.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // OpenAI
  openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY || '',

  // Zoom
  zoomClientId: import.meta.env.VITE_ZOOM_CLIENT_ID || '',
  zoomClientSecret: import.meta.env.ZOOM_CLIENT_SECRET || '',
  zoomRedirectUri: import.meta.env.VITE_ZOOM_REDIRECT_URI || 'http://localhost:8080/zoom/callback',

  // Slack
  slackBotToken: import.meta.env.VITE_SLACK_BOT_TOKEN || '',
  slackChannelId: import.meta.env.VITE_SLACK_CHANNEL_ID || '',
  slackWebhookUrl: import.meta.env.SLACK_WEBHOOK_URL || '',

  // Application
  nodeEnv: import.meta.env.NODE_ENV || 'development',
  appEnv: import.meta.env.VITE_APP_ENV || 'development',

  // Feature flags
  isDevelopment: import.meta.env.NODE_ENV === 'development',
  isProduction: import.meta.env.NODE_ENV === 'production'
};

// Validation helper
export const validateEnvironment = () => {
  const required = {
    'VITE_SUPABASE_URL': import.meta.env.VITE_SUPABASE_URL,
    'VITE_SUPABASE_ANON_KEY': import.meta.env.VITE_SUPABASE_ANON_KEY,
    'VITE_OPENAI_API_KEY': import.meta.env.VITE_OPENAI_API_KEY
  };

  const missing = Object.entries(required).filter(([key, value]) => !value).map(([key]) => key);
  
  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing);
    return false;
  }
  
  return true;
};

export default environment; 