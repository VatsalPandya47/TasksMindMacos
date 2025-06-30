import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const zoomClientId = Deno.env.get('ZOOM_CLIENT_ID') ?? ''
const zoomClientSecret = Deno.env.get('ZOOM_CLIENT_SECRET') ?? ''

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

interface SyncMeetingsRequest {
  userId: string;
  accessToken: string;
  from?: string;
  to?: string;
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, accessToken, from, to } = await req.json() as SyncMeetingsRequest

    // Default date range (last 30 days)
    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const toDate = to || new Date().toISOString().split('T')[0]

    // Fetch meetings from Zoom
    const zoomResponse = await fetch(
      `https://api.zoom.us/v2/users/me/meetings?type=past&from=${fromDate}&to=${toDate}&page_size=300`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!zoomResponse.ok) {
      throw new Error(`Zoom API error: ${zoomResponse.statusText}`)
    }

    const zoomData = await zoomResponse.json()
    const meetings = zoomData.meetings || []

    // Process each meeting
    const processedMeetings = []
    for (const meeting of meetings) {
      try {
        // Check if meeting already exists
        const { data: existingMeeting } = await supabase
          .from('zoom_meetings')
          .select('id')
          .eq('zoom_meeting_id', meeting.id)
          .single()

        if (!existingMeeting) {
          // Insert new meeting
          const { data: insertedMeeting, error } = await supabase
            .from('zoom_meetings')
            .insert({
              zoom_meeting_id: meeting.id,
              user_id: userId,
              topic: meeting.topic,
              start_time: meeting.start_time,
              duration: meeting.duration,
              participants: meeting.participants || 0,
              has_recording: false, // Will be updated separately
              created_at: new Date().toISOString()
            })
            .select()
            .single()

          if (!error) {
            processedMeetings.push(insertedMeeting)
          }
        }

        // Check for recordings
        const recordingsResponse = await fetch(
          `https://api.zoom.us/v2/meetings/${meeting.id}/recordings`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (recordingsResponse.ok) {
          const recordingsData = await recordingsResponse.json()
          if (recordingsData.recording_files && recordingsData.recording_files.length > 0) {
            // Update meeting to indicate it has recordings
            await supabase
              .from('zoom_meetings')
              .update({ 
                has_recording: true,
                recording_url: recordingsData.recording_files[0].download_url 
              })
              .eq('zoom_meeting_id', meeting.id)

            // Store recording information
            for (const recording of recordingsData.recording_files) {
              await supabase
                .from('zoom_recordings')
                .upsert({
                  zoom_meeting_id: meeting.id,
                  user_id: userId,
                  recording_type: recording.recording_type,
                  file_type: recording.file_type,
                  file_size: recording.file_size,
                  download_url: recording.download_url,
                  play_url: recording.play_url,
                  recording_start: recording.recording_start,
                  recording_end: recording.recording_end,
                  created_at: new Date().toISOString()
                })
            }
          }
        }
      } catch (meetingError) {
        console.error(`Error processing meeting ${meeting.id}:`, meetingError)
      }
    }

    // Notify Slack about sync completion
    try {
      const slackWebhook = Deno.env.get('SLACK_WEBHOOK_URL')
      if (slackWebhook) {
        await fetch(slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `📅 Synced ${processedMeetings.length} new meetings for user ${userId}`
          })
        })
      }
    } catch (slackError) {
      console.warn('Slack notification failed:', slackError)
    }

    return new Response(JSON.stringify({
      success: true,
      syncedMeetings: processedMeetings.length,
      totalMeetings: meetings.length,
      dateRange: { from: fromDate, to: toDate }
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    })

  } catch (error) {
    console.error('Sync meetings error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to sync meetings', 
      details: error.message 
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    })
  }
}) 