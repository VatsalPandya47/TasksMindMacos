import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  getVersion: () => ipcRenderer.invoke('get-version'),
  minimize: () => ipcRenderer.invoke('minimize-window'),
  maximize: () => ipcRenderer.invoke('maximize-window'),
  close: () => ipcRenderer.invoke('close-window'),
  
  // Environment variables (safely exposed)
  getEnv: (key: string) => {
    const allowedKeys = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_OPENAI_API_KEY',
      'VITE_ZOOM_CLIENT_ID',
      'VITE_SLACK_BOT_TOKEN',
      'VITE_SLACK_CHANNEL_ID'
    ];
    
    if (allowedKeys.includes(key)) {
      return process.env[key] || '';
    }
    return '';
  }
});

// TypeScript declaration for the exposed API
declare global {
  interface Window {
    electronAPI: {
      openExternal: (url: string) => Promise<void>;
      getVersion: () => Promise<string>;
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      getEnv: (key: string) => string;
    };
  }
}
