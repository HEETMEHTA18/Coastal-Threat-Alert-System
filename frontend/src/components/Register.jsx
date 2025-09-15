import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, ArrowLeft, Building, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { registerUser } from '../store/slices/authSlice';
import { useAuth } from '../store/hooks';

const Register = ({ onBack }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer", // Default role
    organization: "",
  });

  // Redirect already authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
      
      // Handle registration with Redux
      const result = await dispatch(registerUser({
        name: input.name,
        email: input.email,
        password: input.password,
        role: input.role,
        organization: input.organization,
      })).unwrap();

      if (result) {
        const user = result.user || result.data?.user || result;
        const userName = user?.name || 'User';
        toast.success(`Registration successful! Welcome to CTAS, ${userName}.`);
        
        // Clear form
        setInput({
          name: "",
          email: "",
          password: "",
          role: "viewer",
          organization: "",
        });
        
        // Wait a moment for the toast to be visible, then redirect to login page
        setTimeout(() => {
          navigate('/login'); // Navigate to login page
        }, 1500);
      }
    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
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
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute -top-20 -right-40 w-96 h-96 bg-teal-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-1000"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-cyan-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-emerald-500/5 to-transparent"></div>
      </div>

      {/* Main Container - Perfectly Centered */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/25 transform hover:scale-105 transition-transform duration-300">
              <span className="text-white text-3xl">🌊</span>
            </div>
            <div>
              <h1 className="text-white text-4xl font-bold tracking-tight">CTAS</h1>
              <p className="text-emerald-300/80 text-sm">Coastal Threat Alert System</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Join Our Community</h2>
          <p className="text-emerald-200/80 text-base">Create your account to access advanced coastal monitoring</p>
        </div>

        {/* Registration Form Container */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl shadow-black/20 transform hover:scale-[1.01] transition-all duration-300">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-white text-sm font-semibold flex items-center space-x-2">
                <User className="w-4 h-4 text-emerald-300" />
                <span>Full Name</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={input.name}
                  onChange={handleInputChange}
                  className="w-full px-5 py-3.5 bg-slate-800/80 border border-slate-600/50 rounded-2xl text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400/50 transition-all duration-200 focus:bg-slate-700/80"
                  placeholder="Enter your full name"
                  required
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-white text-sm font-semibold flex items-center space-x-2">
                <Mail className="w-4 h-4 text-emerald-300" />
                <span>Email Address</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={input.email}
                  onChange={handleInputChange}
                  className="w-full px-5 py-3.5 bg-slate-800/80 border border-slate-600/50 rounded-2xl text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400/50 transition-all duration-200 focus:bg-slate-700/80"
                  placeholder="Enter your email address"
                  required
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-white text-sm font-semibold flex items-center space-x-2">
                <Lock className="w-4 h-4 text-emerald-300" />
                <span>Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={input.password}
                  onChange={handleInputChange}
                  className="w-full px-5 py-3.5 bg-slate-800/80 border border-slate-600/50 rounded-2xl text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400/50 transition-all duration-200 pr-14 focus:bg-slate-700/80"
                  placeholder="Create a secure password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-300 hover:text-white transition-colors p-1 hover:bg-slate-600/50 rounded-lg"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
              </div>
              <p className="text-white/50 text-xs ml-1">Minimum 6 characters required</p>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-white text-sm font-semibold flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-emerald-300" />
                <span>Account Type</span>
              </label>
              <div className="relative">
                <select
                  name="role"
                  value={input.role}
                  onChange={handleInputChange}
                  className="w-full px-5 py-3.5 bg-slate-800/80 border border-slate-600/50 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400/50 transition-all duration-200 focus:bg-slate-700/80 appearance-none cursor-pointer"
                >
                  <option value="viewer" className="bg-slate-800 text-white">🔍 Viewer - View alerts and data</option>
                  <option value="community_leader" className="bg-slate-800 text-white">👥 Community Leader - Generate reports</option>
                  <option value="operator" className="bg-slate-800 text-white">⚡ Operator - Create and manage alerts</option>
                  <option value="admin" className="bg-slate-800 text-white">🛡️ Administrator - Full access</option>
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Organization Input */}
            <div className="space-y-2">
              <label className="text-white text-sm font-semibold flex items-center space-x-2">
                <Building className="w-4 h-4 text-emerald-300" />
                <span>Organization</span>
                <span className="text-white/50 text-xs font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="organization"
                  value={input.organization}
                  onChange={handleInputChange}
                  className="w-full px-5 py-3.5 bg-slate-800/80 border border-slate-600/50 rounded-2xl text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400/50 transition-all duration-200 focus:bg-slate-700/80"
                  placeholder="Your organization or agency"
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-3 text-base mt-6 shadow-lg"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Create Account</span>
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

          {/* Toggle to Login */}
          <div className="text-center">
            <p className="text-white/80 text-base mb-4">
              Already have an account?
            </p>
            <button
              onClick={() => navigate('/login')}
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors text-base underline decoration-emerald-400/50 hover:decoration-emerald-300/50 underline-offset-4 hover:underline-offset-2"
            >
              Sign in here →
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

        {/* Feature Highlights */}
        <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-bold mb-4 text-base flex items-center space-x-2">
            <span>🚀</span>
            <span>Account Benefits</span>
          </h3>
          <div className="text-emerald-200/90 text-sm space-y-2">
            <div className="flex items-center space-x-3">
              <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0"></span>
              <span>Real-time coastal threat monitoring</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0"></span>
              <span>Personalized alert notifications</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0"></span>
              <span>Advanced analytics and reporting</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0"></span>
              <span>Mobile SMS alerts for critical events</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;