import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SlackService } from '../services/SlackService';

export interface MeetingSummary {
  id: string;
  meeting_id: string;
  user_id: string;
  summary: string;
  structured_data?: {
    keyTopics: string[];
    decisions: string[];
    actionItems: string[];
    nextSteps: string[];
    participants?: string[];
    duration?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface UseSummarizeReturn {
  summaries: MeetingSummary[];
  loading: boolean;
  error: string | null;
  generateSummary: (meetingId: string, transcript: string, dryRun?: boolean) => Promise<MeetingSummary | null>;
  getSummaryByMeeting: (meetingId: string) => MeetingSummary | null;
  refreshSummaries: () => Promise<void>;
  deleteSummary: (summaryId: string) => Promise<boolean>;
}

export const useSummarize = (userId: string): UseSummarizeReturn => {
  const [summaries, setSummaries] = useState<MeetingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const slackService = new SlackService();

  // Fetch summaries from Supabase
  const fetchSummaries = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('meeting_summaries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      setSummaries(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch summaries');
      console.error('Error fetching summaries:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate summary using AI
  const generateSummary = async (
    meetingId: string, 
    transcript: string, 
    dryRun: boolean = false
  ): Promise<MeetingSummary | null> => {
    try {
      setError(null);

      // Call summarize edge function
      const { data, error } = await supabase.functions.invoke('summarize', {
        body: {
          meetingId,
          userId,
          transcript,
          dryRun
        }
      });

      if (error) throw error;

      let summary: MeetingSummary | null = null;

      if (!dryRun && data.storedSummary) {
        // Add to local state if stored in database
        summary = data.storedSummary as MeetingSummary;
        setSummaries(prev => [summary!, ...prev]);

        // Send Slack notification
        try {
          await slackService.sendMeetingSummary(data.summary);
        } catch (slackError) {
          console.warn('Slack notification failed:', slackError);
        }
      } else if (dryRun) {
        // Return temporary summary object for dry run
        summary = {
          id: 'temp',
          meeting_id: meetingId,
          user_id: userId,
          summary: data.summary,
          structured_data: data.structuredData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      return summary;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
      console.error('Error generating summary:', err);
      return null;
    }
  };

  // Get summary for specific meeting
  const getSummaryByMeeting = (meetingId: string): MeetingSummary | null => {
    return summaries.find(summary => summary.meeting_id === meetingId) || null;
  };

  // Delete summary
  const deleteSummary = async (summaryId: string): Promise<boolean> => {
    try {
      const { error: supabaseError } = await supabase
        .from('meeting_summaries')
        .delete()
        .eq('id', summaryId);

      if (supabaseError) throw supabaseError;

      setSummaries(prev => prev.filter(summary => summary.id !== summaryId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete summary');
      console.error('Error deleting summary:', err);
      return false;
    }
  };

  const refreshSummaries = async () => {
    await fetchSummaries();
  };

  // Initial fetch and real-time subscription
  useEffect(() => {
    fetchSummaries();

    // Set up real-time subscription
    const subscription = supabase
      .channel('summaries_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'meeting_summaries',
          filter: `user_id=eq.${userId}`
        }, 
        (payload) => {
          console.log('Real-time summary update:', payload);
          fetchSummaries(); // Refresh summaries on any change
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return {
    summaries,
    loading,
    error,
    generateSummary,
    getSummaryByMeeting,
    refreshSummaries,
    deleteSummary
  };
}; 