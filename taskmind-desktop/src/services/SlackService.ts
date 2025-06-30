import { WebClient } from '@slack/web-api';

interface SlackNotificationOptions {
  channel?: string;
  text: string;
  blocks?: any[];
}

interface TaskNotification {
  taskTitle: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
}

export class SlackService {
  private client: WebClient;
  private channelId: string;

  constructor() {
    if (!import.meta.env.VITE_SLACK_BOT_TOKEN) {
      throw new Error('Slack Bot Token is not configured');
    }

    this.client = new WebClient(import.meta.env.VITE_SLACK_BOT_TOKEN);
    this.channelId = import.meta.env.VITE_SLACK_CHANNEL_ID || '';
  }

  async sendTaskNotification(task: TaskNotification): Promise<void> {
    const priorityEmoji = {
      low: ':low_brightness:',
      medium: ':large_orange_diamond:',
      high: ':fire:'
    };

    try {
      await this.client.chat.postMessage({
        channel: this.channelId,
        text: `New Task Created: ${task.taskTitle}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${priorityEmoji[task.priority]} *New Task:* ${task.taskTitle}`
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn' as const,
                text: task.description || 'No additional description'
              }
            ]
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn' as const,
                text: `*Priority:* ${task.priority.toUpperCase()}`
              },
              ...(task.assignedTo ? [{
                type: 'mrkdwn' as const,
                text: `*Assigned to:* ${task.assignedTo}`
              }] : [])
            ]
          }
        ]
      });
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  async sendMeetingSummary(summary: string): Promise<void> {
    try {
      await this.client.chat.postMessage({
        channel: this.channelId,
        text: 'Meeting Summary',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: ':memo: *Meeting Summary*'
            }
          },
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text: summary
            }
          }
        ]
      });
    } catch (error) {
      console.error('Failed to send meeting summary:', error);
    }
  }

  async notifyWorkflow(message: string): Promise<void> {
    try {
      await this.client.chat.postMessage({
        channel: this.channelId,
        text: message
      });
    } catch (error) {
      console.error('Failed to send workflow notification:', error);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.client.auth.test();
      return result.ok || false;
    } catch (error) {
      console.error('Slack connection test failed:', error);
      return false;
    }
  }
} 