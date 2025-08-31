import React, { useState, useEffect } from 'react';
import { Menu, X, Home, Bell, Map, Users, Settings, ChevronDown, Wifi, Battery, Signal } from 'lucide-react';

const MobileDashboard = ({ user, weatherData, threatData, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState(100);

  useEffect(() => {
    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Mock battery level
    const updateBattery = () => {
      setBatteryLevel(Math.max(20, Math.floor(Math.random() * 100)));
    };
    const batteryInterval = setInterval(updateBattery, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(batteryInterval);
    };
  }, []);

  const mobileNavItems = [
    { id: 'home', name: 'Home', icon: Home },
    { id: 'alerts', name: 'Alerts', icon: Bell },
    { id: 'map', name: 'Map', icon: Map },
    { id: 'community', name: 'Community', icon: Users },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const StatusBar = () => (
    <div className="flex items-center justify-between px-4 py-2 bg-black/40 text-white text-sm">
      <div className="flex items-center space-x-2">
        <span className="font-medium">9:41</span>
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Signal className="w-4 h-4" />
        <Wifi className="w-4 h-4" />
        <div className="flex items-center space-x-1">
          <Battery className="w-4 h-4" />
          <span className="text-xs">{batteryLevel}%</span>
        </div>
      </div>
    </div>
  );

  const MobileHeader = () => (
    <div className="bg-black/20 backdrop-blur-lg border-b border-white/20 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">🌊</span>
          </div>
          <div>
            <h1 className="text-white font-bold">CTAS</h1>
            <p className="text-blue-200 text-xs">Coastal Threat Alert</p>
          </div>
        </div>
        
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 bg-white/10 rounded-lg"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );

  const MobileSidebar = () => (
    <>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      
      <div className={`fixed top-0 right-0 h-full w-80 bg-black/90 backdrop-blur-lg border-l border-white/20 z-50 transform transition-transform duration-300 ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-bold text-lg">Menu</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* User Profile */}
          <div className="bg-white/10 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">{user?.name?.charAt(0) || 'U'}</span>
                </div>
              )}
              <div>
                <p className="text-white font-medium">{user?.name || 'User'}</p>
                <p className="text-blue-200 text-sm capitalize">{user?.role || 'Member'}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {mobileNavItems.map(item => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-500/30 text-blue-400'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="absolute bottom-4 left-4 right-4">
            <button
              onClick={onLogout}
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 p-3 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );

  const QuickStats = () => (
    <div className="grid grid-cols-2 gap-3 p-4">
      <div className="bg-black/20 backdrop-blur-lg border border-white/20 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Active Threats</p>
            <p className="text-white text-2xl font-bold">{threatData?.threats?.length || 0}</p>
          </div>
          <Bell className="w-8 h-8 text-red-400" />
        </div>
      </div>
      
      <div className="bg-black/20 backdrop-blur-lg border border-white/20 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Temperature</p>
            <p className="text-white text-2xl font-bold">{weatherData?.current?.temperature || '--'}°C</p>
          </div>
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <span className="text-blue-400">🌡️</span>
          </div>
        </div>
      </div>
    </div>
  );

  const MobileWeatherCard = () => (
    <div className="mx-4 mb-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg border border-white/20 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold">Current Weather</h3>
        <div className="text-2xl">☀️</div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-gray-400 text-xs">Wind</p>
          <p className="text-white font-bold">{weatherData?.current?.windSpeed || 0} km/h</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Humidity</p>
          <p className="text-white font-bold">{weatherData?.current?.humidity || 0}%</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Pressure</p>
          <p className="text-white font-bold">{weatherData?.current?.pressure || 0} hPa</p>
        </div>
      </div>
    </div>
  );

  const ThreatAlerts = () => (
    <div className="mx-4 mb-4">
      <h3 className="text-white font-bold mb-3">Recent Alerts</h3>
      <div className="space-y-3">
        {threatData?.threats?.slice(0, 3).map((threat, index) => (
          <div key={index} className="bg-black/20 backdrop-blur-lg border border-white/20 rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white font-medium">{threat.type}</p>
                <p className="text-gray-400 text-sm">{threat.location}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${
                threat.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                threat.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {threat.severity}
              </span>
            </div>
          </div>
        )) || (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-center">
            <p className="text-green-400">No active threats</p>
          </div>
        )}
      </div>
    </div>
  );

  const MobileBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-white/20">
      <div className="grid grid-cols-5 px-2 py-1">
        {mobileNavItems.map(item => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center p-2 transition-colors ${
                activeTab === item.id ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              <IconComponent className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative">
      <StatusBar />
      <MobileHeader />
      <MobileSidebar />
      
      {/* Main Content */}
      <div className="pb-20 overflow-y-auto">
        {activeTab === 'home' && (
          <>
            <QuickStats />
            <MobileWeatherCard />
            <ThreatAlerts />
          </>
        )}
        
        {activeTab === 'alerts' && (
          <div className="p-4">
            <h2 className="text-white text-xl font-bold mb-4">Alert Center</h2>
            <ThreatAlerts />
          </div>
        )}
        
        {activeTab === 'map' && (
          <div className="p-4">
            <h2 className="text-white text-xl font-bold mb-4">Interactive Map</h2>
            <div className="bg-black/20 backdrop-blur-lg border border-white/20 rounded-xl p-6 text-center">
              <Map className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <p className="text-white">Mobile map view coming soon</p>
            </div>
          </div>
        )}
        
        {activeTab === 'community' && (
          <div className="p-4">
            <h2 className="text-white text-xl font-bold mb-4">Community</h2>
            <div className="bg-black/20 backdrop-blur-lg border border-white/20 rounded-xl p-6 text-center">
              <Users className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <p className="text-white">Community features optimized for mobile</p>
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="p-4">
            <h2 className="text-white text-xl font-bold mb-4">Settings</h2>
            <div className="space-y-3">
              <div className="bg-black/20 backdrop-blur-lg border border-white/20 rounded-xl p-4">
                <h3 className="text-white font-medium mb-2">Notifications</h3>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Push Notifications</span>
                  <div className="w-12 h-6 bg-blue-500 rounded-full flex items-center justify-end p-1">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-black/20 backdrop-blur-lg border border-white/20 rounded-xl p-4">
                <h3 className="text-white font-medium mb-2">Data Usage</h3>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Offline Mode</span>
                  <div className="w-12 h-6 bg-gray-600 rounded-full flex items-center p-1">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <MobileBottomNav />
      
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-16 left-4 right-4 bg-red-500/90 backdrop-blur-lg rounded-lg p-2 z-30">
          <p className="text-white text-center text-sm">You're offline. Some features may be limited.</p>
        </div>
      )}
    </div>
  );
};

export default MobileDashboard;
