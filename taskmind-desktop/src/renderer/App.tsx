import React, { useState, useEffect } from 'react';

interface AppState {
    copilotActive: boolean;
    statusMessage: string;
}

const App: React.FC = () => {
    const [state, setState] = useState<AppState>({
        copilotActive: false,
        statusMessage: 'TaskMind Copilot ready to activate'
    });
    
    const [taskStats, setTaskStats] = useState({
        activeTasks: 3,
        completedTasks: 12,
        blockers: 1,
        upcomingMeetings: 2
    });

    useEffect(() => {
        // Simple initialization
        setState(prev => ({
            ...prev,
            statusMessage: 'TaskMind Copilot ready'
        }));
    }, []);

    const toggleCopilot = async () => {
        try {
            setState(prev => ({ 
                ...prev, 
                copilotActive: !prev.copilotActive,
                statusMessage: !prev.copilotActive ? 'Copilot activated!' : 'Copilot deactivated'
            }));
        } catch (error) {
            console.error('Failed to toggle copilot:', error);
        }
    };

    const askManualQuestion = async () => {
        const question = prompt('Ask TaskMind Copilot:');
        if (question?.trim()) {
            setState(prev => ({
                ...prev,
                statusMessage: `Processing: "${question}"`
            }));

            // Simulate response
            setTimeout(() => {
                setState(prev => ({
                    ...prev,
                    statusMessage: 'Response: I found 3 active tasks and 1 blocker. Would you like details?'
                }));
            }, 2000);
        }
    };

    return (
        <div className="app">
            <div className="app-container">
                <header className="app-header">
                    <div className="header-content">
                        <div className="logo-section">
                            <span className="app-logo">🧠</span>
                            <h1 className="app-title">TaskMind Desktop</h1>
                            <span className="app-subtitle">AI-Powered Meeting Intelligence</span>
                        </div>
                        
                        <div className="copilot-controls">
                            <div className="copilot-status">
                                <span className={`status-indicator ${state.copilotActive ? 'active' : 'inactive'}`}>
                                    {state.copilotActive ? '🧠' : '⏸️'}
                                </span>
                                <span className="status-text">{state.statusMessage}</span>
                            </div>
                            
                            <div className="control-buttons">
                                <button 
                                    className={`copilot-toggle ${state.copilotActive ? 'active' : ''}`}
                                    onClick={toggleCopilot}
                                    title={state.copilotActive ? 'Stop Copilot' : 'Start Copilot'}
                                >
                                    {state.copilotActive ? 'Stop' : 'Start'} Copilot
                                </button>
                                
                                <button 
                                    className="ask-button"
                                    onClick={askManualQuestion}
                                    title="Ask Copilot (⌘⇧T)"
                                >
                                    💬 Ask
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="app-main">
                    <div className="dashboard-stats">
                        <div className="stat-card">
                            <div className="stat-number">{taskStats.activeTasks}</div>
                            <div className="stat-label">Active Tasks</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{taskStats.completedTasks}</div>
                            <div className="stat-label">Completed</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{taskStats.blockers}</div>
                            <div className="stat-label">Blockers</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{taskStats.upcomingMeetings}</div>
                            <div className="stat-label">Meetings</div>
                        </div>
                    </div>

                    <div className="features-grid">
                        <div className="feature-card">
                            <h3>🎤 Real-time Audio</h3>
                            <p>Captures meeting audio and transcribes with Whisper AI</p>
                        </div>
                        <div className="feature-card">
                            <h3>🤖 Smart Responses</h3>
                            <p>GPT-4o provides instant answers about tasks and blockers</p>
                        </div>
                        <div className="feature-card">
                            <h3>⚡ Global Hotkeys</h3>
                            <p>⌘⇧T to ask questions, ⌘⇧H to hide/show</p>
                        </div>
                        <div className="feature-card">
                            <h3>📊 Task Integration</h3>
                            <p>Connects with your task board and project data</p>
                        </div>
                    </div>

                    <div className="demo-section">
                        <h2>Sample Questions</h2>
                        <div className="sample-questions">
                            <button onClick={() => askManualQuestion()}>
                                "What did we finish last week?"
                            </button>
                            <button onClick={() => askManualQuestion()}>
                                "Any current blockers?"
                            </button>
                            <button onClick={() => askManualQuestion()}>
                                "What meetings do we have coming up?"
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;
