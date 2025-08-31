import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  Shield, 
  Activity, 
  Users, 
  MapPin, 
  TrendingUp, 
  AlertTriangle,
  Eye,
  Waves,
  Wind,
  Thermometer,
  Droplets,
  ArrowLeft
} from 'lucide-react';

const Dashboard = ({ onBackToLanding }) => {
  const [stats, setStats] = useState({
    activeSensors: 247,
    communitiesProtected: 156,
    threatLevel: 'Medium'
  });

  const [realTimeData, setRealTimeData] = useState({
    waveHeight: 2.3,
    windSpeed: 45,
    temperature: 28,
    humidity: 78
  });

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        waveHeight: (Math.random() * 3 + 1).toFixed(1),
        windSpeed: Math.floor(Math.random() * 60 + 20),
        temperature: Math.floor(Math.random() * 10 + 25),
        humidity: Math.floor(Math.random() * 20 + 70)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getThreatLevelColor = useCallback((level) => {
    switch(level.toLowerCase()) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'critical': return 'text-red-400';
      default: return 'text-orange-400';
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20 gap-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={onBackToLanding}
              className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              aria-label="Return to landing page"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Coastal Threat Alert System</h1>
              <p className="text-blue-200 text-sm sm:text-base">AI-Powered Maritime Safety Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button 
                className="relative p-2 rounded-lg hover:bg-white/10 transition-colors focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                aria-label="Notifications"
              >
                <Bell className="w-6 h-6 text-white" />
              </button>
            </div>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm font-medium">Active Sensors</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">{stats.activeSensors}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
            <span className="text-green-400 text-xs sm:text-sm">+12% from yesterday</span>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm font-medium">Data Sources</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">8</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-center">
            <span className="text-green-400 text-xs sm:text-sm">Active data feeds</span>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm font-medium">Communities</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">{stats.communitiesProtected}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-center">
            <span className="text-blue-400 text-xs sm:text-sm">Protected communities</span>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm font-medium">Threat Level</p>
              <p className={`text-2xl sm:text-3xl font-bold ${getThreatLevelColor(stats.threatLevel)}`}>{stats.threatLevel}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-center">
            <span className="text-orange-400 text-xs sm:text-sm">Monitoring 24/7</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Real-time Data */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/20">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Real-time Environmental Data</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg p-3 sm:p-4 border border-blue-400/30">
                <div className="flex items-center justify-between mb-2">
                  <Waves className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" aria-hidden="true" />
                  <span className="text-xl sm:text-2xl font-bold text-white">{realTimeData.waveHeight}m</span>
                </div>
                <p className="text-blue-200 text-xs sm:text-sm">Wave Height</p>
              </div>
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg p-3 sm:p-4 border border-green-400/30">
                <div className="flex items-center justify-between mb-2">
                  <Wind className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" aria-hidden="true" />
                  <span className="text-xl sm:text-2xl font-bold text-white">{realTimeData.windSpeed}</span>
                </div>
                <p className="text-green-200 text-xs sm:text-sm">Wind Speed (km/h)</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg p-3 sm:p-4 border border-orange-400/30">
                <div className="flex items-center justify-between mb-2">
                  <Thermometer className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" aria-hidden="true" />
                  <span className="text-xl sm:text-2xl font-bold text-white">{realTimeData.temperature}°C</span>
                </div>
                <p className="text-orange-200 text-xs sm:text-sm">Temperature</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-lg p-3 sm:p-4 border border-purple-400/30">
                <div className="flex items-center justify-between mb-2">
                  <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" aria-hidden="true" />
                  <span className="text-xl sm:text-2xl font-bold text-white">{realTimeData.humidity}%</span>
                </div>
                <p className="text-purple-200 text-xs sm:text-sm">Humidity</p>
              </div>
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/20">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Live Threat Map</h2>
            <div className="h-48 sm:h-64 bg-gradient-to-br from-blue-900/50 to-green-900/50 rounded-lg border border-white/20 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="w-full h-full bg-gradient-to-br from-blue-500/10 to-green-500/10"></div>
              </div>
              <div className="relative z-10 text-center">
                <MapPin className="w-8 h-8 sm:w-12 sm:h-12 text-blue-400 mx-auto mb-2 sm:mb-4" aria-hidden="true" />
                <p className="text-white font-semibold text-sm sm:text-base">Interactive Threat Map</p>
                <p className="text-blue-200 text-xs sm:text-sm">Real-time sensor data overlays</p>
              </div>
              {/* Simulated map markers */}
              <div className="absolute top-16 sm:top-20 left-16 sm:left-20 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></div>
              <div className="absolute top-24 sm:top-32 right-16 sm:right-24 w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <div className="absolute bottom-16 sm:bottom-20 left-24 sm:left-32 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/20">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Quick Actions</h2>
            <div className="space-y-2 sm:space-y-3">
              <button 
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                aria-label="Generate a comprehensive threat report"
              >
                Generate Report
              </button>
              <button 
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                aria-label="Send alert to coastal communities"
              >
                Send Community Alert
              </button>
              <button 
                className="w-full bg-gradient-to-r from-purple-500 to-violet-500 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-violet-600 transition-all duration-300 transform hover:scale-105 focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                aria-label="View detailed analytics and trends"
              >
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
