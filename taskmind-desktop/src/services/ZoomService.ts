import axios from 'axios';
import { supabase } from '../lib/supabase';

interface ZoomMeeting {
  id: string;
  topic: string;
  start_time: string;
  duration: number;
  recording_files?: Array<{
    download_url: string;
    recording_type: string;
  }>;
}

export class ZoomService {
  private accessToken: string | null = null;

  constructor() {
    this.initializeAccessToken();
  }

  private async initializeAccessToken() {
    const { data, error } = await supabase
      .from('zoom_tokens')
      .select('access_token')
      .single();

    if (data) {
      this.accessToken = data.access_token;
    }
  }

  async refreshAccessToken() {
    try {
      const response = await axios.post(
        'https://zoom.us/oauth/token',
        null,
        {
          params: {
            grant_type: 'refresh_token',
            refresh_token: process.env.ZOOM_REFRESH_TOKEN,
            client_id: process.env.ZOOM_CLIENT_ID,
            client_secret: process.env.ZOOM_CLIENT_SECRET,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      // Update token in Supabase
      await supabase
        .from('zoom_tokens')
        .upsert({
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
        });

      this.accessToken = response.data.access_token;
      return response.data.access_token;
    } catch (error: any) {
      console.error('Failed to refresh Zoom token', error);
      throw error;
    }
  }

  async getUserMeetings(userId: string, startDate?: Date): Promise<ZoomMeeting[]> {
    if (!this.accessToken) {
      await this.initializeAccessToken();
    }

    try {
      const response = await axios.get('https://api.zoom.us/v2/users/me/meetings', {
        params: {
          type: 'scheduled', // or 'live'
          from: startDate?.toISOString(),
        },
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      // Filter and transform meetings
      return response.data.meetings.map((meeting: ZoomMeeting) => ({
        id: meeting.id,
        topic: meeting.topic,
        start_time: meeting.start_time,
        duration: meeting.duration,
      }));
    } catch (error) {
      // If token is expired, try refreshing
      if ((error as any).response?.status === 401) {
        await this.refreshAccessToken();
        return this.getUserMeetings(userId, startDate);
      }
      console.error('Failed to fetch Zoom meetings', error);
      throw error;
    }
  }

  async getMeetingRecordings(meetingId: string): Promise<string | null> {
    try {
      const response = await axios.get(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      // Find the first transcript or recording file
      const recordingFile = response.data.recording_files.find(
        (file: any) => file.recording_type === 'transcript' || file.file_type === 'MP4'
      );

      return recordingFile ? recordingFile.download_url : null;
    } catch (error) {
      console.error('Failed to fetch meeting recordings', error);
      return null;
    }
  }

  async syncMeetingsToSupabase(userId: string) {
    try {
      const meetings = await this.getUserMeetings(userId);
      
      // Upsert meetings to Supabase
      const { data, error } = await supabase
        .from('meetings')
        .upsert(
          meetings.map(meeting => ({
            id: meeting.id,
            user_id: userId,
            topic: meeting.topic,
            start_time: meeting.start_time,
            duration: meeting.duration,
          })),
          { 
            onConflict: 'id'
          }
        );

      if (error) throw error;
      return meetings;
    } catch (error) {
      console.error('Failed to sync meetings', error);
      throw error;
    }
  }
} 