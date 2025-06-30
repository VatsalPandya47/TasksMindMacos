// Application Configuration

export const APP_CONFIG = {
  // Development mode settings
  LANDING_PAGE_ONLY: false,
  
  // API Configuration
  API: {
    SUPABASE: {
      URL: import.meta.env.VITE_SUPABASE_URL || '',
      ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    },
    OPENAI: {
      API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
      RATE_LIMIT: 100, // requests per minute
    },
    ZOOM: {
      CLIENT_ID: import.meta.env.VITE_ZOOM_CLIENT_ID || '',
      SCOPES: [
        'meeting:read',
        'recording:read',
      ],
    },
  },

  // Feature Flags
  FEATURES: {
    AI_TASK_EXTRACTION: true,
    MEETING_TRANSCRIPTION: true,
    ZOOM_INTEGRATION: true,
  },

  // Electron App Settings
  ELECTRON: {
    APP_ID: 'com.taskmind.desktop',
    WINDOW_SIZE: {
      width: 1200,
      height: 800,
    },
  },
}; 