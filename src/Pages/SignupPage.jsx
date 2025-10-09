import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';
import FirebaseSetupGuide from '../Components/FirebaseSetupGuide';

const SignupPage = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const { signup, trackActivity, logout } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.displayName.trim()) {
      toast.error('দয়া করে আপনার নাম লিখুন');
      return false;
    }

    if (!formData.email) {
      toast.error('দয়া করে আপনার ইমেইল লিখুন');
      return false;
    }

    if (formData.password.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('পাসওয়ার্ড মিলছে না');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await signup(formData.email, formData.password, formData.displayName);
      await trackActivity('user_signup', { method: 'email' });

      // Sign out the user immediately after signup so they need to sign in
      await logout();

      // Account created successfully - user will be redirected

      // Show redirecting state
      setRedirecting(true);

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        onSwitchToLogin();
      }, 2000);
    } catch (error) {
      // Check if it's a configuration error
      if (error.message.includes('Authentication service is not properly configured') ||
        error.message.includes('configuration-not-found')) {
        setShowSetupGuide(true);
        return;
      }

      let errorMessage = 'অ্যাকাউন্ট তৈরি করতে ব্যর্থ';

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'এই ইমেইলের সাথে ইতিমধ্যে একটি অ্যাকাউন্ট আছে';
          break;
        case 'auth/invalid-email':
          errorMessage = 'অবৈধ ইমেইল ঠিকানা';
          break;
        case 'auth/weak-password':
          errorMessage = 'পাসওয়ার্ড খুবই দুর্বল';
          break;
        default:
          errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showSetupGuide && (
        <FirebaseSetupGuide onClose={() => setShowSetupGuide(false)} />
      )}

      {redirecting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 text-center max-w-sm w-full">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">অ্যাকাউন্ট তৈরি হয়েছে!</h3>
            <p className="text-gray-600 text-base mb-4">
              আপনার নতুন অ্যাকাউন্ট দিয়ে সাইন ইন করতে রিডাইরেক্ট করা হচ্ছে...
            </p>
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            </div>
          </div>
        </div>
      )}

      <div className="h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-xl shadow-lg p-6 mx-auto">
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold text-gray-900 mb-1">অ্যাকাউন্ট তৈরি করুন</h1>
            <p className="text-lg text-gray-600">সব তথ্য পূরণ করুন</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                placeholder="পূর্ণ নাম"
                required
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                placeholder="ইমেইল ঠিকানা"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                placeholder="পাসওয়ার্ড তৈরি করুন"
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

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                placeholder="পাসওয়ার্ড নিশ্চিত করুন"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || redirecting}
              className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg font-medium mt-6"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>অ্যাকাউন্ট তৈরি হচ্ছে...</span>
                </>
              ) : redirecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>রিডাইরেক্ট হচ্ছে...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>অ্যাকাউন্ট তৈরি করুন</span>
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-lg text-gray-600">
                ইতিমধ্যে একটি অ্যাকাউন্ট আছে?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  এখানে লগইন করুন
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default SignupPage;