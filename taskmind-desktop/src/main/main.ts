import { app, BrowserWindow, ipcMain, globalShortcut, Notification, Menu, shell } from 'electron';
import { join } from 'path';

declare const __dirname: string;
declare const process: any;

let mainWindow: BrowserWindow | null;
let isAppQuitting = false;

const APP_CONFIG = {
  isDev: process.env.NODE_ENV === 'development',
  minWidth: 1000,
  minHeight: 700,
  defaultWidth: 1400,
  defaultHeight: 900
};

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: APP_CONFIG.defaultWidth,
    height: APP_CONFIG.defaultHeight,
    minWidth: APP_CONFIG.minWidth,
    minHeight: APP_CONFIG.minHeight,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    show: false,
    backgroundColor: '#0a0a0a'
  });

  if (APP_CONFIG.isDev) {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      if (process.platform === 'darwin') {
        mainWindow.focus();
      }
      showNotification('TaskMind Copilot Ready', 'Your AI meeting assistant is now active!');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('close', (event) => {
    if (!isAppQuitting && process.platform === 'darwin' && mainWindow) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function setupMenu(): void {
  if (process.platform === 'darwin') {
    const template = [
      {
        label: 'TaskMind',
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      }
    ];
    const menu = Menu.buildFromTemplate(template as any);
    Menu.setApplicationMenu(menu);
  }
}

function registerGlobalShortcuts(): void {
  try {
    globalShortcut.register('CommandOrControl+Shift+T', () => {
      if (mainWindow) {
        mainWindow.webContents.send('hotkey-manual-question');
        showNotification('Manual Question Mode', 'Ask your question now...');
      }
    });

    globalShortcut.register('CommandOrControl+Shift+H', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });

    console.log('Global shortcuts registered successfully');
  } catch (error) {
    console.error('Failed to register global shortcuts:', error);
  }
}

function showNotification(title: string, body: string, urgency: 'normal' | 'critical' | 'low' = 'normal'): void {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body,
      urgency
    });
    notification.show();
    notification.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
  }
}

function setupIpcHandlers(): void {
  ipcMain.handle('show-notification', async (event, title: string, body: string, urgency?: string) => {
    showNotification(title, body, urgency as any);
    return true;
  });

  ipcMain.handle('copilot-status-update', async (event, status: string, data?: any) => {
    console.log(`Copilot Status: ${status}`, data);
    if (process.platform === 'darwin') {
      switch (status) {
        case 'listening': app.setBadgeCount(1); break;
        case 'processing': app.setBadgeCount(2); break;
        case 'responding': app.setBadgeCount(3); break;
        default: app.setBadgeCount(0);
      }
    }
    return true;
  });

  ipcMain.handle('minimize-window', async () => {
    if (mainWindow) mainWindow.minimize();
    return true;
  });

  ipcMain.handle('hide-window', async () => {
    if (mainWindow) mainWindow.hide();
    return true;
  });

  ipcMain.handle('show-window', async () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
    return true;
  });

  ipcMain.handle('get-app-info', async () => {
    return {
      version: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
      isDev: APP_CONFIG.isDev
    };
  });
}

app.whenReady().then(() => {
  createWindow();
  setupMenu();
  setupIpcHandlers();
  registerGlobalShortcuts();
  console.log('TaskMind Copilot initialized successfully');
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow && !mainWindow.isVisible()) {
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    isAppQuitting = true;
    app.quit();
  }
});

app.on('before-quit', () => {
  isAppQuitting = true;
  globalShortcut.unregisterAll();
  if (process.platform === 'darwin') {
    app.setBadgeCount(0);
  }
});

app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event: any, navigationUrl: string) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'http://localhost:8080' && 
        parsedUrl.origin !== 'file://' &&
        !navigationUrl.startsWith('file://')) {
      event.preventDefault();
    }
  });
});

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
