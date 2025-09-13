import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';

const Login = ({ onBack }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e) => {
    setInput({
      ...input,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      
      // Real authentication only - no demo fallback
      const result = await dispatch(loginUser({
        email: input.email,
        password: input.password,
      })).unwrap();

      console.log('Login result:', result); // Debug log

      if (result) {
        // Handle different response structures safely
        let user = null;
        
        if (result.user) {
          user = result.user;
        } else if (result.data && result.data.user) {
          user = result.data.user;
        } else if (result.data) {
          user = result.data;
        } else {
          user = result;
        }

        console.log('Extracted user:', user); // Debug log
        
        // Safe name extraction with fallbacks
        let userName = 'User';
        if (user && user.name) {
          userName = user.name;
        } else if (user && user.email) {
          userName = user.email.split('@')[0];
        }
        
        toast.success(`Welcome back, ${userName}!`);
        
        // Clear form
        setInput({
          email: "",
          password: "",
        });
        
        // Set session start time for logout page statistics
        localStorage.setItem('session_start', Date.now().toString());
        
        // Navigate to dashboard or the page they came from
        const from = location.state?.from || '/dashboard';
        navigate(from);
      }
    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      <Toaster 
        position="top-center" 
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
        }}
      />
      
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute -top-20 -right-40 w-96 h-96 bg-cyan-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-1000"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-emerald-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-500/5 to-transparent"></div>
      </div>

      {/* Main Container - Perfectly Centered */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25 transform hover:scale-105 transition-transform duration-300">
              <span className="text-white text-3xl">🌊</span>
            </div>
            <div>
              <h1 className="text-white text-4xl font-bold tracking-tight">CTAS</h1>
              <p className="text-blue-300/80 text-sm">Coastal Threat Alert System</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Welcome Back</h2>
          <p className="text-blue-200/80 text-base">Sign in to access your coastal monitoring dashboard</p>
        </div>

        {/* Login Form Container */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl shadow-black/20 transform hover:scale-[1.01] transition-all duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-3">
              <label className="text-white text-sm font-semibold flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-300" />
                <span>Email Address</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={input.email}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 bg-slate-800/80 border border-slate-600/50 rounded-2xl text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400/50 focus:bg-slate-700/80 transition-all duration-200 text-base"
                  placeholder="Enter your email address"
                  required
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-cyan-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-3">
              <label className="text-white text-sm font-semibold flex items-center space-x-2">
                <Lock className="w-4 h-4 text-blue-300" />
                <span>Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={input.password}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 bg-slate-800/80 border border-slate-600/50 rounded-2xl text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400/50 focus:bg-slate-700/80 transition-all duration-200 text-base pr-14"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-300 hover:text-white transition-colors p-1 hover:bg-slate-600/50 rounded-lg"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-cyan-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-3 text-base shadow-lg"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-white/20"></div>
            <span className="px-4 text-white/60 text-sm">or</span>
            <div className="flex-1 border-t border-white/20"></div>
          </div>

          {/* Toggle to Register */}
          <div className="text-center">
            <p className="text-white/80 text-base mb-4">
              Don't have an account?
            </p>
            <button
              onClick={() => navigate('/register')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors text-base underline decoration-cyan-400/50 hover:decoration-cyan-300/50 underline-offset-4 hover:underline-offset-2"
            >
              Create your account →
            </button>
          </div>

          {/* Back to Home */}
          {onBack && (
            <div className="mt-6 text-center">
              <button
                onClick={onBack}
                className="text-white/60 hover:text-white/80 transition-colors flex items-center justify-center space-x-2 mx-auto text-sm hover:bg-white/5 px-3 py-2 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </button>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-white/50 text-sm flex items-center justify-center space-x-2">
            <span>🔒</span>
            <span>Your data is protected with enterprise-grade encryption</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;