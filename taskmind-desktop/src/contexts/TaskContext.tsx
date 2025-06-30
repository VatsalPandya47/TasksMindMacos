import React, { createContext, useState, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

// Task interface
export interface Task {
  id?: number;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  created_at?: string;
  user_id?: string;
}

// Context type
interface TaskContextType {
  tasks: Task[];
  addTask: (task: Task) => Promise<void>;
  updateTask: (taskId: number, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: number) => Promise<void>;
  fetchTasks: () => Promise<void>;
}

// Create context
const TaskContext = createContext<TaskContextType | undefined>(undefined);

// Provider component
export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      setTasks(data || []);
    }
  };

  const addTask = async (task: Task) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const newTask = { ...task, user_id: user.id };
    const { data, error } = await supabase
      .from('tasks')
      .insert(newTask)
      .select();

    if (error) {
      console.error('Error adding task:', error);
      throw error;
    }

    if (data) {
      setTasks(prevTasks => [...prevTasks, data[0]]);
    }
  };

  const updateTask = async (taskId: number, updates: Partial<Task>) => {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      throw error;
    }

    // Optimistically update local state
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  };

  const deleteTask = async (taskId: number) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    }

    // Optimistically remove from local state
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  return (
    <TaskContext.Provider value={{ 
      tasks, 
      addTask, 
      updateTask, 
      deleteTask, 
      fetchTasks 
    }}>
      {children}
    </TaskContext.Provider>
  );
};

// Custom hook for using the task context
export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}; 