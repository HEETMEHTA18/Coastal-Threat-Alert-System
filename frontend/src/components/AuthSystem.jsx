import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Shield, UserPlus, LogIn, ArrowLeft, Building, Phone, MapPin } from 'lucide-react';
import axiosInstance from '../services/axiosInstance';
import { useNavigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { loginUser, registerUser, setCredentials } from '../store/slices/authSlice';

const AuthSystem = ({ onAuthSuccess, onBack }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    organization: "",
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
      
      if (isLogin) {
        // Handle login with Redux
        const result = await dispatch(loginUser({
          email: input.email,
          password: input.password,
        })).unwrap();

        if (result) {
          toast.success('Login successful! Welcome back.');
          
          // Clear form
          setInput({
            name: "",
            email: "",
            password: "",
            role: "",
            organization: "",
          });
          
          // Set session start time for logout page statistics
          localStorage.setItem('session_start', Date.now().toString());
          
          // Navigate to dashboard using React Router
          navigate('/dashboard');
        }
      } else {
        // Handle registration with Redux
        const result = await dispatch(registerUser({
          name: input.name,
          email: input.email,
          password: input.password,
          role: input.role,
          organization: input.organization,
        })).unwrap();

        if (result) {
          toast.success('Registration successful! Welcome to CTAS.');
          
          // Clear form
          setInput({
            name: "",
            email: "",
            password: "",
            role: "",
            organization: "",
          });
          
          // Wait a moment for the toast to be visible, then redirect to landing page
          setTimeout(() => {
            navigate('/'); // Navigate back to landing page
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      const errorMessage = error.response?.data?.message || 
                          (isLogin ? 'Login failed. Please check your credentials.' : 'Registration failed. Please try again.');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-emerald-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">🌊</span>
            </div>
            <h1 className="text-white text-3xl font-bold">CTAS</h1>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Join CTAS'}
          </h2>
          <p className="text-blue-200">
            {isLogin 
              ? 'Sign in to access the coastal threat monitoring system' 
              : 'Create your account to help protect coastal communities'
            }
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <>
                {/* Name Field */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                    <input
                      type="text"
                      name="name"
                      required={!isLogin}
                      value={input.name}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                {/* Organization Field */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Organization (Optional)
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                    <input
                      type="text"
                      name="organization"
                      value={input.organization}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Government, NGO, Research, etc."
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Role
                  </label>
                  <select
                    name="role"
                    value={input.role}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="admin">Admin</option>
                    <option value="operator">Operator</option>
                    <option value="community_leader">Community Leader</option>
                  </select>
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  required
                  value={input.email}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={input.password}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-12 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Terms and Conditions for Signup */}
            {!isLogin && (
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="mt-1 w-4 h-4 text-blue-600 bg-black/20 border-white/20 rounded focus:ring-blue-500"
                />
                <label htmlFor="terms" className="text-blue-200 text-sm">
                  I agree to the{' '}
                  <span className="text-blue-400 hover:underline cursor-pointer">
                    Terms of Service
                  </span>{' '}
                  and{' '}
                  <span className="text-blue-400 hover:underline cursor-pointer">
                    Privacy Policy
                  </span>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center">
            <p className="text-blue-200">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-blue-400 hover:text-blue-300 font-medium hover:underline"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>

          {/* Demo Access */}
          <div className="mt-4 pt-4 border-t border-white/20">
            <button
              onClick={() => {
                const demoUser = {
                  id: 'demo',
                  name: 'Demo User',
                  email: 'demo@ctas.gov',
                  role: 'citizen',
                  organization: 'Demo Organization',
                  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
                  lastLogin: new Date().toISOString(),
                  permissions: ['view_dashboard', 'create_reports', 'view_alerts']
                };
                
                // Use Redux to set credentials
                dispatch(setCredentials({ 
                  user: demoUser, 
                  token: 'demo_token' 
                }));
                
                toast.success('Welcome, Demo User!');
                onAuthSuccess(demoUser);
              }}
              className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition-colors text-sm"
            >
              Continue as Demo User
            </button>
          </div>

          {/* Back Button */}
          <div className="mt-4">
            <button
              onClick={() => navigate('/')}
              className="w-full text-blue-300 hover:text-white transition-colors text-sm"
            >
              ← Back to Landing Page
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-blue-200 text-sm">
            🔒 Your data is encrypted and secure<br />
            🌊 Join 1M+ users protecting coastal communities
          </p>
        </div>
      </div>
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(15, 23, 42, 0.9)',
            color: '#fff',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            backdropFilter: 'blur(8px)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

export default AuthSystem;
