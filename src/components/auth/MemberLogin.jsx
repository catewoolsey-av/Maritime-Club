import React, { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabase';
import { Button, Card } from '../ui';

export const MemberLogin = ({ onLogin, members }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // Password change state
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [memberToUpdate, setMemberToUpdate] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password
      });
      
      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Incorrect email or password');
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }
      
      // Get member record linked to this auth user
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .single();
      
      if (memberError || !member) {
        setError('Member record not found. Please contact your administrator.');
        await supabase.auth.signOut(); // Clean up auth session
        setLoading(false);
        return;
      }
      
      // Check if password change required
      if (member.must_change_password) {
        setMemberToUpdate(member);
        setNeedsPasswordChange(true);
        setLoading(false);
        return;
      }
      
      onLogin(member, rememberDevice);
    } catch (err) {
      setError('Error logging in. Please try again.');
      console.error(err);
    }
    
    setLoading(false);
  };
  
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      // Update password using Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) throw updateError;
      
      // Update must_change_password flag
      const { error: memberError } = await supabase
        .from('members')
        .update({ must_change_password: false })
        .eq('id', memberToUpdate.id);
      
      if (memberError) throw memberError;
      
      // Login with updated member
      const updatedMember = { ...memberToUpdate, must_change_password: false };
      onLogin(updatedMember, rememberDevice);
    } catch (err) {
      setError('Error updating password. Please try again.');
      console.error(err);
    }
    
    setLoading(false);
  };
  
  // Forgot password view
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--primary-color, #1B4D5C)' }}>
        <Card className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#C9A227' }}>
              <Lock size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              To reset your password, please email:
            </p>
            <p className="text-sm font-medium text-blue-900 mt-2">
              cate.woolsey@av.vc
            </p>
            <p className="text-xs text-blue-600 mt-2">
              Include your name and registered email address.
            </p>
          </div>
          
          <Button variant="outline" className="w-full" onClick={() => setShowForgotPassword(false)}>
            Back to Login
          </Button>
        </Card>
      </div>
    );
  }
  
  // Password change view
  if (needsPasswordChange) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--primary-color, #1B4D5C)' }}>
        <Card className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#C9A227' }}>
              <img src="/av-logo.png" alt="AV logo" className="w-8 h-8 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create Your Password</h1>
            <p className="text-gray-500 mt-1">Please set a new password to continue</p>
          </div>
          
          <form onSubmit={handlePasswordChange}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                  required
                />
              </div>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm my-4">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            
            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? 'Saving...' : 'Set Password & Continue'}
            </Button>
          </form>
        </Card>
      </div>
    );
  }
  
  // Main login view
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--primary-color, #1B4D5C)' }}>
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src="/av-logo.png" alt="AV logo" className="w-16 h-16 mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Green & Granite</h1>
          <p className="text-gray-500 mt-1">A Venture Club for Dartmouth Alumni & Friends</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between my-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
            <button 
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Forgot password?
            </button>
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm mb-4">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        
        <p className="text-center text-sm text-gray-500 mt-6">
          New member? Contact your club administrator for access.
        </p>
        
        <p className="text-center text-xs text-gray-400 mt-4 px-4">
          This portal contains confidential information.
        </p>
        <p className="text-center text-xs text-gray-400 mt-4 px-4">
          By logging in, you agree to maintain confidentiality and acknowledge this is not investment advice.
        </p>

        <p className="text-center text-xs text-gray-400 mt-4 px-4">
          Neither Alumni Ventures nor any of its fund are sponsored by, affiliated with, or endorsed by any school.
        </p>
      </Card>
    </div>
  );
};
