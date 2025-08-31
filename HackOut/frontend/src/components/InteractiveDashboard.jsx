import React, { useState, useEffect } from 'react';
import { ArrowLeft, Activity, AlertTriangle, Satellite, CloudRain, Waves, TrendingUp, Users, MapPin, RefreshCw, Bell, Settings, LogOut, User as UserIcon, ChevronDown, Smartphone } from 'lucide-react';
import apiService from '../services/apiService';
import databaseService from '../services/databaseService';
import WeatherAlerts from './WeatherAlerts';
import SatelliteMap from './SatelliteMap';
import CommunityReporting from './CommunityReporting';
import MobileDashboard from './MobileDashboard';
import CurrentMonitor from './CurrentMonitor';

const InteractiveDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [weatherData, setWeatherData] = useState(null);
  const [threatData, setThreatData] = useState(null);
  const [satelliteData, setSatelliteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Load real data from APIs
  useEffect(() => {
    loadDashboardData();
    loadNotifications();
    
    // Check for mobile view changes
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobile view check
  if (isMobileView) {
    return (
      <MobileDashboard 
        user={user}
        weatherData={weatherData}
        threatData={threatData}
        onLogout={onLogout}
      />
    );
  }

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load real weather data
      const weather = await apiService.getCurrentWeather();
      setWeatherData(weather);

      // Load threat data (using mock for now)
      const threats = apiService.generateMockCoastalData();
      setThreatData(threats);

      // Test NASA connection
      const nasaTest = await apiService.testNASAConnection();
      setSatelliteData(nasaTest);

      // Save to database for persistence
      if (weather) {
        await databaseService.saveWeatherData({
          location: 'Mumbai',
          ...weather.current
        });
      }

      if (threats?.threats) {
        for (const threat of threats.threats) {
          try {
            await databaseService.createThreatAlert({
              type: threat.type,
              severity: threat.severity,
              location: threat.location,
              description: threat.description || 'Automated threat detection',
              createdBy: 'system'
            });
          } catch (error) {
            console.log('Threat already exists or database error:', error);
          }
        }
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Use mock data as fallback
      setWeatherData(apiService.generateMockWeatherData());
      setThreatData(apiService.generateMockCoastalData());
      setSatelliteData({ status: 'error', message: 'NASA service unavailable' });
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      if (user?.id) {
        const userNotifications = await databaseService.getUserNotifications(user.id);
        setNotifications(userNotifications || []);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleSubmitReport = async (reportData) => {
    try {
      await databaseService.createCommunityReport({
        ...reportData,
        authorId: user?.id,
        coordinates: { lat: 19.0760, lng: 72.8777 } // Default Mumbai coordinates
      });
      
      // Refresh data after submitting report
      loadDashboardData();
    } catch (error) {
      console.error('Failed to submit report:', error);
    }
  };

  const refreshData = () => {
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Loading Dashboard Data...</p>
          <p className="text-blue-200 mt-2">Connecting to weather and satellite services</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'threats', label: 'Threat Monitor', icon: AlertTriangle },
    { id: 'weather', label: 'Weather', icon: CloudRain },
    { id: 'satellite', label: 'Satellite', icon: Satellite },
    { id: 'community', label: 'Community', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">🌊</span>
                </div>
                <h1 className="text-white text-2xl font-bold">CTAS Dashboard</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
                >
                  <Bell className="w-5 h-5 text-blue-400" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-black/80 backdrop-blur-lg border border-white/20 rounded-xl p-4 z-50 max-h-96 overflow-y-auto">
                    <h3 className="text-white font-bold mb-3">Notifications</h3>
                    {notifications.length > 0 ? (
                      <div className="space-y-2">
                        {notifications.slice(0, 5).map((notification, index) => (
                          <div key={index} className="p-3 bg-white/10 rounded-lg">
                            <p className="text-white text-sm font-medium">{notification.title || 'System Alert'}</p>
                            <p className="text-gray-300 text-xs">{notification.message || 'New update available'}</p>
                            <p className="text-gray-400 text-xs mt-1">{new Date().toLocaleTimeString()}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No new notifications</p>
                    )}
                  </div>
                )}
              </div>

              {/* Last Updated */}
              <div className="text-right hidden sm:block">
                <p className="text-white text-sm">Last Updated</p>
                <p className="text-blue-200 text-xs">{lastUpdated.toLocaleTimeString()}</p>
              </div>

              {/* Refresh Button */}
              <button
                onClick={refreshData}
                className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
              >
                <RefreshCw className="w-5 h-5 text-blue-400" />
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
                >
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="text-left hidden md:block">
                    <p className="text-white text-sm font-medium">{user?.name || 'User'}</p>
                    <p className="text-blue-200 text-xs capitalize">{user?.role || 'Member'}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-blue-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-black/80 backdrop-blur-lg border border-white/20 rounded-xl p-4 z-50">
                    <div className="flex items-center space-x-3 p-3 border-b border-white/10">
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium">{user?.name || 'User'}</p>
                        <p className="text-blue-200 text-sm">{user?.email || 'user@example.com'}</p>
                        <p className="text-blue-300 text-xs capitalize">{user?.organization || 'Organization'}</p>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <button className="w-full flex items-center space-x-3 p-3 hover:bg-white/10 rounded-lg transition-colors">
                        <UserIcon className="w-4 h-4 text-blue-400" />
                        <span className="text-white">Profile</span>
                      </button>
                      <button className="w-full flex items-center space-x-3 p-3 hover:bg-white/10 rounded-lg transition-colors">
                        <Settings className="w-4 h-4 text-blue-400" />
                        <span className="text-white">Settings</span>
                      </button>
                      <button 
                        onClick={onLogout}
                        className="w-full flex items-center space-x-3 p-3 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-red-400" />
                        <span className="text-red-400">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 mt-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-500/30 text-white border border-blue-400/50'
                      : 'text-blue-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'overview' && <OverviewTab weatherData={weatherData} threatData={threatData} />}
        {activeTab === 'threats' && <ThreatMonitorTab threatData={threatData} />}
        {activeTab === 'weather' && <WeatherAlertsTab weatherData={weatherData} />}
        {activeTab === 'satellite' && <SatelliteMapTab satelliteData={satelliteData} threatData={threatData} weatherData={weatherData} />}
        {activeTab === 'community' && <CommunityReportingTab user={user} onSubmitReport={handleSubmitReport} />}
      </main>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ weatherData, threatData }) => (
  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
    {/* Satellite Map - Large, Left Side */}
    <div className="lg:col-span-3">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 h-[800px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold flex items-center">
            <Satellite className="w-6 h-6 text-green-400 mr-2" />
            Satellite Map
          </h3>
          <div className="text-sm text-blue-200">Real-time coastal monitoring</div>
        </div>
        <div className="h-[720px]">
          <SatelliteMap
            data={{
              coordinates: { lat: 19.0760, lng: 72.8777 },
              zoomLevel: 10,
              threats: threatData?.data?.currentThreats || [],
              weather: weatherData?.data?.current || {}
            }}
            showControls={true}
            showLegend={true}
            height="100%"
          />
        </div>
      </div>
    </div>

    {/* Quick Stats and Other Components - Right Side */}
    <div className="lg:col-span-1 space-y-6">
      {/* Quick Stats */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
          <Activity className="w-5 h-5 text-cyan-400 mr-2" />
          Quick Stats
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-blue-200 text-sm">Active Alerts</span>
            <span className="text-white font-bold text-xl">0</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-200 text-sm">Connection</span>
            <span className="text-red-400 font-semibold">Disconnected</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-200 text-sm">Sync Status</span>
            <span className="text-red-400 font-semibold">Error</span>
          </div>
          <div className="border-t border-white/20 pt-4 mt-4">
            <div className="text-blue-200 text-xs mb-2">Layer: Satellite View</div>
            <div className="text-blue-200 text-xs mb-2">Markers: 0</div>
            <div className="text-blue-200 text-xs mb-2">Center: 19.0760, 72.8777</div>
            <div className="text-blue-200 text-xs">Last Updated: 2:05:09 PM</div>
          </div>
        </div>
      </div>

      {/* Current Threat Level */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold">Threat Level</h3>
          <AlertTriangle className="w-6 h-6 text-orange-400" />
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-orange-400 mb-2">HIGH</div>
          <p className="text-blue-200">Storm surge expected in 6 hours</p>
          <div className="mt-4 bg-orange-500/20 rounded-lg p-3">
            <p className="text-orange-200 text-sm">85% probability of coastal flooding</p>
          </div>
        </div>
      </div>

      {/* Weather Summary */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold">Current Weather</h3>
          <CloudRain className="w-6 h-6 text-blue-400" />
        </div>
        {weatherData?.data ? (
          <div>
            <div className="text-3xl font-bold text-white mb-2">
              {weatherData.data.current?.temperature || 28}°C
            </div>
            <p className="text-blue-200 mb-3">{weatherData.data.current?.conditions || 'Partly Cloudy'}</p>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="text-blue-200">Wind: {weatherData.data.current?.windSpeed || 12} km/h</div>
              <div className="text-blue-200">Humidity: {weatherData.data.current?.humidity || 78}%</div>
            </div>
          </div>
        ) : (
          <div className="text-center text-blue-200">Loading weather data...</div>
        )}
      </div>
    </div>

    {/* Real-time Current Monitor - Full Width Below */}
    <div className="lg:col-span-4">
      <CurrentMonitor stationId="cb0102" />
    </div>

    {/* Statistics Grid - Full Width Below */}
    <div className="lg:col-span-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Lives Protected" value="1.2M+" icon={Users} color="text-green-400" />
        <StatCard title="Data Sources" value="50+" icon={Satellite} color="text-blue-400" />
        <StatCard title="Prediction Accuracy" value="95%" icon={TrendingUp} color="text-purple-400" />
        <StatCard title="Coverage Area" value="500km²" icon={MapPin} color="text-cyan-400" />
      </div>
    </div>
  </div>
);

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
    <div className="flex items-center justify-between mb-2">
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <div className={`text-2xl font-bold ${color} mb-1`}>{value}</div>
    <div className="text-blue-200 text-sm">{title}</div>
  </div>
);

// Threat Monitor Tab Component
const ThreatMonitorTab = ({ threatData }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-white">Coastal Threat Monitor</h2>
      <div className="bg-white/10 rounded-lg px-4 py-2">
        <span className="text-blue-200">Real-time Analysis</span>
      </div>
    </div>

    <div className="grid gap-6">
      {threatData?.data?.currentThreats?.map((threat, index) => (
        <div key={threat.id} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">{threat.type}</h3>
              <p className="text-blue-200">{threat.description}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              threat.severity === 'High' ? 'bg-red-500/20 text-red-300' :
              threat.severity === 'Medium' ? 'bg-orange-500/20 text-orange-300' :
              'bg-green-500/20 text-green-300'
            }`}>
              {threat.severity}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-black/20 rounded-lg p-3">
              <div className="text-blue-200 text-sm">Probability</div>
              <div className="text-2xl font-bold text-white">{threat.probability}%</div>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <div className="text-blue-200 text-sm">Time to Impact</div>
              <div className="text-lg font-bold text-white">{threat.timeToImpact}</div>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <div className="text-blue-200 text-sm">Affected Areas</div>
              <div className="text-sm text-white">{threat.affectedAreas.join(', ')}</div>
            </div>
          </div>

          <div className="bg-blue-500/20 rounded-lg p-3">
            <div className="text-blue-200 text-sm mb-1">Probability Progress</div>
            <div className="w-full bg-black/30 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${threat.probability}%` }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Weather Alerts Tab Component
const WeatherAlertsTab = ({ weatherData }) => (
  <WeatherAlerts weatherData={weatherData} />
);

// Satellite Map Tab Component  
const SatelliteMapTab = ({ satelliteData, threatData, weatherData }) => (
  <SatelliteMap 
    satelliteData={satelliteData} 
    threatData={threatData} 
    weatherData={weatherData} 
  />
);

// Community Reporting Tab Component
const CommunityReportingTab = ({ user, onSubmitReport }) => (
  <CommunityReporting 
    user={user} 
    onSubmitReport={onSubmitReport} 
  />
);

export default InteractiveDashboard;
