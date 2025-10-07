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
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, loginWithGoogle, resetPassword, trackActivity } = useAuth();

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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      await trackActivity('user_login', { method: 'google' });
      toast.success('Google দিয়ে সফলভাবে সাইন ইন হয়েছে');
    } catch (error) {
      console.error('Google sign-in error:', error);
      let errorMessage = 'Google সাইন ইন করতে ব্যর্থ';

      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'সাইন ইন বাতিল করা হয়েছে';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'পপআপ ব্লক করা হয়েছে। দয়া করে পপআপ অনুমতি দিন';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'ইন্টারনেট সংযোগ সমস্যা। দয়া করে আবার চেষ্টা করুন';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'এই ইমেইল দিয়ে ইতিমধ্যে অন্য পদ্ধতিতে অ্যাকাউন্ট আছে';
          break;
        default:
          errorMessage = 'Google সাইন ইন করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন';
      }

      toast.error(errorMessage);
    } finally {
      setGoogleLoading(false);
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
      toast.success('পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে! ইমেইল না পেলে স্প্যাম/জাঙ্ক ফোল্ডার চেক করুন।', {
        autoClose: 8000
      });
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
          <p className="text-lg text-gray-600">চালিয়ে যেতে সাইন ইন করুন</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
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
              className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
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
                <span>লগইন</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-4 mb-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">অথবা</span>
            </div>
          </div>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg font-medium transition-colors"
        >
          {googleLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Google দিয়ে সাইন ইন করুন</span>
            </>
          )}
        </button>

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
          <p className="text-lg text-gray-600">
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