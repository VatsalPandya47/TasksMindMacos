import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window management
  minimize: () => ipcRenderer.invoke('minimize-window'),
  hide: () => ipcRenderer.invoke('hide-window'),
  show: () => ipcRenderer.invoke('show-window'),
  
  // App information
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // Copilot functionality
  showNotification: (title: string, body: string, urgency?: string) => 
    ipcRenderer.invoke('show-notification', title, body, urgency),
  
  updateCopilotStatus: (status: string, data?: any) => 
    ipcRenderer.invoke('copilot-status-update', status, data),
  
  reportError: (error: any) => 
    ipcRenderer.invoke('report-error', error),
  
  // Hotkey listeners (one-way communication from main to renderer)
  onHotkeyManualQuestion: (callback: () => void) => {
    ipcRenderer.on('hotkey-manual-question', callback);
    return () => ipcRenderer.removeListener('hotkey-manual-question', callback);
  },
  
  onHotkeyToggleRecording: (callback: () => void) => {
    ipcRenderer.on('hotkey-toggle-recording', callback);
    return () => ipcRenderer.removeListener('hotkey-toggle-recording', callback);
  },
  
  onHotkeyToggleListening: (callback: () => void) => {
    ipcRenderer.on('hotkey-toggle-listening', callback);
    return () => ipcRenderer.removeListener('hotkey-toggle-listening', callback);
  },
  
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
  },

  // Platform information
  platform: process.platform,
  
  // External links
  openExternal: (url: string) => {
    const { shell } = require('electron');
    shell.openExternal(url);
  }
});

// TypeScript declaration for the exposed API
declare global {
  interface Window {
    electronAPI: {
      // Window management
      minimize: () => Promise<void>;
      hide: () => Promise<void>;
      show: () => Promise<void>;
      
      // App information
      getAppInfo: () => Promise<{
        version: string;
        platform: string;
        arch: string;
        isDev: boolean;
      }>;
      
      // Copilot functionality
      showNotification: (title: string, body: string, urgency?: string) => Promise<boolean>;
      updateCopilotStatus: (status: string, data?: any) => Promise<boolean>;
      reportError: (error: any) => Promise<boolean>;
      
      // Hotkey listeners
      onHotkeyManualQuestion: (callback: () => void) => () => void;
      onHotkeyToggleRecording: (callback: () => void) => () => void;
      onHotkeyToggleListening: (callback: () => void) => () => void;
      
      // Environment and platform
      getEnv: (key: string) => string;
      platform: string;
      openExternal: (url: string) => void;
    };
  }
}

// Node.js globals
declare const process: any;
declare const require: any;
