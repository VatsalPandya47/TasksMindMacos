import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ZoomService } from '../services/ZoomService';
import { SlackService } from '../services/SlackService';

export interface Meeting {
  id: string;
  zoom_meeting_id: string;
  user_id: string;
  topic: string;
  start_time: string;
  duration: number;
  participants: number;
  has_recording: boolean;
  recording_url?: string;
  transcript?: string;
  processed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UseMeetingsReturn {
  meetings: Meeting[];
  loading: boolean;
  error: string | null;
  syncMeetings: () => Promise<boolean>;
  extractTasks: (meetingId: string) => Promise<boolean>;
  getMeetingTranscript: (meetingId: string) => Promise<string | null>;
  refreshMeetings: () => Promise<void>;
  getMeetingsWithRecordings: () => Meeting[];
  getUnprocessedMeetings: () => Meeting[];
}

export const useMeetings = (userId: string): UseMeetingsReturn => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const zoomService = new ZoomService();
  const slackService = new SlackService();

  // Fetch meetings from Supabase
  const fetchMeetings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('zoom_meetings')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (supabaseError) throw supabaseError;

      setMeetings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch meetings');
      console.error('Error fetching meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync meetings from Zoom
  const syncMeetings = async (): Promise<boolean> => {
    try {
      setError(null);

      // Get user's Zoom access token
      const { data: zoomAuth } = await supabase
        .from('zoom_auth')
        .select('access_token')
        .eq('user_id', userId)
        .single();

      if (!zoomAuth?.access_token) {
        throw new Error('Zoom access token not found. Please reconnect your Zoom account.');
      }

      // Call sync-zoom-meetings edge function
      const { data, error } = await supabase.functions.invoke('sync-zoom-meetings', {
        body: {
          userId,
          accessToken: zoomAuth.access_token
        }
      });

      if (error) throw error;

      // Refresh meetings list
      await fetchMeetings();

      // Send Slack notification
      try {
        await slackService.notifyWorkflow(
          `📅 Successfully synced ${data.syncedMeetings} new meetings from Zoom`
        );
      } catch (slackError) {
        console.warn('Slack notification failed:', slackError);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync meetings');
      console.error('Error syncing meetings:', err);
      return false;
    }
  };

  // Extract tasks from meeting transcript
  const extractTasks = async (meetingId: string): Promise<boolean> => {
    try {
      setError(null);

      const meeting = meetings.find(m => m.id === meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      if (!meeting.transcript) {
        throw new Error('No transcript available for this meeting');
      }

      // Call process-transcript edge function
      const { data, error } = await supabase.functions.invoke('process-transcript', {
        body: {
          meetingId: meeting.zoom_meeting_id,
          userId,
          transcript: meeting.transcript,
          extractTasks: true,
          generateSummary: true
        }
      });

      if (error) throw error;

      // Mark meeting as processed
      await supabase
        .from('zoom_meetings')
        .update({ processed: true })
        .eq('id', meetingId);

      // Update local state
      setMeetings(prev => 
        prev.map(m => 
          m.id === meetingId 
            ? { ...m, processed: true }
            : m
        )
      );

      // Send Slack notification
      try {
        await slackService.notifyWorkflow(
          `🎯 Extracted ${data.tasks?.length || 0} tasks from meeting: "${meeting.topic}"`
        );
      } catch (slackError) {
        console.warn('Slack notification failed:', slackError);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract tasks');
      console.error('Error extracting tasks:', err);
      return false;
    }
  };

  // Get meeting transcript (placeholder - would integrate with actual transcript service)
  const getMeetingTranscript = async (meetingId: string): Promise<string | null> => {
    try {
      const meeting = meetings.find(m => m.id === meetingId);
      if (!meeting) return null;

      if (meeting.transcript) {
        return meeting.transcript;
      }

      // Here you would integrate with Zoom's transcript API or your own transcription service
      // For now, return a placeholder
      const placeholder = `
        This is a placeholder transcript for meeting: ${meeting.topic}
        
        Participants discussed the following topics:
        - Project status updates
        - Next quarter planning
        - Resource allocation
        
        Action items identified:
        - Complete project milestone by end of week
        - Schedule follow-up meeting with stakeholders
        - Review budget proposals
      `;

      // Update meeting with transcript
      await supabase
        .from('zoom_meetings')
        .update({ transcript: placeholder })
        .eq('id', meetingId);

      setMeetings(prev => 
        prev.map(m => 
          m.id === meetingId 
            ? { ...m, transcript: placeholder }
            : m
        )
      );

      return placeholder;
    } catch (err) {
      console.error('Error getting transcript:', err);
      return null;
    }
  };

  // Utility functions
  const getMeetingsWithRecordings = (): Meeting[] => {
    return meetings.filter(meeting => meeting.has_recording);
  };

  const getUnprocessedMeetings = (): Meeting[] => {
    return meetings.filter(meeting => !meeting.processed && meeting.has_recording);
  };

  const refreshMeetings = async () => {
    await fetchMeetings();
  };

  // Initial fetch and real-time subscription
  useEffect(() => {
    fetchMeetings();

    // Set up real-time subscription
    const subscription = supabase
      .channel('meetings_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'zoom_meetings',
          filter: `user_id=eq.${userId}`
        }, 
        (payload) => {
          console.log('Real-time meeting update:', payload);
          fetchMeetings(); // Refresh meetings on any change
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return {
    meetings,
    loading,
    error,
    syncMeetings,
    extractTasks,
    getMeetingTranscript,
    refreshMeetings,
    getMeetingsWithRecordings,
    getUnprocessedMeetings
  };
}; 