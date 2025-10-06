import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, LogIn, KeyRound } from 'lucide-react';
import { toast } from 'react-toastify';

const LoginPage = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { login, resetPassword, trackActivity } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('দয়া করে সব ক্ষেত্র পূরণ করুন');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      await trackActivity('user_login', { method: 'email' });
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'লগ ইন করতে ব্যর্থ';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'এই ইমেইলের সাথে কোন অ্যাকাউন্ট পাওয়া যায়নি';
          break;
        case 'auth/wrong-password':
          errorMessage = 'ভুল পাসওয়ার্ড';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'ইমেইল অথবা পাসওয়ার্ড ভুল। দয়া করে আবার চেষ্টা করুন';
          break;
        case 'auth/invalid-email':
          errorMessage = 'অবৈধ ইমেইল ঠিকানা';
          break;
        case 'auth/user-disabled':
          errorMessage = 'এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'অনেক ব্যর্থ প্রচেষ্টা। দয়া করে পরে আবার চেষ্টা করুন';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'ইন্টারনেট সংযোগ সমস্যা। দয়া করে আবার চেষ্টা করুন';
          break;
        default:
          errorMessage = 'লগ ইন করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('পাসওয়ার্ড রিসেট করতে প্রথমে ইমেইল দিন');
      return;
    }

    setResetLoading(true);
    try {
      await resetPassword(email);
      toast.success('পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে');
    } catch (error) {
      console.error('Password reset error:', error);
      let errorMessage = 'পাসওয়ার্ড রিসেট করতে ব্যর্থ';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'এই ইমেইলের সাথে কোন অ্যাকাউন্ট পাওয়া যায়নি';
          break;
        case 'auth/invalid-email':
          errorMessage = 'অবৈধ ইমেইল ঠিকানা';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'ইন্টারনেট সংযোগ সমস্যা। দয়া করে আবার চেষ্টা করুন';
          break;
        default:
          errorMessage = 'পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন';
      }
      
      toast.error(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-xl shadow-lg p-6 mx-auto">
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-gray-900 mb-1">স্বাগতম</h1>
          <p className="text-2xl text-gray-600">চালিয়ে যেতে সাইন ইন করুন</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl"
              placeholder="ইমেইল ঠিকানা"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl"
              placeholder="পাসওয়ার্ড"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg font-medium mt-4"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>সাইন ইন</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-3 text-center">
          <button
            onClick={handleForgotPassword}
            disabled={resetLoading}
            className="text-lg text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 mx-auto"
          >
            {resetLoading ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            ) : (
              <KeyRound className="w-3 h-3" />
            )}
            পাসওয়ার্ড ভুলে গেছেন?
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-2xl text-gray-600">
            কোন অ্যাকাউন্ট নেই?{' '}
            <button
              onClick={onSwitchToSignup}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              এখানে সাইন আপ করুন
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;