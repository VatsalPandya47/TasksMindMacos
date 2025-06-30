export class AudioCaptureService {
    private mediaRecorder: MediaRecorder | null = null;
    private audioStream: MediaStream | null = null;
    private audioChunks: Blob[] = [];
    private isRecording = false;
    private transcriptBuffer: string[] = [];
    private lastProcessedTime = 0;
    
    // Rolling transcript buffer (last 30 seconds)
    private readonly BUFFER_DURATION = 30000; // 30 seconds
    private readonly PROCESS_INTERVAL = 5000; // Check every 5 seconds
    
    constructor(
        private onTranscriptUpdate: (transcript: string) => void,
        private onQuestionDetected: (question: string, context: string) => void
    ) {}

    async startCapture(): Promise<void> {
        try {
            // Request microphone access
            this.audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            this.mediaRecorder = new MediaRecorder(this.audioStream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                    this.processAudioChunk();
                }
            };

            this.mediaRecorder.start(1000); // Capture 1-second chunks
            this.isRecording = true;
            
            console.log('🎤 Audio capture started - Listening for meeting intelligence...');
            
            // Start processing timer
            this.startProcessingTimer();
            
        } catch (error) {
            console.error('Failed to start audio capture:', error);
            throw error;
        }
    }

    private async processAudioChunk(): Promise<void> {
        if (this.audioChunks.length === 0) return;

        try {
            // Get the latest audio chunk
            const audioBlob = new Blob(this.audioChunks.slice(-5), { type: 'audio/webm' });
            
            // Send to Whisper for transcription
            const transcript = await this.transcribeAudio(audioBlob);
            
            if (transcript.trim()) {
                // Add to rolling buffer
                this.transcriptBuffer.push(`${Date.now()}: ${transcript}`);
                this.cleanOldTranscripts();
                
                // Notify listeners
                this.onTranscriptUpdate(transcript);
                
                // Check for questions every 5 seconds
                const now = Date.now();
                if (now - this.lastProcessedTime > this.PROCESS_INTERVAL) {
                    this.checkForQuestions();
                    this.lastProcessedTime = now;
                }
            }
            
        } catch (error) {
            console.error('Audio processing error:', error);
        }
    }

    private async transcribeAudio(audioBlob: Blob): Promise<string> {
        // Convert to format Whisper expects
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-1');
        formData.append('language', 'en');

        try {
            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`
                },
                body: formData
            });

            const result = await response.json();
            return result.text || '';
            
        } catch (error) {
            console.error('Whisper transcription failed:', error);
            return '';
        }
    }

    private checkForQuestions(): void {
        const recentTranscript = this.getRecentTranscript();
        
        // Question detection patterns
        const questionPatterns = [
            /what did we (finish|complete|do) (last week|this sprint|yesterday)/i,
            /any (blockers|issues|problems)/i,
            /did (you|we) (complete|finish) (the|.*)/i,
            /(what|how|when|where|why) (is|are|did|do|will)/i,
            /(status|update) on (.*)/i,
            /can you (tell me|show me|explain)/i,
            /(what's|whats) (the|our) (progress|status)/i
        ];

        for (const pattern of questionPatterns) {
            const match = recentTranscript.match(pattern);
            if (match) {
                console.log('🧠 Question detected:', match[0]);
                this.onQuestionDetected(match[0], recentTranscript);
                break;
            }
        }
    }

    private getRecentTranscript(): string {
        return this.transcriptBuffer
            .slice(-10) // Last 10 entries
            .map(entry => entry.split(': ')[1])
            .join(' ');
    }

    private cleanOldTranscripts(): void {
        const cutoff = Date.now() - this.BUFFER_DURATION;
        this.transcriptBuffer = this.transcriptBuffer.filter(entry => {
            const timestamp = parseInt(entry.split(':')[0]);
            return timestamp > cutoff;
        });
    }

    private startProcessingTimer(): void {
        setInterval(() => {
            if (this.isRecording) {
                this.checkForQuestions();
            }
        }, this.PROCESS_INTERVAL);
    }

    async stopCapture(): Promise<void> {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
        }

        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
        }

        console.log('🎤 Audio capture stopped');
    }

    getTranscriptBuffer(): string[] {
        return this.transcriptBuffer.slice();
    }

    isCurrentlyRecording(): boolean {
        return this.isRecording;
    }
} 