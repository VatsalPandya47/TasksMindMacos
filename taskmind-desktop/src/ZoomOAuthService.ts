import { BrowserWindow } from 'electron';
import axios from 'axios';
import { supabase } from '../lib/supabase';

export class ZoomOAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.ZOOM_CLIENT_ID || '';
    this.clientSecret = process.env.ZOOM_CLIENT_SECRET || '';
    this.redirectUri = 'taskmind://zoom-oauth';
  }

  generateAuthorizationUrl(): string {
    const scopes = [
      'meeting:read',
      'recording:read',
      'user:read',
    ];

    return `https://zoom.us/oauth/authorize?response_type=code&client_id=${this.clientId}&redirect_uri=${this.redirectUri}&scope=${scopes.join(' ')}`;
  }

  async handleOAuthCallback(code: string, userId: string) {
    try {
      // Exchange authorization code for access token
      const { data } = await axios.post(
        'https://zoom.us/oauth/token',
        null,
        {
          params: {
            grant_type: 'authorization_code',
            code,
            redirect_uri: this.redirectUri,
            client_id: this.clientId,
            client_secret: this.clientSecret,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      // Store tokens in Supabase
      const { error } = await supabase
        .from('zoom_tokens')
        .upsert({
          user_id: userId,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: new Date(Date.now() + data.expires_in * 1000),
        });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Zoom OAuth Error:', error);
      throw error;
    }
  }

  async initiateZoomOAuth(userId: string): Promise<void> {
    const authUrl = this.generateAuthorizationUrl();
    
    // Create a new browser window for OAuth
    const authWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    authWindow.loadURL(authUrl);

    // Listen for URL changes to capture the callback
    authWindow.webContents.on('will-redirect', async (event, url) => {
      if (url.startsWith(this.redirectUri)) {
        event.preventDefault();
        
        // Extract code from URL
        const urlParams = new URL(url);
        const code = urlParams.searchParams.get('code');

        if (code) {
          try {
            await this.handleOAuthCallback(code, userId);
            authWindow.close();
            // Optionally, trigger a sync of Zoom meetings
          } catch (error) {
            console.error('OAuth Callback Error:', error);
            authWindow.close();
          }
        }
      }
    });
  }
} 