import { AudioCaptureService } from './AudioCaptureService';
import { CopilotService, CopilotResponse, TaskContext } from './CopilotService';

export interface CopilotConfig {
    enableAutoResponse: boolean;
    confidenceThreshold: number;
    audioProcessingInterval: number;
    overlayAutoHideDuration: number;
    enableNotifications: boolean;
}

export interface CopilotCallbacks {
    onOverlayShow: (response: CopilotResponse) => void;
    onOverlayHide: () => void;
    onListeningUpdate: (isListening: boolean, transcript?: string) => void;
    onError: (error: string) => void;
    onStatusUpdate: (status: string) => void;
}

export class CopilotOrchestrator {
    private audioService: AudioCaptureService;
    private copilotService: CopilotService;
    private isInitialized = false;
    private isActive = false;
    private currentResponse: CopilotResponse | null = null;
    private lastQuestionTime = 0;
    private debounceDelay = 3000; // 3 seconds between questions
    
    private config: CopilotConfig = {
        enableAutoResponse: true,
        confidenceThreshold: 0.6,
        audioProcessingInterval: 5000,
        overlayAutoHideDuration: 10000,
        enableNotifications: true
    };

    constructor(private callbacks: CopilotCallbacks) {
        this.copilotService = new CopilotService();
        this.audioService = new AudioCaptureService(
            this.handleTranscriptUpdate.bind(this),
            this.handleQuestionDetected.bind(this)
        );
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Request microphone permissions
            await navigator.mediaDevices.getUserMedia({ audio: true });
            
            this.isInitialized = true;
            this.callbacks.onStatusUpdate('🧠 TaskMind Copilot initialized and ready');
            
            console.log('🚀 Copilot Orchestrator initialized');
            
        } catch (error) {
            const errorMsg = 'Failed to initialize copilot: Microphone access required';
            this.callbacks.onError(errorMsg);
            throw new Error(errorMsg);
        }
    }

    async startListening(): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.isActive) return;

        try {
            await this.audioService.startCapture();
            this.isActive = true;
            
            this.callbacks.onListeningUpdate(true);
            this.callbacks.onStatusUpdate('🎤 Listening for meeting questions...');
            
            console.log('🎧 Copilot started listening');
            
        } catch (error) {
            const errorMsg = 'Failed to start audio capture';
            this.callbacks.onError(errorMsg);
            console.error('Audio capture error:', error);
        }
    }

    async stopListening(): Promise<void> {
        if (!this.isActive) return;

        try {
            await this.audioService.stopCapture();
            this.isActive = false;
            
            this.callbacks.onListeningUpdate(false);
            this.callbacks.onStatusUpdate('⏸️ Copilot paused');
            
            console.log('🛑 Copilot stopped listening');
            
        } catch (error) {
            console.error('Failed to stop audio capture:', error);
        }
    }

    updateTaskContext(context: TaskContext): void {
        this.copilotService.updateTaskContext(context);
        console.log('📊 Task context updated for copilot');
    }

    updateConfig(newConfig: Partial<CopilotConfig>): void {
        this.config = { ...this.config, ...newConfig };
        console.log('⚙️ Copilot configuration updated:', newConfig);
    }

    async askManualQuestion(question: string): Promise<CopilotResponse | null> {
        try {
            this.callbacks.onStatusUpdate('🤔 Processing your question...');
            
            const response = await this.copilotService.askCopilot(question);
            
            if (response && response.confidence >= this.config.confidenceThreshold) {
                this.currentResponse = response;
                this.callbacks.onOverlayShow(response);
                
                if (this.config.enableNotifications && window.electronAPI?.showNotification) {
                    window.electronAPI.showNotification(
                        'TaskMind Copilot', 
                        response.answer
                    );
                }
                
                console.log('💬 Manual question answered:', response.answer);
                return response;
            } else {
                const errorMsg = 'I need more context to answer that question accurately.';
                this.callbacks.onError(errorMsg);
                return null;
            }
            
        } catch (error) {
            const errorMsg = 'Failed to process your question';
            this.callbacks.onError(errorMsg);
            console.error('Manual question error:', error);
            return null;
        }
    }

    private handleTranscriptUpdate(transcript: string): void {
        // Update listening state with latest transcript
        this.callbacks.onListeningUpdate(true, transcript);
    }

    private async handleQuestionDetected(question: string, context: string): Promise<void> {
        // Debounce rapid questions
        const now = Date.now();
        if (now - this.lastQuestionTime < this.debounceDelay) {
            console.log('🔇 Question debounced:', question);
            return;
        }
        this.lastQuestionTime = now;

        if (!this.config.enableAutoResponse) {
            console.log('🔕 Auto-response disabled, ignoring question:', question);
            return;
        }

        try {
            console.log('🧠 Processing detected question:', question);
            this.callbacks.onStatusUpdate('🤖 Analyzing question...');

            const response = await this.copilotService.processQuestion(question, context);

            if (response && response.confidence >= this.config.confidenceThreshold) {
                this.currentResponse = response;
                this.callbacks.onOverlayShow(response);
                
                if (this.config.enableNotifications && window.electronAPI?.showNotification) {
                    window.electronAPI.showNotification(
                        'TaskMind Copilot', 
                        `Q: ${question.slice(0, 50)}...\nA: ${response.answer}`
                    );
                }
                
                console.log(`✅ Question answered (${Math.round(response.confidence * 100)}% confidence):`, response.answer);
                
            } else {
                console.log('❌ Low confidence or no response for question:', question);
                this.callbacks.onStatusUpdate('🤷 Question detected but insufficient context');
            }
            
        } catch (error) {
            console.error('Error processing detected question:', error);
            this.callbacks.onError('Failed to process detected question');
        }
    }

    repeatLastResponse(): void {
        if (this.currentResponse) {
            this.callbacks.onOverlayShow(this.currentResponse);
            console.log('🔄 Repeated last copilot response');
        } else {
            this.callbacks.onError('No previous response to repeat');
        }
    }

    clearHistory(): void {
        this.copilotService.clearHistory();
        this.currentResponse = null;
        console.log('🗑️ Copilot history cleared');
    }

    // Global hotkey handlers (to be registered with Electron)
    registerGlobalHotkeys(): void {
        if (window.electronAPI?.registerGlobalHotkey) {
            // Cmd+Shift+T: Ask Copilot
            window.electronAPI.registerGlobalHotkey('CommandOrControl+Shift+T', () => {
                this.triggerManualQuestion();
            });

            // Cmd+Shift+R: Repeat last response
            window.electronAPI.registerGlobalHotkey('CommandOrControl+Shift+R', () => {
                this.repeatLastResponse();
            });

            // Cmd+Shift+L: Toggle listening
            window.electronAPI.registerGlobalHotkey('CommandOrControl+Shift+L', () => {
                this.toggleListening();
            });
            
            console.log('⌨️ Global hotkeys registered');
        }
    }

    private triggerManualQuestion(): void {
        // This would trigger a modal for manual question input
        // Implementation would depend on the UI framework
        const question = prompt('Ask TaskMind Copilot:');
        if (question?.trim()) {
            this.askManualQuestion(question.trim());
        }
    }

    private async toggleListening(): Promise<void> {
        if (this.isActive) {
            await this.stopListening();
        } else {
            await this.startListening();
        }
    }

    // Status and state getters
    isListening(): boolean {
        return this.isActive;
    }

    isReady(): boolean {
        return this.isInitialized;
    }

    getConfig(): CopilotConfig {
        return { ...this.config };
    }

    getCurrentResponse(): CopilotResponse | null {
        return this.currentResponse;
    }

    getTranscriptBuffer(): string[] {
        return this.audioService.getTranscriptBuffer();
    }

    // Cleanup
    async destroy(): Promise<void> {
        if (this.isActive) {
            await this.stopListening();
        }
        
        if (window.electronAPI?.unregisterAllHotkeys) {
            window.electronAPI.unregisterAllHotkeys();
        }
        
        this.isInitialized = false;
        console.log('💀 Copilot orchestrator destroyed');
    }
} 