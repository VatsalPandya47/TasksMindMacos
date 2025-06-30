import OpenAI from 'openai';
import { supabase } from '../lib/supabase';

interface AITaskExtractorOptions {
  userId: string;
  transcript: string;
  meetingId?: string;
}

interface AIGeneratedTask {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done';
}

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    });
  }

  async extractTasksFromTranscript({
    userId, 
    transcript, 
    meetingId
  }: AITaskExtractorOptions): Promise<AIGeneratedTask[]> {
    try {
      // Use GPT-4o to extract tasks
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an AI task extraction assistant. 
            From the given meeting transcript, extract actionable tasks.
            
            Guidelines:
            - Be concise and specific
            - Prioritize tasks based on urgency and importance
            - Include a brief description if context is needed
            
            Output Format for EACH task:
            {
              "title": "Short, actionable task title",
              "description": "Optional context or details",
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
        max_tokens: 300,
      });

      // Parse the response
      const tasksText = response.choices[0].message.content || '[]';
      const tasks: AIGeneratedTask[] = JSON.parse(tasksText);

      // Insert tasks into Supabase
      const { data, error } = await supabase
        .from('tasks')
        .insert(
          tasks.map(task => ({
            user_id: userId,
            title: task.title,
            description: task.description,
            priority: task.priority,
            status: task.status,
            meeting_id: meetingId
          }))
        );

      if (error) throw error;

      return tasks;
    } catch (error) {
      console.error('AI Task Extraction Error:', error);
      throw error;
    }
  }

  async summarizeMeeting(transcript: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Provide a concise, professional summary of the meeting transcript. 
            Focus on key discussion points, decisions, and action items.
            Keep the summary under 250 words.`
          },
          {
            role: 'user',
            content: transcript
          }
        ],
        max_tokens: 300,
      });

      return response.choices[0].message.content || 'No summary generated.';
    } catch (error) {
      console.error('Meeting Summary Error:', error);
      return 'Unable to generate summary.';
    }
  }

  async analyzeTaskComplexity(tasks: string[]): Promise<{ [key: string]: number }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Analyze the complexity of the following tasks.
            Return a JSON object with task titles as keys and complexity scores (1-10) as values.
            
            Complexity Factors:
            - Required skills
            - Estimated time
            - Dependencies
            - Potential challenges`
          },
          {
            role: 'user',
            content: tasks.join('\n')
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 300,
      });

      const complexityScores = JSON.parse(
        response.choices[0].message.content || '{}'
      );

      return complexityScores;
    } catch (error) {
      console.error('Task Complexity Analysis Error:', error);
      return {};
    }
  }
} 