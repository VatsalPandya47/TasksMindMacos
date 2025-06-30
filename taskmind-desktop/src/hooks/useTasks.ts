import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SlackService } from '../services/SlackService';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done';
  meeting_id?: string;
  assigned_to?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  createTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  refreshTasks: () => Promise<void>;
  getTasksByMeeting: (meetingId: string) => Task[];
  getTasksByStatus: (status: Task['status']) => Task[];
}

export const useTasks = (userId: string): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const slackService = new SlackService();

  // Fetch tasks from Supabase
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      setTasks(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create new task
  const createTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task | null> => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      const newTask = data as Task;
      setTasks(prev => [newTask, ...prev]);

      // Send Slack notification
      try {
        await slackService.sendTaskNotification({
          taskTitle: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          assignedTo: newTask.assigned_to
        });
      } catch (slackError) {
        console.warn('Slack notification failed:', slackError);
      }

      return newTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      console.error('Error creating task:', err);
      return null;
    }
  };

  // Update existing task
  const updateTask = async (id: string, updates: Partial<Task>): Promise<boolean> => {
    try {
      const { error: supabaseError } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (supabaseError) throw supabaseError;

      setTasks(prev => 
        prev.map(task => 
          task.id === id 
            ? { ...task, ...updates, updated_at: new Date().toISOString() }
            : task
        )
      );

      // Send Slack notification for status changes
      if (updates.status === 'done') {
        const task = tasks.find(t => t.id === id);
        if (task) {
          try {
            await slackService.notifyWorkflow(
              `✅ Task completed: "${task.title}" by ${task.assigned_to || 'Unknown'}`
            );
          } catch (slackError) {
            console.warn('Slack notification failed:', slackError);
          }
        }
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      console.error('Error updating task:', err);
      return false;
    }
  };

  // Delete task
  const deleteTask = async (id: string): Promise<boolean> => {
    try {
      const { error: supabaseError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (supabaseError) throw supabaseError;

      setTasks(prev => prev.filter(task => task.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      console.error('Error deleting task:', err);
      return false;
    }
  };

  // Utility functions
  const getTasksByMeeting = (meetingId: string): Task[] => {
    return tasks.filter(task => task.meeting_id === meetingId);
  };

  const getTasksByStatus = (status: Task['status']): Task[] => {
    return tasks.filter(task => task.status === status);
  };

  const refreshTasks = async () => {
    await fetchTasks();
  };

  // Initial fetch and real-time subscription
  useEffect(() => {
    fetchTasks();

    // Set up real-time subscription
    const subscription = supabase
      .channel('tasks_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks',
          filter: `user_id=eq.${userId}`
        }, 
        (payload) => {
          console.log('Real-time task update:', payload);
          fetchTasks(); // Refresh tasks on any change
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks,
    getTasksByMeeting,
    getTasksByStatus
  };
}; 