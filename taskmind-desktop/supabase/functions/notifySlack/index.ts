import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface SlackNotificationRequest {
  type: 'task_created' | 'meeting_summary' | 'workflow_update';
  data: {
    message: string;
    taskTitle?: string;
    priority?: string;
    assignedTo?: string;
    meetingId?: string;
    summary?: string;
  };
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
    const slackWebhook = Deno.env.get('SLACK_WEBHOOK_URL')
    const slackBotToken = Deno.env.get('SLACK_BOT_TOKEN')
    const slackChannelId = Deno.env.get('SLACK_CHANNEL_ID')

    if (!slackWebhook && !slackBotToken) {
      throw new Error('Slack configuration missing')
    }

    const { type, data } = await req.json() as SlackNotificationRequest

    let slackPayload: any = {}

    switch (type) {
      case 'task_created':
        const priorityEmoji = {
          low: ':low_brightness:',
          medium: ':large_orange_diamond:',
          high: ':fire:'
        }
        
        slackPayload = {
          text: `New Task Created: ${data.taskTitle}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `${priorityEmoji[data.priority as keyof typeof priorityEmoji] || ':clipboard:'} *New Task Created*`
              }
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Task:*\n${data.taskTitle}`
                },
                {
                  type: 'mrkdwn',
                  text: `*Priority:*\n${data.priority?.toUpperCase() || 'MEDIUM'}`
                }
              ]
            },
            ...(data.assignedTo ? [{
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `Assigned to: ${data.assignedTo}`
                }
              ]
            }] : [])
          ]
        }
        break;

      case 'meeting_summary':
        slackPayload = {
          text: 'Meeting Summary Generated',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: ':memo: *Meeting Summary Generated*'
              }
            },
            {
              type: 'section',
              text: {
                type: 'plain_text',
                text: data.summary || data.message
              }
            },
            ...(data.meetingId ? [{
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `Meeting ID: ${data.meetingId}`
                }
              ]
            }] : [])
          ]
        }
        break;

      case 'workflow_update':
      default:
        slackPayload = {
          text: data.message
        }
        break;
    }

    // Send notification using webhook (preferred) or Bot API
    if (slackWebhook) {
      const response = await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload)
      })

      if (!response.ok) {
        throw new Error(`Slack webhook failed: ${response.statusText}`)
      }
    } else if (slackBotToken && slackChannelId) {
      // Use Slack Web API
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${slackBotToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: slackChannelId,
          ...slackPayload
        })
      })

      const result = await response.json()
      if (!result.ok) {
        throw new Error(`Slack API error: ${result.error}`)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Slack notification sent successfully'
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    })

  } catch (error) {
    console.error('Slack notification error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to send Slack notification', 
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