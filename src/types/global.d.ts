declare global {
  interface Window {
    electronAPI: {
      getAppInfo: () => Promise<{ platform: string; version: string }>;
      showNotification: (title: string, body: string) => Promise<void>;
      getEnv: (key: string) => string;
      onCopilotToggle: (callback: () => void) => void;
      onManualQuestion: (callback: () => void) => void;
      onRepeatAnswer: (callback: () => void) => void;
      onToggleListening: (callback: () => void) => void;
      onHideShow: (callback: () => void) => void;
      reportError: (error: string) => void;
    };
  }
}

export {}; 