import React, { useState, useEffect } from 'react';
import { authMethods } from '../lib/supabase';
import { TaskProvider } from '../contexts/TaskContext';
import { Dashboard } from '../components/Dashboard';

const App: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current user on component mount
    const checkUser = async () => {
      try {
        const { data } = await authMethods.getCurrentUser();
        setUser(data.user);
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const handleSignUp = async () => {
    setError(null);
    try {
      const { data, error } = await authMethods.signUp(email, password);
      if (error) {
        setError(error.message);
      } else {
        setUser(data.user);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSignIn = async () => {
    setError(null);
    try {
      const { data, error } = await authMethods.signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        setUser(data.user);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSignOut = async () => {
    await authMethods.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading TaskMind Desktop...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {user ? (
        <TaskProvider>
          <div className="p-4">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-blue-600">TaskMind Desktop</h1>
              <button
                onClick={handleSignOut}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
            <Dashboard userId={user.id} />
          </div>
        </TaskProvider>
      ) : (
        <div className="max-w-md mx-auto pt-20">
          <h1 className="text-3xl font-bold text-blue-600 mb-6 text-center">
            TaskMind Desktop
          </h1>
          <div className="bg-white p-6 rounded-lg shadow-md">
            {error && (
              <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
                {error}
              </div>
            )}
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex space-x-4">
              <button 
                onClick={handleSignIn}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={handleSignUp}
                className="flex-1 bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App; 