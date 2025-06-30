import { OpenAIService } from './OpenAIService';

export interface CopilotResponse {
    answer: string;
    confidence: number;
    suggestedActions?: string[];
    relatedTasks?: any[];
}

export interface TaskContext {
    activeTasks: any[];
    completedTasks: any[];
    blockers: any[];
    upcomingMeetings: any[];
    recentActivity: any[];
}

export class CopilotService {
    private openAIService: OpenAIService;
    private taskContext: TaskContext | null = null;
    private conversationHistory: Array<{ role: string; content: string }> = [];
    
    constructor() {
        this.openAIService = new OpenAIService();
    }

    updateTaskContext(context: TaskContext): void {
        this.taskContext = context;
        console.log('🧠 Copilot context updated:', {
            activeTasks: context.activeTasks?.length || 0,
            completedTasks: context.completedTasks?.length || 0,
            blockers: context.blockers?.length || 0
        });
    }

    async processQuestion(question: string, meetingContext: string): Promise<CopilotResponse | null> {
        if (!this.taskContext) {
            console.warn('⚠️ No task context available for copilot');
            return null;
        }

        try {
            const systemPrompt = this.buildSystemPrompt();
            const userPrompt = this.buildUserPrompt(question, meetingContext);

            const messages = [
                { role: 'system', content: systemPrompt },
                ...this.conversationHistory.slice(-6), // Keep last 3 exchanges
                { role: 'user', content: userPrompt }
            ];

            const response = await this.openAIService.generateCompletion({
                model: 'gpt-4o',
                messages,
                temperature: 0.3,
                max_tokens: 300,
                functions: [{
                    name: 'provide_copilot_response',
                    description: 'Provide a structured response to the meeting question',
                    parameters: {
                        type: 'object',
                        properties: {
                            answer: {
                                type: 'string',
                                description: 'Clear, concise answer to the question'
                            },
                            confidence: {
                                type: 'number',
                                description: 'Confidence level (0-1) in the response'
                            },
                            suggestedActions: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Optional follow-up actions'
                            },
                            relatedTasks: {
                                type: 'array',
                                items: { type: 'object' },
                                description: 'Related tasks from the board'
                            }
                        },
                        required: ['answer', 'confidence']
                    }
                }],
                function_call: { name: 'provide_copilot_response' }
            });

            const copilotResponse = this.parseResponse(response);
            
            // Add to conversation history
            this.conversationHistory.push(
                { role: 'user', content: question },
                { role: 'assistant', content: copilotResponse.answer }
            );

            // Keep history manageable
            if (this.conversationHistory.length > 12) {
                this.conversationHistory = this.conversationHistory.slice(-8);
            }

            return copilotResponse;
            
        } catch (error) {
            console.error('Copilot processing error:', error);
            return null;
        }
    }

    private buildSystemPrompt(): string {
        return `You are TaskMind Copilot, an intelligent meeting assistant that helps users answer questions about their work and tasks.

**Your Role:**
- Answer questions about tasks, progress, blockers, and team work
- Use the provided task board data to give accurate, specific answers
- Keep responses conversational but concise (1-2 sentences max)
- Only respond if you're confident the question is work-related

**Response Guidelines:**
- Be specific: "You completed the Slack integration and Zoom OAuth last sprint"
- Include numbers: "3 tasks in progress, 2 blockers identified"
- Mention relevant task titles or project names when helpful
- If unsure, acknowledge limitations: "I don't see specific details about that"

**Task Context Available:**
- Active tasks currently in progress
- Recently completed tasks
- Identified blockers and issues
- Upcoming meetings and deadlines
- Recent activity and updates

**Tone:** Professional but friendly, like a helpful colleague who knows your work well.`;
    }

    private buildUserPrompt(question: string, meetingContext: string): string {
        const contextSummary = this.buildContextSummary();
        
        return `**Meeting Context:**
${meetingContext}

**Question Asked:**
"${question}"

**Current Task Board State:**
${contextSummary}

Please provide a helpful response based on the available task data. If the question isn't work-related or you don't have enough context, indicate that politely.`;
    }

    private buildContextSummary(): string {
        if (!this.taskContext) return 'No task data available';

        const {
            activeTasks = [],
            completedTasks = [],
            blockers = [],
            upcomingMeetings = [],
            recentActivity = []
        } = this.taskContext;

        let summary = '';

        // Active tasks
        if (activeTasks.length > 0) {
            summary += `**Active Tasks (${activeTasks.length}):**\n`;
            activeTasks.slice(0, 5).forEach(task => {
                summary += `- ${task.title} (${task.status})\n`;
            });
            summary += '\n';
        }

        // Recently completed
        if (completedTasks.length > 0) {
            summary += `**Recently Completed (${completedTasks.length}):**\n`;
            completedTasks.slice(0, 3).forEach(task => {
                summary += `- ${task.title} (completed ${task.completedAt})\n`;
            });
            summary += '\n';
        }

        // Blockers
        if (blockers.length > 0) {
            summary += `**Current Blockers (${blockers.length}):**\n`;
            blockers.forEach(blocker => {
                summary += `- ${blocker.title}: ${blocker.description}\n`;
            });
            summary += '\n';
        }

        // Upcoming meetings
        if (upcomingMeetings.length > 0) {
            summary += `**Upcoming Meetings (${upcomingMeetings.length}):**\n`;
            upcomingMeetings.slice(0, 3).forEach(meeting => {
                summary += `- ${meeting.title} (${meeting.scheduledAt})\n`;
            });
        }

        return summary || 'No specific task data available';
    }

    private parseResponse(response: any): CopilotResponse {
        try {
            if (response.choices?.[0]?.message?.function_call?.arguments) {
                const args = JSON.parse(response.choices[0].message.function_call.arguments);
                return {
                    answer: args.answer || 'I need more context to answer that question.',
                    confidence: args.confidence || 0.5,
                    suggestedActions: args.suggestedActions || [],
                    relatedTasks: args.relatedTasks || []
                };
            }
        } catch (error) {
            console.error('Failed to parse copilot response:', error);
        }

        // Fallback to text response
        const content = response.choices?.[0]?.message?.content || 'I encountered an issue processing that question.';
        return {
            answer: content,
            confidence: 0.3,
            suggestedActions: [],
            relatedTasks: []
        };
    }

    async askCopilot(question: string): Promise<CopilotResponse | null> {
        // Manual copilot question (triggered by hotkey)
        return this.processQuestion(question, 'Manual question from user');
    }

    clearHistory(): void {
        this.conversationHistory = [];
        console.log('🧠 Copilot conversation history cleared');
    }

    getConversationHistory(): Array<{ role: string; content: string }> {
        return this.conversationHistory.slice();
    }
} 