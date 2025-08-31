import React, { useState, useEffect } from 'react';
import { 
  Activity, Satellite, CloudRain, Waves, BarChart, 
  Users, MapPin, RefreshCw, Settings, LogOut, User as UserIcon, 
  ChevronDown, Smartphone, Menu, X 
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useAuth, useUI, useDashboard, useConnectionStatus } from '../store/hooks';
import { setActiveTab, toggleSidebar, openModal } from '../store/slices/uiSlice';
import { logoutUser } from '../store/slices/authSlice';
import DashboardProvider from './DashboardProvider';
import CurrentMonitorRedux from './CurrentMonitorRedux';
import WeatherWidget from './WeatherWidget';
import SatelliteMapWorking from './SatelliteMapWorking';
import CommunityReports from './CommunityReports';
import ChatbotWidget from './ChatbotWidget';
import AnalyticsPage from './AnalyticsPage';

const InteractiveDashboard = ({ onLogout, initialTab = 'overview' }) => {
  const dispatch = useDispatch();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  const { user, isAuthenticated } = useAuth();
  const { isConnected, syncStatus } = useConnectionStatus();
  const { 
    activeTab, 
    sidebarCollapsed, 
    isLoading
  } = useDashboard();
  
  // Set initial tab from props if provided
  useEffect(() => {
    if (initialTab) {
      dispatch(setActiveTab(initialTab));
    }
  }, [initialTab, dispatch]);

  // Function to get user initials
  const getUserInitials = (name) => {
    if (!name || typeof name !== 'string') return 'U';
    const names = name.trim().split(' ').filter(n => n.length > 0);
    if (names.length === 0) return 'U';
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const handleTabChange = (tab) => {
    dispatch(setActiveTab(tab));
    // Update URL without full page reload
    window.history.pushState({}, '', `/dashboard/${tab === 'overview' ? '' : tab}`);
  };

  const handleSidebarToggle = () => {
    dispatch(toggleSidebar());
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    onLogout();
  };

  const handleOpenSettings = () => {
    dispatch(openModal({ modalName: 'settings' }));
  };

  const handleOpenNotifications = () => {
    dispatch(openModal({ modalName: 'alertDetail' }));
  };

  const getTabIcon = (tabName) => {
    const icons = {
      overview: Activity,
      currents: Waves,
      weather: CloudRain,
      satellite: Satellite,
      reports: Users,
      analytics: TrendingUp,
    };
    return icons[tabName] || Activity;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Satellite Map - Large, Left Side */}
            <div className="lg:col-span-3">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 h-[800px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Satellite className="w-6 h-6 text-green-400 mr-2" />
                    Satellite Map
                  </h3>
                  <div className="text-sm text-slate-400">India's Coastal Areas Monitoring</div>
                </div>
                <div className="h-[720px]">
                  <SatelliteMapWorking />
                </div>
              </div>
            </div>

            {/* Quick Stats and Other Components - Right Side */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Stats */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Activity className="w-5 h-5 text-cyan-400 mr-2" />
                  Quick Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Connection</span>
                    <span className={`font-semibold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Sync Status</span>
                    <span className="text-white font-semibold capitalize">{syncStatus}</span>
                  </div>
                  <div className="border-t border-slate-600 pt-4 mt-4">
                    <div className="text-slate-400 text-xs mb-2">Layer: Satellite View</div>
                    <div className="text-slate-400 text-xs mb-2">Markers: 0</div>
                    <div className="text-slate-400 text-xs mb-2">Center: 19.0760, 72.8777</div>
                    <div className="text-slate-400 text-xs">Last Updated: 2:05:09 PM</div>
                  </div>
                </div>
              </div>

              {/* Current Monitor - Compact */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Waves className="w-5 h-5 text-blue-400 mr-2" />
                  Current Monitor
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Cape Henry Station</span>
                    <span className="text-red-400">disconnected</span>
                  </div>
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                    <div className="flex items-center text-red-400 text-sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Error: Failed to fetch
                    </div>
                  </div>
                </div>
              </div>


            </div>
          </div>
        );
      
      case 'currents':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <CurrentMonitorRedux />
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Current Trends</h3>
              <p className="text-slate-400">Historical current data visualization coming soon...</p>
            </div>
          </div>
        );
      
      case 'weather':
        return <WeatherWidget />;
      
      case 'satellite':
        // Use SatelliteMapWorking showing Indian coastal areas
        return (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Satellite className="w-6 h-6 text-green-400 mr-2" />
                India's Coastal Monitoring
              </h3>
              <div className="text-sm text-slate-400">Real-time satellite view</div>
            </div>
            <div className="h-[720px]">
              <SatelliteMapWorking />
            </div>
          </div>
        );
      
      case 'reports':
        return <CommunityReports />;
        
      case 'analytics':
        return <AnalyticsPage />;
        
      default:
        return (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Overview</h3>
            <p className="text-slate-400">Select a tab to view data</p>
          </div>
        );
    }
  };

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <DashboardProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${sidebarCollapsed && !isMobileView ? 'w-20' : 'w-72'} ${isMobileView && sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'}`}>
          {/* Sidebar Content */}
          <div className="h-full bg-slate-800/50 backdrop-blur-sm border-r border-slate-700/50 flex flex-col overflow-hidden">
            {/* Sidebar Header */}
            {!isMobileView && (
              <div className="p-4 border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className={`flex items-center ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-2xl"></span>
                    </div>
                    {!sidebarCollapsed && (
                      <div className="ml-3">
                        <h2 className="text-white font-bold text-lg">CTAS</h2>
                        <p className="text-slate-400 text-xs">Coastal Monitoring</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSidebarToggle}
                    className="p-1 hover:bg-slate-700/50 rounded"
                  >
                    <ChevronDown className={`w-6 h-6 text-slate-400 transform transition-transform ${sidebarCollapsed ? 'rotate-90' : '-rotate-90'}`} />
                  </button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="p-4 space-y-2">
              {[
                { id: 'overview', label: 'Overview', icon: Activity },
                { id: 'currents', label: 'Currents', icon: Waves },
                { id: 'weather', label: 'Weather', icon: CloudRain },
                { id: 'satellite', label: 'Satellite', icon: Satellite },
                { id: 'reports', label: 'Reports', icon: Users },
                { id: 'analytics', label: 'Analytics', icon: BarChart },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-slate-300 hover:bg-slate-700/50'
                    } ${sidebarCollapsed && !isMobileView ? 'justify-center' : ''}`}
                  >
                    <Icon className="w-7 h-7" />
                    {(!sidebarCollapsed || isMobileView) && (
                      <span>{tab.label}</span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Desktop User Menu */}
            {!isMobileView && (
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50">
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`w-full flex items-center gap-3 p-3 text-slate-300 hover:bg-slate-700/50 rounded-lg ${sidebarCollapsed ? 'justify-center' : ''}`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full text-white font-semibold text-xs">
                      {user && isAuthenticated ? getUserInitials(user?.name) : 'G'}
                    </div>
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left">{user?.name || 'Guest User'}</span>
                        <ChevronDown className="w-5 h-5" />
                      </>
                    )}
                  </button>
                  
                  {showUserMenu && (
                    <div className={`absolute ${sidebarCollapsed ? 'left-full ml-2' : 'left-0'} bottom-full mb-2 w-48 bg-slate-800 rounded-lg border border-slate-700 shadow-xl z-50`}>
                      <div className="p-3 border-b border-slate-700">
                        <p className="text-white font-medium">{user?.name || 'User'}</p>
                        <p className="text-slate-400 text-sm">{user?.email || 'user@example.com'}</p>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={handleOpenSettings}
                          className="w-full flex items-center gap-2 p-2 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded transition-colors duration-200"
                        >
                          <Settings className="w-5 h-5" />
                          Settings
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 p-2 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded transition-all duration-200 mt-1 group"
                        >
                          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile User Menu */}
            {isMobileView && (
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50">
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-full flex items-center gap-3 p-3 text-slate-300 hover:bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full text-white font-semibold text-xs">
                      {user && isAuthenticated ? getUserInitials(user?.name) : 'G'}
                    </div>
                    <span className="flex-1 text-left">{user?.name || 'Guest User'}</span>
                    <ChevronDown className="w-5 h-5" />
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute left-0 bottom-full mb-2 w-48 bg-slate-800 rounded-lg border border-slate-700 shadow-xl z-50">
                      <div className="p-3 border-b border-slate-700">
                        <p className="text-white font-medium">{user?.name || 'User'}</p>
                        <p className="text-slate-400 text-sm">{user?.email || 'user@example.com'}</p>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={handleOpenSettings}
                          className="w-full flex items-center gap-2 p-2 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded transition-colors duration-200"
                        >
                          <Settings className="w-5 h-5" />
                          Settings
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 p-2 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded transition-all duration-200 mt-1 group"
                        >
                          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className={`transition-all duration-300 ${sidebarCollapsed && !isMobileView ? 'ml-20' : 'ml-0 md:ml-72'}`}>
          <div className="min-h-screen flex flex-col relative">
            {/* Mobile Header */}
            {isMobileView && (
              <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 p-4 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center">
                  <button
                    onClick={handleSidebarToggle}
                    className="p-2 mr-3 hover:bg-slate-700/50 rounded-lg"
                  >
                    {sidebarCollapsed ? <Menu className="w-6 h-6 text-white" /> : <X className="w-6 h-6 text-white" />}
                  </button>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg"></span>
                    </div>
                    <h2 className="text-white font-bold text-lg ml-2">CTAS</h2>
                  </div>
                </div>
              </header>
            )}

            {/* Content */}
            <main className="flex-1 p-6 overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading dashboard...</p>
                  </div>
                </div>
              ) : (
                renderTabContent()
              )}
            </main>
          </div>
        </div>

        {/* Mobile Overlay */}
        {isMobileView && !sidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-black/50 z-30"
            onClick={handleSidebarToggle}
          />
        )}

        {/* Floating Chatbot Widget */}
        <ChatbotWidget />
      </div>
    </DashboardProvider>
  );
};

export default InteractiveDashboard;
