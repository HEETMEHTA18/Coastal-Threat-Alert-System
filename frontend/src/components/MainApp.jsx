import React, { useState, useEffect } from 'react';
import { 
  Home, BarChart3, AlertTriangle, Users, Settings, Bell, 
  LogOut, Menu, X, Shield, Globe, Waves, User, ChevronDown,
  MapPin, TrendingUp, Activity, Satellite, CloudRain
} from 'lucide-react';

// Import page components
import DashboardPage from '../pages/Dashboard';
import ThreatMonitoringPage from './ThreatMonitoringPage';
import CommunityReportingPage from '../pages/CommunityReporting';
import DataAnalyticsPage from '../pages/DataAnalytics';
import UserProfilePage from '../pages/UserProfile';
import LogoutPage, { LogoutSuccessPage } from './LogoutPage';

const MainApp = ({ user, onLogout }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "High Tide Alert", message: "Storm surge expected in Mumbai", type: "warning", time: "5 min ago" },
    { id: 2, title: "Blue Carbon Update", message: "Mangrove health assessment complete", type: "info", time: "15 min ago" },
    { id: 3, title: "Community Report", message: "New pollution report from Goa", type: "alert", time: "1 hour ago" }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Page configuration based on user role
  const getNavigationItems = (userRole) => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Home, description: 'System overview and key metrics' },
      { id: 'threats', label: 'Threat Monitor', icon: AlertTriangle, description: 'Real-time threat detection and analysis' },
      { id: 'community', label: 'Community Reports', icon: Users, description: 'Citizen observations and reports' },
      { id: 'weather', label: 'Weather', icon: CloudRain, description: 'Weather monitoring and forecasts' },
      { id: 'satellite', label: 'Satellite', icon: Satellite, description: 'Satellite data and imagery' },
      { id: 'reports', label: 'Reports', icon: Users, description: 'Threat and community reports' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Advanced analytics and insights' }
    ];

    const roleSpecificItems = {
      official: [
        { id: 'analytics', label: 'Data Analytics', icon: BarChart3, description: 'Advanced analytics and insights' }
      ],
      researcher: [
        { id: 'analytics', label: 'Data Analytics', icon: BarChart3, description: 'Research data and analysis tools' }
      ],

      emergency: [],

      citizen: []
    };

    return [
      ...baseItems,
      ...(roleSpecificItems[userRole] || []),
      { id: 'profile', label: 'Profile & Settings', icon: Settings, description: 'Account settings and preferences' }
    ];
  };

  const navigationItems = getNavigationItems(user?.role || 'citizen');

  const handlePageChange = (pageId) => {
    setCurrentPage(pageId);
    setSidebarOpen(false);
  };

  const handleLogoutRequest = () => {
    setCurrentPage('logout');
  };

  const handleLogoutConfirm = () => {
    setCurrentPage('logout_success');
  };

  const handleLogoutComplete = () => {
    onLogout();
  };

  const handleLogoutCancel = () => {
    setCurrentPage('dashboard');
  };

  // Handle logout and logout success pages
  if (currentPage === 'logout') {
    return (
      <LogoutPage
        user={user}
        onConfirmLogout={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    );
  }

  if (currentPage === 'logout_success') {
    return (
      <LogoutSuccessPage
        onReturnHome={handleLogoutComplete}
      />
    );
  }

  // Render page component based on current page
  const WeatherPage = React.lazy(() => import('./WeatherPage'));
  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage user={user} />;
      case 'threats':
        return <ThreatMonitoringPage user={user} />;
      case 'community':
        return <CommunityReportingPage user={user} />;

      case 'weather':
        return <React.Suspense fallback={<div>Loading...</div>}><WeatherPage /></React.Suspense>;

      case 'analytics':
        return <DataAnalyticsPage user={user} />;
      case 'profile':
        return <UserProfilePage user={user} />;
      default:
        return <DashboardPage user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur-lg border-r border-white/10 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">🌊</span>
              </div>
              <span className="text-white text-xl font-bold">CTAS</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-white hover:text-blue-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <div className="text-white font-medium text-sm">{user?.name}</div>
              <div className="text-blue-300 text-xs capitalize">{user?.role}</div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-500/20 text-white border border-blue-400/30' 
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                }`}
                title={item.description}
              >
                <Icon className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-blue-400' : 'text-blue-300 group-hover:text-white'
                }`} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* System Status */}
        <div className="absolute bottom-6 left-4 right-4">
          <div className="bg-green-500/20 rounded-xl p-3 border border-green-400/30">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 text-sm font-medium">System Online</span>
            </div>
            <div className="text-green-200 text-xs mt-1">All monitoring systems operational</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64">
        {/* Top Navigation Bar */}
        <header className="bg-slate-900/80 backdrop-blur-lg border-b border-white/10 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden text-white hover:text-blue-300 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Page Title */}
              <div className="hidden md:block">
                <h1 className="text-white text-2xl font-bold">
                  {navigationItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
                </h1>
                <p className="text-blue-200 text-sm">
                  {navigationItems.find(item => item.id === currentPage)?.description || 'System overview'}
                </p>
              </div>

              {/* Right Side Actions */}
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

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900/95 backdrop-blur-lg border border-white/20 rounded-xl p-4 z-50 max-h-96 overflow-y-auto">
                      <h3 className="text-white font-bold mb-3">Recent Notifications</h3>
                      <div className="space-y-3">
                        {notifications.map((notification) => (
                          <div key={notification.id} className="p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-white text-sm font-medium">{notification.title}</p>
                                <p className="text-blue-200 text-xs">{notification.message}</p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                notification.type === 'warning' ? 'bg-orange-500/20 text-orange-300' :
                                notification.type === 'alert' ? 'bg-red-500/20 text-red-300' :
                                'bg-blue-500/20 text-blue-300'
                              }`}>
                                {notification.type}
                              </span>
                            </div>
                            <p className="text-gray-400 text-xs mt-2">{notification.time}</p>
                          </div>
                        ))}
                      </div>
                      <button className="w-full mt-3 text-blue-400 hover:text-white text-sm transition-colors">
                        View All Notifications
                      </button>
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="text-left hidden sm:block">
                      <p className="text-white text-sm font-medium">{user?.name}</p>
                      <p className="text-blue-200 text-xs capitalize">{user?.role}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-blue-400" />
                  </button>

                  {/* User Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900/95 backdrop-blur-lg border border-white/20 rounded-xl p-4 z-50">
                      <div className="flex items-center space-x-3 p-3 border-b border-white/10 mb-3">
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
                          <p className="text-blue-300 text-xs capitalize">{user?.organization}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <button 
                          onClick={() => {
                            setCurrentPage('profile');
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center space-x-3 p-3 hover:bg-white/10 rounded-lg transition-colors text-left"
                        >
                          <User className="w-4 h-4 text-blue-400" />
                          <span className="text-white">Profile & Settings</span>
                        </button>
                        <button 
                          onClick={() => {
                            handleLogoutRequest();
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center space-x-3 p-3 hover:bg-red-500/20 rounded-lg transition-colors text-left"
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
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {renderPageContent()}
        </main>
      </div>

      {/* Click outside to close dropdowns */}
      {(showUserMenu || showNotifications) && (
        <div 
          className="fixed inset-0 z-20"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </div>
  );
};

export default MainApp;
