import OpenAI from 'openai';
import { environment } from '../config/environment';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIService {
  private client: OpenAI;
  private model: string = 'gpt-4o';

  constructor() {
    const apiKey = environment.openaiApiKey;
    
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    this.client = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Only for Electron renderer process
    });
  }

  // ... existing code ...
} 