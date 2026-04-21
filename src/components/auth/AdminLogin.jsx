import React, { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabase';
import { Button, Card } from '../ui';

export const AdminLogin = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { data, error: dbError } = await supabase
        .from('admin_settings')
        .select('admin_password')
        .single();
      
      if (dbError) throw dbError;
      
      if (data.admin_password === password) {
        onLogin(rememberDevice);
      } else {
        setError('Incorrect password');
      }
    } catch (err) {
      setError('Error checking password');
      console.error(err);
    }
    
    setLoading(false);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--primary-color, #1B4D5C)' }}>
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#C9A227' }}>
            <Lock size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
          <p className="text-gray-500 mt-1">Enter password to continue</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 mb-4"
            style={{ '--tw-ring-color': '#1B4D5C' }}
          />
          
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">Remember this device</span>
          </label>
          
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm mb-4">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Checking...' : 'Enter Admin Mode'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
