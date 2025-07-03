/// <reference path="../types/global.d.ts" />
import React, { useState, useEffect, useRef } from "react";

interface AppState {
  copilotActive: boolean;
  statusMessage: string;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    copilotActive: false,
    statusMessage: "TaskMind Copilot ready to activate",
  });

  const [taskStats, setTaskStats] = useState({
    activeTasks: 3,
    completedTasks: 12,
    blockers: 1,
    upcomingMeetings: 2,
  });
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const recordedChunksRef = useRef([]);

  useEffect(() => {
    // Test electron API
    const electronAPI = (window as any).electronAPI;
    if (electronAPI) {
      electronAPI
        .getAppInfo()
        .then((info: any) => {
          console.log("App info:", info);
          setState((prev) => ({
            ...prev,
            statusMessage: `TaskMind Copilot ready (${info.platform})`,
          }));
        })
        .catch((error: any) => {
          console.error("Failed to get app info:", error);
        });
    }
  }, []);

  const toggleCopilot = async () => {
    try {
      setState((prev) => ({
        ...prev,
        copilotActive: !prev.copilotActive,
        statusMessage: !prev.copilotActive
          ? "Copilot activated!"
          : "Copilot deactivated",
      }));

      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.showNotification) {
        await electronAPI.showNotification(
          "TaskMind Copilot",
          !state.copilotActive ? "Copilot activated!" : "Copilot deactivated"
        );
      }
    } catch (error) {
      console.error("Failed to toggle copilot:", error);
    }
  };

  const askManualQuestion = async () => {
    const question = prompt("Ask TaskMind Copilot:");
    if (question?.trim()) {
      setState((prev) => ({
        ...prev,
        statusMessage: `Processing: "${question}"`,
      }));

      // Simulate response
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          statusMessage:
            "Response: I found 3 active tasks and 1 blocker. Would you like details?",
        }));
      }, 2000);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing mic:", err);
      alert("Microphone access is required");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-['SF_Pro_Display','Inter',system-ui,sans-serif] overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>

      {/* Main Container */}
      <div className="relative flex flex-col min-h-screen">
        {/* Header */}
        <header className="relative z-10 p-8">
          <div className="max-w-6xl mx-auto">
            {/* App Title */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 text-2xl shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
                  🧠
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    TaskMind Desktop
                  </h1>
                  <p className="text-sm font-medium text-white/60">
                    AI-Powered Meeting Intelligence
                  </p>
                </div>
              </div>

              {/* Window Controls */}
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>

            {/* Copilot Status Card */}
            <div className="p-6 border shadow-2xl bg-white/10 backdrop-blur-md border-white/20 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 ${
                      state.copilotActive
                        ? "bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-500/30"
                        : "bg-white/10 border border-white/20"
                    }`}
                  >
                    {state.copilotActive ? "🧠" : "⏸️"}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Copilot Status</h3>
                    <p className="text-sm text-white/70">
                      {state.statusMessage}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={toggleCopilot}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                      state.copilotActive
                        ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
                        : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30"
                    }`}
                  >
                    {state.copilotActive ? "Stop" : "Start"} Copilot
                  </button>

                  <button
                    onClick={askManualQuestion}
                    className="px-6 py-3 font-medium text-white transition-all duration-300 border bg-white/10 hover:bg-white/20 border-white/20 rounded-xl backdrop-blur-sm"
                    title="Ask Copilot (⌘⇧T)"
                  >
                    💬 Ask
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Dashboard */}
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-6">
              <div className="p-6 transition-all duration-300 border bg-white/10 backdrop-blur-md border-white/20 rounded-2xl hover:bg-white/15 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-500/20 rounded-xl">
                    <span className="text-lg text-blue-400">📋</span>
                  </div>
                  <span className="text-2xl font-bold transition-transform duration-300 group-hover:scale-110">
                    {taskStats.activeTasks}
                  </span>
                </div>
                <h3 className="font-medium text-white/90">Active Tasks</h3>
                <p className="text-sm text-white/60">Currently in progress</p>
              </div>

              <div className="p-6 transition-all duration-300 border bg-white/10 backdrop-blur-md border-white/20 rounded-2xl hover:bg-white/15 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-500/20 rounded-xl">
                    <span className="text-lg text-green-400">✅</span>
                  </div>
                  <span className="text-2xl font-bold transition-transform duration-300 group-hover:scale-110">
                    {taskStats.completedTasks}
                  </span>
                </div>
                <h3 className="font-medium text-white/90">Completed</h3>
                <p className="text-sm text-white/60">Tasks finished</p>
              </div>

              <div className="p-6 transition-all duration-300 border bg-white/10 backdrop-blur-md border-white/20 rounded-2xl hover:bg-white/15 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-red-500/20 rounded-xl">
                    <span className="text-lg text-red-400">🚫</span>
                  </div>
                  <span className="text-2xl font-bold transition-transform duration-300 group-hover:scale-110">
                    {taskStats.blockers}
                  </span>
                </div>
                <h3 className="font-medium text-white/90">Blockers</h3>
                <p className="text-sm text-white/60">Need attention</p>
              </div>

              <div className="p-6 transition-all duration-300 border bg-white/10 backdrop-blur-md border-white/20 rounded-2xl hover:bg-white/15 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-purple-500/20 rounded-xl">
                    <span className="text-lg text-purple-400">📅</span>
                  </div>
                  <span className="text-2xl font-bold transition-transform duration-300 group-hover:scale-110">
                    {taskStats.upcomingMeetings}
                  </span>
                </div>
                <h3 className="font-medium text-white/90">Meetings</h3>
                <p className="text-sm text-white/60">Coming up</p>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-8 transition-all duration-300 border bg-white/10 backdrop-blur-md border-white/20 rounded-2xl hover:bg-white/15">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 text-2xl bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl">
                    🎤
                  </div>
                  <div>
                    <h3 className="mb-2 text-xl font-semibold">
                      Real-time Audio
                    </h3>
                    <p className="leading-relaxed text-white/70">
                      Captures meeting audio and transcribes with Whisper AI for
                      instant insights and responses.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 transition-all duration-300 border bg-white/10 backdrop-blur-md border-white/20 rounded-2xl hover:bg-white/15">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 text-2xl bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl">
                    🤖
                  </div>
                  <div>
                    <h3 className="mb-2 text-xl font-semibold">
                      Smart Responses
                    </h3>
                    <p className="leading-relaxed text-white/70">
                      GPT-4o provides instant answers about tasks, blockers, and
                      project status.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 transition-all duration-300 border bg-white/10 backdrop-blur-md border-white/20 rounded-2xl hover:bg-white/15">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 text-2xl bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl">
                    ⚡
                  </div>
                  <div>
                    <h3 className="mb-2 text-xl font-semibold">
                      Global Hotkeys
                    </h3>
                    <p className="leading-relaxed text-white/70">
                      ⌘⇧T to ask questions, ⌘⇧H to hide/show, ⌘⇧R to toggle
                      recording.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 transition-all duration-300 border bg-white/10 backdrop-blur-md border-white/20 rounded-2xl hover:bg-white/15">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 text-2xl bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl">
                    📊
                  </div>
                  <div>
                    <h3 className="mb-2 text-xl font-semibold">
                      Task Integration
                    </h3>
                    <p className="leading-relaxed text-white/70">
                      Connects with your task board and project data for
                      contextual assistance.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sample Questions */}
            <div className="p-8 border bg-white/10 backdrop-blur-md border-white/20 rounded-2xl">
              <h2 className="mb-6 text-2xl font-bold">Try These Questions</h2>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => askManualQuestion()}
                  className="p-4 text-left transition-all duration-300 border bg-white/5 hover:bg-white/10 border-white/10 rounded-xl hover:scale-105"
                >
                  <span className="text-white/90">
                    "What did we finish last week?"
                  </span>
                </button>
                <button
                  onClick={() => askManualQuestion()}
                  className="p-4 text-left transition-all duration-300 border bg-white/5 hover:bg-white/10 border-white/10 rounded-xl hover:scale-105"
                >
                  <span className="text-white/90">"Any current blockers?"</span>
                </button>
                <button
                  onClick={() => askManualQuestion()}
                  className="p-4 text-left transition-all duration-300 border bg-white/5 hover:bg-white/10 border-white/10 rounded-xl hover:scale-105"
                >
                  <span className="text-white/90">
                    "What meetings do we have coming up?"
                  </span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
