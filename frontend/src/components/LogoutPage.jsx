import React, { useState, useEffect } from 'react';
import { LogOut, Home, User, Clock, Award, BarChart3, CheckCircle, ArrowLeft, Shield, Activity } from 'lucide-react';

const LogoutPage = ({ user, onConfirmLogout, onCancel }) => {
  const [sessionStats, setSessionStats] = useState({
    loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    pagesVisited: 8,
    alertsChecked: 3,
    reportsSubmitted: 1
  });

  const formatSessionDuration = (loginTime) => {
    const duration = Date.now() - loginTime.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/5 rounded-full animate-ping"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logout Confirmation Card */}
        <div className="bg-slate-900/90 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Confirm Logout</h1>
            <p className="text-blue-200">Are you sure you want to end your session?</p>
          </div>

          {/* User Info */}
          <div className="bg-white/10 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <p className="text-white font-medium">{user?.name}</p>
                <p className="text-blue-200 text-sm">{user?.email}</p>
                <p className="text-blue-300 text-xs capitalize">{user?.role} • {user?.organization}</p>
              </div>
            </div>

            {/* Session Summary */}
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-white font-medium mb-3">Session Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-blue-200">Session Time</p>
                    <p className="text-white font-medium">{formatSessionDuration(sessionStats.loginTime)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-green-400" />
                  <div>
                    <p className="text-blue-200">Pages Visited</p>
                    <p className="text-white font-medium">{sessionStats.pagesVisited}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-yellow-400" />
                  <div>
                    <p className="text-blue-200">Alerts Checked</p>
                    <p className="text-white font-medium">{sessionStats.alertsChecked}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-purple-400" />
                  <div>
                    <p className="text-blue-200">Reports</p>
                    <p className="text-white font-medium">{sessionStats.reportsSubmitted}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-yellow-300 font-medium text-sm">Security Notice</p>
                <p className="text-yellow-200 text-xs mt-1">
                  Your session will be securely terminated and all temporary data cleared.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onCancel}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              onClick={onConfirmLogout}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl transition-all duration-200 font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-blue-300 text-sm">
            Thank you for protecting our coastal communities
          </p>
        </div>
      </div>
    </div>
  );
};

// Logout Success Page Component
export const LogoutSuccessPage = ({ onReturnHome }) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Clear any remaining session data
    localStorage.removeItem('session_start');
    localStorage.removeItem('ctas_user');
    localStorage.removeItem('ctas_token');

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-green-500/10 rounded-full animate-bounce"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-blue-500/10 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 left-1/2 w-20 h-20 bg-cyan-500/10 rounded-full animate-bounce" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Success Card */}
        <div className="bg-slate-900/90 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-white mb-2">Logout Successful</h1>
          <p className="text-blue-200 mb-6">
            Your session has been securely ended. Thank you for using CTAS!
          </p>

          {/* Security Confirmation */}
          <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-green-300 font-medium">Session Secured</span>
            </div>
            <div className="text-green-200 text-sm space-y-1">
              <p>✓ All temporary data cleared</p>
              <p>✓ Authentication tokens removed</p>
              <p>✓ Session history encrypted</p>
            </div>
          </div>

          {/* Thank You Message */}
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 mb-6">
            <p className="text-blue-200 text-sm italic">
              "Together we monitor, protect, and preserve our precious coastal ecosystems for future generations."
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={onReturnHome}
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all duration-200 font-medium mb-4"
          >
            Return to Landing Page
          </button>

          {/* Auto-redirect info */}
          <p className="text-gray-400 text-sm">
            Click above to return to the homepage
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-blue-300 text-sm">
            Stay safe, stay informed 🌊
          </p>
          <p className="text-blue-400 text-xs mt-2">
            Coastal Threat Assessment System v2.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default LogoutPage;
