// Environment configuration for Electron app
const getEnvVar = (key: string): string => {
  if (typeof window !== 'undefined' && window.electronAPI?.getEnv) {
    return window.electronAPI.getEnv(key);
  }
  return process.env[key] || '';
};

export const environment = {
  supabaseUrl: getEnvVar('VITE_SUPABASE_URL') || '',
  supabaseAnonKey: getEnvVar('VITE_SUPABASE_ANON_KEY') || '',
  supabaseServiceRoleKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY') || '',
  openaiApiKey: getEnvVar('VITE_OPENAI_API_KEY') || '',
  zoomClientId: getEnvVar('VITE_ZOOM_CLIENT_ID') || '',
  zoomClientSecret: getEnvVar('ZOOM_CLIENT_SECRET') || '',
  zoomRedirectUri: getEnvVar('VITE_ZOOM_REDIRECT_URI') || 'http://localhost:8080/zoom/callback',
  slackBotToken: getEnvVar('VITE_SLACK_BOT_TOKEN') || '',
  slackChannelId: getEnvVar('VITE_SLACK_CHANNEL_ID') || '',
  slackWebhookUrl: getEnvVar('SLACK_WEBHOOK_URL') || '',
  nodeEnv: getEnvVar('NODE_ENV') || 'development',
  appEnv: getEnvVar('VITE_APP_ENV') || 'development',
  isDevelopment: getEnvVar('NODE_ENV') === 'development',
  isProduction: getEnvVar('NODE_ENV') === 'production'
};

export const validatedEnv = {
  required: {
    'VITE_SUPABASE_URL': getEnvVar('VITE_SUPABASE_URL'),
    'VITE_SUPABASE_ANON_KEY': getEnvVar('VITE_SUPABASE_ANON_KEY'),
    'VITE_OPENAI_API_KEY': getEnvVar('VITE_OPENAI_API_KEY')
  }
};

export default environment; 