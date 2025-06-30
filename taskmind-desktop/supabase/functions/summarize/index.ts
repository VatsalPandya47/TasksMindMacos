import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.29.2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const openaiApiKey = Deno.env.get('OPENAI_API_KEY') ?? ''

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
const openai = new OpenAI({ apiKey: openaiApiKey })

interface SummarizeRequest {
  meetingId: string;
  userId: string;
  transcript: string;
  dryRun?: boolean;
}

interface MeetingSummary {
  keyTopics: string[];
  decisions: string[];
  actionItems: string[];
  nextSteps: string[];
  participants?: string[];
  duration?: string;
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
    const { meetingId, userId, transcript, dryRun = false } = await req.json() as SummarizeRequest

    // Generate structured summary using OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI meeting summarizer. Create a structured summary from the meeting transcript.
          
          Return a JSON object with these sections:
          {
            "keyTopics": ["topic1", "topic2", ...],
            "decisions": ["decision1", "decision2", ...],
            "actionItems": ["action1", "action2", ...],
            "nextSteps": ["step1", "step2", ...],
            "participants": ["name1", "name2", ...],
            "duration": "estimated duration"
          }
          
          Guidelines:
          - Be concise but comprehensive
          - Extract only actionable items for actionItems
          - Include clear decisions made during the meeting
          - Identify key discussion topics
          - List next steps or follow-ups mentioned`
        },
        {
          role: 'user',
          content: transcript
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 800,
      temperature: 0.3
    })

    const summaryData = JSON.parse(response.choices[0].message.content || '{}') as MeetingSummary

    // Create readable summary text
    const summaryText = `
**Key Topics Discussed:**
${summaryData.keyTopics?.map(topic => `• ${topic}`).join('\n') || 'None identified'}

**Important Decisions Made:**
${summaryData.decisions?.map(decision => `• ${decision}`).join('\n') || 'None identified'}

**Action Items:**
${summaryData.actionItems?.map(item => `• ${item}`).join('\n') || 'None identified'}

**Next Steps:**
${summaryData.nextSteps?.map(step => `• ${step}`).join('\n') || 'None identified'}

${summaryData.participants ? `\n**Participants:** ${summaryData.participants.join(', ')}` : ''}
${summaryData.duration ? `\n**Duration:** ${summaryData.duration}` : ''}
    `.trim()

    let storedSummary = null;

    // Store in database if not dry run
    if (!dryRun) {
      const { data, error } = await supabase
        .from('meeting_summaries')
        .upsert({
          meeting_id: meetingId,
          user_id: userId,
          summary: summaryText,
          structured_data: summaryData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error storing summary:', error)
        throw error
      }

      storedSummary = data

      // Notify Slack about new summary
      try {
        const slackWebhook = Deno.env.get('SLACK_WEBHOOK_URL')
        if (slackWebhook) {
          await fetch(slackWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `📝 Meeting summary generated for meeting ${meetingId}`,
              blocks: [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `*📝 New Meeting Summary*\n\n*Key Topics:* ${summaryData.keyTopics?.slice(0, 3).join(', ') || 'None'}\n*Action Items:* ${summaryData.actionItems?.length || 0} identified`
                  }
                }
              ]
            })
          })
        }
      } catch (slackError) {
        console.warn('Slack notification failed:', slackError)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      meetingId,
      summary: summaryText,
      structuredData: summaryData,
      dryRun,
      ...(storedSummary && { storedSummary })
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    })

  } catch (error) {
    console.error('Summarize error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to generate summary', 
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