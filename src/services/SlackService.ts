import { WebClient } from '@slack/web-api';
import { environment } from '../config/environment';

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
    if (!environment.slackBotToken) {
      throw new Error('Slack Bot Token is not configured');
    }

    this.client = new WebClient(environment.slackBotToken);
    this.channelId = environment.slackChannelId || '';
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.auth.test();
      return true;
    } catch (error) {
      console.error('Slack connection test failed:', error);
      return false;
    }
  }

  async notifyWorkflow(data: any): Promise<void> {
    const message = `🔄 **Workflow Update**\n${JSON.stringify(data, null, 2)}`;
    await this.sendNotification({
      text: message,
      channel: this.channelId
    });
  }

  async sendMeetingSummary(summary: string): Promise<void> {
    const message = `📝 **Meeting Summary**\n${summary}`;
    await this.sendNotification({
      text: message,
      channel: this.channelId
    });
  }

  async sendTaskNotification(task: TaskNotification): Promise<void> {
    const priorityEmoji = {
      low: '🟢',
      medium: '🟡', 
      high: '🔴'
    };

    const message = `${priorityEmoji[task.priority]} **Task Update**\n*${task.taskTitle}*\n${task.description || ''}\n${task.assignedTo ? `👤 ${task.assignedTo}` : ''}`;

    await this.sendNotification({
      text: message,
      channel: this.channelId
    });
  }

  async sendNotification(options: SlackNotificationOptions): Promise<void> {
    try {
      await this.client.chat.postMessage({
        channel: options.channel || this.channelId,
        text: options.text,
        blocks: options.blocks
      });
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
      throw error;
    }
  }
} 