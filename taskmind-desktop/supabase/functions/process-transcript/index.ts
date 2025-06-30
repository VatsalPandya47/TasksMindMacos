import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.29.2'

// Configuration
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const openaiApiKey = Deno.env.get('OPENAI_API_KEY') ?? ''

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
const openai = new OpenAI({ apiKey: openaiApiKey })

interface ProcessTranscriptRequest {
  meetingId: string;
  userId: string;
  transcript: string;
  extractTasks?: boolean;
  generateSummary?: boolean;
}

interface ExtractedTask {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo';
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
    const { 
      meetingId, 
      userId, 
      transcript, 
      extractTasks = true, 
      generateSummary = true 
    } = await req.json() as ProcessTranscriptRequest

    const results: any = {}

    // Extract tasks using AI
    if (extractTasks) {
      const taskResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Extract actionable tasks from this meeting transcript.
            Return a JSON object with "tasks" array containing:
            {
              "title": "Clear, actionable task",
              "description": "Brief context if needed",
              "priority": "low/medium/high",
              "status": "todo"
            }`
          },
          {
            role: 'user',
            content: transcript
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 500
      })

      const tasksData = JSON.parse(taskResponse.choices[0].message.content || '{"tasks":[]}')
      const extractedTasks: ExtractedTask[] = tasksData.tasks || []

      // Insert tasks into database
      if (extractedTasks.length > 0) {
        const { data: tasksInserted, error: tasksError } = await supabase
          .from('tasks')
          .insert(
            extractedTasks.map(task => ({
              user_id: userId,
              title: task.title,
              description: task.description,
              priority: task.priority,
              status: task.status,
              meeting_id: meetingId,
              created_at: new Date().toISOString()
            }))
          )

        if (tasksError) {
          console.error('Error inserting tasks:', tasksError)
        } else {
          results.tasks = extractedTasks
        }
      }
    }

    // Generate meeting summary
    if (generateSummary) {
      const summaryResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Create a comprehensive meeting summary with these sections:
            - Key Topics Discussed
            - Important Decisions Made
            - Action Items Identified
            - Next Steps
            Keep it professional and concise.`
          },
          {
            role: 'user',
            content: transcript
          }
        ],
        max_tokens: 400
      })

      const summary = summaryResponse.choices[0].message.content || 'No summary generated'

      // Store summary in database
      const { data: summaryData, error: summaryError } = await supabase
        .from('meeting_summaries')
        .insert({
          meeting_id: meetingId,
          user_id: userId,
          summary: summary,
          created_at: new Date().toISOString()
        })

      if (summaryError) {
        console.error('Error storing summary:', summaryError)
      } else {
        results.summary = summary
      }
    }

    // Notify Slack if configured
    try {
      const slackWebhook = Deno.env.get('SLACK_WEBHOOK_URL')
      if (slackWebhook && results.tasks?.length > 0) {
        await fetch(slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🎯 TaskMind extracted ${results.tasks.length} tasks from meeting ${meetingId}`
          })
        })
      }
    } catch (slackError) {
      console.warn('Slack notification failed:', slackError)
    }

    return new Response(JSON.stringify({
      success: true,
      meetingId,
      ...results
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    })

  } catch (error) {
    console.error('Process transcript error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to process transcript', 
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