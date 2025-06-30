import { environment } from './config/environment';

export const config = {
  supabase: {
    URL: environment.supabaseUrl,
    ANON_KEY: environment.supabaseAnonKey,
  },
  openai: {
    API_KEY: environment.openaiApiKey,
  },
  zoom: {
    CLIENT_ID: environment.zoomClientId,
  }
}; 