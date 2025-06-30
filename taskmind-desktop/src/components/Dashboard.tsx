import React, { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useMeetings } from '../hooks/useMeetings';
import { useSummarize } from '../hooks/useSummarize';
import { SlackService } from '../services/SlackService';

interface DashboardProps {
  userId: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'meetings' | 'summaries' | 'settings'>('tasks');
  const [slackConnected, setSlackConnected] = useState(false);
  
  const { 
    tasks, 
    loading: tasksLoading, 
    error: tasksError, 
    createTask, 
    updateTask,
    getTasksByStatus 
  } = useTasks(userId);
  
  const { 
    meetings, 
    loading: meetingsLoading, 
    error: meetingsError, 
    syncMeetings, 
    extractTasks,
    getMeetingsWithRecordings 
  } = useMeetings(userId);
  
  const { 
    summaries, 
    loading: summariesLoading, 
    generateSummary 
  } = useSummarize(userId);

  const slackService = new SlackService();

  // Test Slack connection
  const testSlackConnection = async () => {
    try {
      const isConnected = await slackService.testConnection();
      setSlackConnected(isConnected);
      if (isConnected) {
        await slackService.notifyWorkflow('🎉 TaskMind Desktop is now connected to Slack!');
      }
    } catch (error) {
      console.error('Slack connection test failed:', error);
      setSlackConnected(false);
    }
  };

  const handleSyncMeetings = async () => {
    const success = await syncMeetings();
    if (success) {
      alert('Meetings synced successfully!');
    }
  };

  const handleExtractTasks = async (meetingId: string) => {
    const success = await extractTasks(meetingId);
    if (success) {
      alert('Tasks extracted successfully!');
    }
  };

  const TasksTab = () => {
    const todoTasks = getTasksByStatus('todo');
    const inProgressTasks = getTasksByStatus('in-progress');
    const doneTasks = getTasksByStatus('done');

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <button
            onClick={() => createTask({
              user_id: userId,
              title: 'Sample Task',
              description: 'This is a sample task created from the dashboard',
              priority: 'medium',
              status: 'todo'
            })}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Create Sample Task
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Todo Tasks */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-3">To Do ({todoTasks.length})</h3>
            <div className="space-y-2">
              {todoTasks.map(task => (
                <div key={task.id} className="bg-white p-3 rounded border-l-4 border-red-400">
                  <h4 className="font-medium">{task.title}</h4>
                  <p className="text-sm text-gray-600">{task.description}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                    <button
                      onClick={() => updateTask(task.id, { status: 'in-progress' })}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Start
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* In Progress Tasks */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-3">In Progress ({inProgressTasks.length})</h3>
            <div className="space-y-2">
              {inProgressTasks.map(task => (
                <div key={task.id} className="bg-white p-3 rounded border-l-4 border-yellow-400">
                  <h4 className="font-medium">{task.title}</h4>
                  <p className="text-sm text-gray-600">{task.description}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                    <button
                      onClick={() => updateTask(task.id, { status: 'done' })}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Done Tasks */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-3">Done ({doneTasks.length})</h3>
            <div className="space-y-2">
              {doneTasks.map(task => (
                <div key={task.id} className="bg-white p-3 rounded border-l-4 border-green-400">
                  <h4 className="font-medium">{task.title}</h4>
                  <p className="text-sm text-gray-600">{task.description}</p>
                  <span className={`px-2 py-1 text-xs rounded ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const MeetingsTab = () => {
    const recordedMeetings = getMeetingsWithRecordings();

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Meetings</h2>
          <button
            onClick={handleSyncMeetings}
            disabled={meetingsLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {meetingsLoading ? 'Syncing...' : 'Sync Meetings'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {recordedMeetings.map(meeting => (
            <div key={meeting.id} className="bg-white p-6 rounded-lg shadow border">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{meeting.topic}</h3>
                  <p className="text-gray-600">
                    {new Date(meeting.start_time).toLocaleDateString()} • {meeting.duration} min • {meeting.participants} participants
                  </p>
                  <div className="flex items-center mt-2 space-x-4">
                    <span className="bg-green-100 text-green-800 px-2 py-1 text-xs rounded">
                      Has Recording
                    </span>
                    {meeting.processed && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded">
                        Processed
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-x-2">
                  {!meeting.processed && (
                    <button
                      onClick={() => handleExtractTasks(meeting.id)}
                      className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                    >
                      Extract Tasks
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {recordedMeetings.length === 0 && !meetingsLoading && (
          <div className="text-center py-8 text-gray-500">
            No recorded meetings found. Click "Sync Meetings" to fetch from Zoom.
          </div>
        )}
      </div>
    );
  };

  const SettingsTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">Slack Integration</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600">
              Status: {slackConnected ? 
                <span className="text-green-600 font-medium">Connected</span> : 
                <span className="text-red-600 font-medium">Not Connected</span>
              }
            </p>
            <p className="text-sm text-gray-500">
              Test your Slack integration and send notifications
            </p>
          </div>
          <button
            onClick={testSlackConnection}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Test Connection
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">Feature Status</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>AI Task Extraction</span>
            <span className="text-green-600">✓ Active</span>
          </div>
          <div className="flex justify-between">
            <span>Meeting Synchronization</span>
            <span className="text-green-600">✓ Active</span>
          </div>
          <div className="flex justify-between">
            <span>Slack Notifications</span>
            <span className="text-green-600">✓ Active</span>
          </div>
          <div className="flex justify-between">
            <span>Meeting Summaries</span>
            <span className="text-green-600">✓ Active</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (tasksLoading || meetingsLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading TaskMind...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">TaskMind Desktop</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'tasks' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Tasks ({tasks.length})
              </button>
              <button
                onClick={() => setActiveTab('meetings')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'meetings' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Meetings ({meetings.length})
              </button>
              <button
                onClick={() => setActiveTab('summaries')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'summaries' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Summaries ({summaries.length})
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'settings' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'tasks' && <TasksTab />}
        {activeTab === 'meetings' && <MeetingsTab />}
        {activeTab === 'summaries' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Meeting Summaries</h2>
            {summaries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No summaries available. Extract tasks from meetings to generate summaries.
              </div>
            ) : (
              <div className="space-y-4">
                {summaries.map(summary => (
                  <div key={summary.id} className="bg-white p-6 rounded-lg shadow border">
                    <h3 className="font-semibold mb-2">Meeting Summary</h3>
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap text-sm">{summary.summary}</pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}; 