import React, { useState, useEffect } from 'react';
import { CopilotResponse } from '../services/CopilotService';

interface CopilotOverlayProps {
    isVisible: boolean;
    response: CopilotResponse | null;
    onDismiss: () => void;
    isListening?: boolean;
    transcript?: string;
}

type OverlayState = 'hidden' | 'listening' | 'thinking' | 'responding' | 'manual';

export const CopilotOverlay: React.FC<CopilotOverlayProps> = ({
    isVisible,
    response,
    onDismiss,
    isListening = false,
    transcript = ''
}) => {
    const [state, setState] = useState<OverlayState>('hidden');
    const [displayText, setDisplayText] = useState('');
    const [confidence, setConfidence] = useState(0);
    const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isVisible) {
            setState('hidden');
            return;
        }

        if (isListening && !response) {
            setState('listening');
            setDisplayText('Listening for questions...');
        } else if (response) {
            setState('responding');
            setDisplayText(response.answer);
            setConfidence(response.confidence);
            
            // Auto-hide after 8 seconds for low confidence, 12 seconds for high confidence
            const hideDelay = response.confidence > 0.7 ? 12000 : 8000;
            
            if (autoHideTimer) {
                clearTimeout(autoHideTimer);
            }
            
            const timer = setTimeout(() => {
                onDismiss();
            }, hideDelay);
            
            setAutoHideTimer(timer);
        }

        return () => {
            if (autoHideTimer) {
                clearTimeout(autoHideTimer);
            }
        };
    }, [isVisible, isListening, response, onDismiss]);

    if (!isVisible) return null;

    const getStateIcon = (): string => {
        switch (state) {
            case 'listening': return '🎤';
            case 'thinking': return '🧠';
            case 'responding': return '💡';
            case 'manual': return '❓';
            default: return '🤖';
        }
    };

    const getStateGradient = (): string => {
        switch (state) {
            case 'listening': return 'from-blue-400 to-blue-600';
            case 'thinking': return 'from-yellow-400 to-orange-500';
            case 'responding': return 'from-green-400 to-emerald-600';
            case 'manual': return 'from-purple-400 to-purple-600';
            default: return 'from-gray-400 to-gray-600';
        }
    };

    const getConfidenceColor = (): string => {
        if (confidence > 0.8) return 'text-green-400';
        if (confidence > 0.6) return 'text-yellow-400';
        return 'text-orange-400';
    };

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[420px] max-w-[90vw] z-[999999] font-['SF_Pro_Display','Inter',system-ui,sans-serif]">
            {/* Main Overlay */}
            <div className={`
                relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl 
                transition-all duration-500 ease-out
                ${state === 'hidden' 
                    ? 'opacity-0 scale-95 translate-y-4' 
                    : 'opacity-100 scale-100 translate-y-0'
                }
            `}>
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${getStateGradient()} opacity-5 rounded-2xl`}></div>
                
                {/* Header */}
                <div className="relative flex items-center justify-between p-6 pb-4">
                    <div className="flex items-center space-x-3">
                        {/* State Indicator */}
                        <div className={`
                            w-10 h-10 rounded-xl flex items-center justify-center text-lg
                            bg-gradient-to-r ${getStateGradient()} shadow-lg
                            ${state === 'listening' ? 'animate-pulse' : ''}
                        `}>
                            <span className="text-white">{getStateIcon()}</span>
                        </div>
                        
                        {/* Title */}
                        <div>
                            <h2 className="text-lg font-semibold text-white tracking-wide">TaskMind Copilot</h2>
                            {confidence > 0 && (
                                <span className={`text-xs font-medium ${getConfidenceColor()}`}>
                                    {Math.round(confidence * 100)}% confidence
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {/* Dismiss Button */}
                    <button 
                        onClick={onDismiss}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 
                                   flex items-center justify-center text-white/70 hover:text-white 
                                   transition-all duration-200 hover:scale-105"
                        title="Dismiss (ESC)"
                    >
                        <span className="text-sm">✕</span>
                    </button>
                </div>

                {/* Content */}
                <div className="relative px-6 pb-6">
                    {state === 'listening' && (
                        <div className="space-y-4">
                            {/* Audio Visualizer */}
                            <div className="flex items-center justify-center space-x-1 h-8">
                                {[...Array(5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`
                                            w-1 bg-gradient-to-t from-blue-400 to-blue-600 rounded-full
                                            animate-pulse
                                        `}
                                        style={{
                                            height: `${Math.random() * 20 + 8}px`,
                                            animationDelay: `${i * 0.1}s`,
                                            animationDuration: '1s'
                                        }}
                                    />
                                ))}
                            </div>
                            
                            <p className="text-base text-white/90 text-center leading-snug">
                                Listening for questions...
                            </p>
                            
                            {transcript && (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-3">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                        <span className="text-xs font-medium text-white/60 uppercase tracking-wide">Live Transcript</span>
                                    </div>
                                    <p className="text-sm text-white/80 leading-relaxed">
                                        {transcript.slice(-150)}...
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {state === 'responding' && response && (
                        <div className="space-y-4">
                            {/* Response Text */}
                            <p className="text-base text-white leading-snug">
                                {displayText}
                            </p>
                            
                            {/* Suggested Actions */}
                            {response.suggestedActions && response.suggestedActions.length > 0 && (
                                <div className="space-y-3">
                                    <span className="text-xs font-medium text-white/60 uppercase tracking-wide">
                                        Suggested Actions
                                    </span>
                                    <div className="space-y-2">
                                        {response.suggestedActions.slice(0, 2).map((action, index) => (
                                            <button 
                                                key={index}
                                                className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 
                                                           rounded-xl text-left text-sm text-white/90 
                                                           transition-all duration-200 hover:scale-[1.02]"
                                            >
                                                {action}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {state === 'thinking' && (
                        <div className="flex items-center justify-center space-x-3 py-4">
                            <div className="flex space-x-1">
                                {[...Array(3)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                                        style={{ animationDelay: `${i * 0.2}s` }}
                                    />
                                ))}
                            </div>
                            <span className="text-white/80 text-sm">Thinking...</span>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="relative px-6 pb-6">
                    <div className="flex items-center justify-center space-x-2">
                        <button 
                            className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 
                                       rounded-xl flex items-center justify-center 
                                       transition-all duration-200 hover:scale-105"
                            title="Ask Copilot (⌘⇧T)"
                        >
                            <span className="text-lg">💬</span>
                        </button>
                        
                        <button 
                            className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 
                                       rounded-xl flex items-center justify-center 
                                       transition-all duration-200 hover:scale-105"
                            title="Repeat Last Answer"
                        >
                            <span className="text-lg">🔄</span>
                        </button>
                        
                        <button 
                            className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 
                                       rounded-xl flex items-center justify-center 
                                       transition-all duration-200 hover:scale-105"
                            title="Settings"
                        >
                            <span className="text-lg">⚙️</span>
                        </button>
                    </div>
                </div>

                {/* Subtle glow effect */}
                <div className={`
                    absolute -inset-0.5 bg-gradient-to-r ${getStateGradient()} 
                    rounded-2xl opacity-20 blur-sm -z-10
                    ${state === 'listening' ? 'animate-pulse' : ''}
                `}></div>
            </div>

            {/* Keyboard Shortcut Hint */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-1">
                    <span className="text-xs text-white/60">Press ESC to dismiss</span>
                </div>
            </div>
        </div>
    );
}; 