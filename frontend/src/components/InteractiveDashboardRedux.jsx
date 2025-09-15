import React, { useState, useEffect } from 'react';
import { 
  Activity, Satellite, CloudRain, Waves, BarChart, 
  Users, MapPin, RefreshCw, Settings, LogOut, User as UserIcon, 
  ChevronDown, Smartphone, Menu, X, MessageCircle 
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useAuth, useUI, useDashboard, useConnectionStatus } from '../store/hooks';
import { setActiveTab, toggleSidebar, openModal } from '../store/slices/uiSlice';
import { logoutUser } from '../store/slices/authSlice';
import DashboardProvider from './DashboardProvider';
import EnhancedCurrentMonitor from './EnhancedCurrentMonitor';
import WeatherWidget from './WeatherWidget';
import EnhancedSatelliteMap from './EnhancedSatelliteMap';
import MapboxSatelliteMap from './MapboxSatelliteMap';
import MapboxCoastalMonitor from './MapboxCoastalMonitor';
import FallbackMap from './FallbackMap';
import MapErrorBoundary from './MapErrorBoundary';
import CommunityReports from './CommunityReports';
import ChatbotWidget from './ChatbotWidget';
import AnalyticsPage from './AnalyticsPage';
import CurrentMonitorService from '../services/currentMonitorService';
import SimpleSettingsModal from './SimpleSettingsModal';
import UserProfileDisplay from './UserProfileDisplay';

const InteractiveDashboard = ({ onLogout, initialTab = 'overview' }) => {
  const dispatch = useDispatch();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [mapProvider, setMapProvider] = useState('interactive'); // Default to interactive analysis
  const [currentMonitor, setCurrentMonitor] = useState(null);
  const [currentStats, setCurrentStats] = useState({
    speed: 1.2,
    direction: 245,
    directionText: 'SW',
    station: 'Mumbai Port - Demo',
    connected: true,
    lastUpdate: Date.now(),
    distance: '2.1'
  });
  const [userLocation, setUserLocation] = useState(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('🎯 InteractiveDashboard mounted');
    console.log('🤖 Initial chatbot state:', isChatbotOpen);
  }, []);

  useEffect(() => {
    console.log('🤖 Chatbot state changed to:', isChatbotOpen);
  }, [isChatbotOpen]);

  const { user, isAuthenticated } = useAuth();
  const { isConnected, syncStatus } = useConnectionStatus();
  const { 
    activeTab, 
    sidebarCollapsed, 
    isLoading
  } = useDashboard();
  const { modals } = useUI();

  // Initialize Current Monitor Service
  useEffect(() => {
    const initCurrentMonitor = async () => {
      try {
        // Get user location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              setUserLocation(location);
              
              // Initialize Current Monitor Service
              const monitor = new CurrentMonitorService();
              await monitor.initialize(location);
              
              // Add listener for updates
              monitor.addListener((event) => {
                if (event.type === 'dataUpdate' || event.type === 'connectionStatus') {
                  setCurrentStats(monitor.getLiveStats());
                }
              });
              
              setCurrentMonitor(monitor);
              setCurrentStats(monitor.getLiveStats());
            },
            async (error) => {
              console.error('Geolocation error:', error);
              // Fall back to Mumbai coordinates for demo
              const fallbackLocation = { lat: 19.0760, lng: 72.8777 };
              setUserLocation(fallbackLocation);
              
              try {
                const monitor = new CurrentMonitorService();
                await monitor.initialize(fallbackLocation);
                
                monitor.addListener((event) => {
                  if (event.type === 'dataUpdate' || event.type === 'connectionStatus') {
                    setCurrentStats(monitor.getLiveStats());
                  }
                });
                
                setCurrentMonitor(monitor);
                setCurrentStats(monitor.getLiveStats());
              } catch (monitorError) {
                console.warn('Current monitor initialization failed, using demo data:', monitorError);
                // Keep the demo data from initial state
              }
            }
          );
        }
      } catch (error) {
        console.error('Error initializing Current Monitor:', error);
      }
    };

    initCurrentMonitor();

    return () => {
      if (currentMonitor) {
        currentMonitor.destroy();
      }
    };
  }, []);
  
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
    // Just navigate to logout page - don't clear auth state yet
    onLogout();
  };

  const handleOpenSettings = () => {
    console.log('🔧 Opening settings modal');
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    console.log('🔧 Closing settings modal');
    setIsSettingsOpen(false);
  };

  const handleToggleChatbot = () => {
    console.log('🤖 Chatbot button clicked! Current state:', isChatbotOpen);
    setIsChatbotOpen(!isChatbotOpen);
    console.log('🤖 Setting chatbot open to:', !isChatbotOpen);
  };

  const handleOpenNotifications = () => {
    dispatch(openModal({ modalName: 'alertDetail' }));
  };

  // Handle manual refresh of current data
  const handleRefreshCurrents = async () => {
    if (currentMonitor && userLocation) {
      try {
        await currentMonitor.getCurrentData(userLocation.lat, userLocation.lng);
        setCurrentStats(currentMonitor.getLiveStats());
      } catch (error) {
        console.error('Error refreshing current data:', error);
      }
    }
  };

  // Handle location permission request
  const handleRequestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          
          if (currentMonitor) {
            await currentMonitor.initialize(location);
            setCurrentStats(currentMonitor.getLiveStats());
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setCurrentStats(prev => ({ 
            ...prev, 
            station: 'Location permission denied',
            connected: false 
          }));
        }
      );
    }
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
            {/* Satellite Map - Large, Left Side */}
            <div className="lg:col-span-3 relative">
              <div 
                className="card-theme rounded-xl p-6 transition-all duration-300 relative"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  boxShadow: 'var(--card-shadow)',
                  minHeight: '800px',
                  height: 'fit-content',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--card-hover-shadow)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--card-shadow)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div className="flex flex-col space-y-4 mb-4 relative z-10">
                  {/* Header Row */}
                  <div className="flex items-center justify-between">
                    <h3 style={{ color: 'var(--text-primary)' }} className="text-lg font-bold flex items-center relative text-positioning-fix">
                      <Satellite className="w-6 h-6 text-green-500 mr-2" />
                      Satellite Map
                    </h3>
                  </div>
                  
                  {/* Controls Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-4 relative">
                    {/* Map Provider Toggle */}
                    <div className="flex items-center space-x-2 flex-wrap">
                      <button
                        onClick={() => setMapProvider('interactive')}
                        className={`px-3 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
                          mapProvider === 'interactive' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        Interactive
                      </button>
                      <button
                        onClick={() => setMapProvider('mapbox')}
                        className={`px-3 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
                          mapProvider === 'mapbox' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        Mapbox
                      </button>
                      <button
                        onClick={() => setMapProvider('coastal')}
                        className={`px-3 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
                          mapProvider === 'coastal' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        Coastal Monitor
                      </button>
                    </div>
                    
                    {/* Description Text */}
                    <div className="text-sm text-slate-400 text-right sm:text-left sm:max-w-md relative">
                      {mapProvider === 'interactive' ? 'Interactive Coastal Analysis Dashboard' : 
                       mapProvider === 'coastal' ? 'Advanced Mapbox Coastal Monitoring' :
                       mapProvider === 'mapbox' ? 'Mapbox Satellite View' :
                       "Interactive Coastal Areas Monitoring"}
                    </div>
                  </div>
                </div>
                <div className="h-[650px] sm:h-[700px] lg:h-[720px] w-full overflow-hidden rounded-lg">
                  <MapErrorBoundary>
                    {mapProvider === 'interactive' ? (
                      <FallbackMap />
                    ) : mapProvider === 'coastal' ? (
                      <MapboxCoastalMonitor userLocation={userLocation} />
                    ) : mapProvider === 'mapbox' ? (
                      <MapboxSatelliteMap />
                    ) : (
                      <FallbackMap />
                    )}
                  </MapErrorBoundary>
                </div>
              </div>
            </div>

            {/* Quick Stats and Other Components - Right Side */}
            <div className="lg:col-span-1 space-y-6 relative">
              {/* Quick Stats */}
              <div 
                className="card-theme rounded-xl p-6 transition-all duration-300 relative"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  boxShadow: 'var(--card-shadow)',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--card-hover-shadow)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--card-shadow)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <h3 style={{ color: 'var(--text-primary)', position: 'relative', zIndex: 1 }} className="text-lg font-bold mb-4 flex items-center text-positioning-fix">
                  <Activity className="w-5 h-5 text-cyan-500 mr-2" />
                  Quick Stats
                </h3>
                <div className="space-y-3 relative z-1 text-positioning-fix">
                  <div className="flex justify-between items-center text-positioning-fix">
                    <span style={{ color: 'var(--text-muted)' }} className="flex items-center font-medium text-positioning-fix">
                      <div className={`w-2 h-2 rounded-full mr-2 ${currentStats.connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                      Ocean Data
                    </span>
                    <span className={`font-semibold text-positioning-fix ${currentStats.connected ? 'text-green-400' : 'text-red-400'}`}>
                      {currentStats.connected ? 'Live' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-positioning-fix">
                    <span className="text-slate-400 text-positioning-fix">Current Speed</span>
                    <span className="font-semibold text-blue-400 text-positioning-fix">
                      {currentStats.speed.toFixed(1)} kts
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-positioning-fix">
                    <span className="text-slate-400 text-positioning-fix">Direction</span>
                    <span className="font-semibold text-cyan-400 text-positioning-fix">
                      {currentStats.directionText} ({currentStats.direction}°)
                    </span>
                  </div>
                  <div className="border-t border-slate-600 pt-4 mt-4">
                    <div className="text-slate-400 text-xs mb-2">
                      Station: {currentStats.station}
                    </div>
                    {userLocation && (
                      <>
                        <div className="text-slate-400 text-xs mb-2">
                          Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                        </div>
                        {currentStats.distance && (
                          <div className="text-slate-400 text-xs mb-2">
                            Distance: {currentStats.distance}km
                          </div>
                        )}
                      </>
                    )}
                    <div className="text-slate-400 text-xs">
                      Updated: {currentStats.lastUpdate ? new Date(currentStats.lastUpdate).toLocaleTimeString() : 'Never'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Monitor - Compact */}
              <div 
                className="rounded-xl border p-4"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 style={{ color: 'var(--text-primary)' }} className="text-lg font-semibold flex items-center">
                    <Waves className="w-5 h-5 text-blue-400 mr-2" />
                    Current Monitor
                  </h3>
                  <button
                    onClick={handleRefreshCurrents}
                    className="p-1 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
                    title="Refresh current data"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-400 hover:text-white" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">{currentStats.station}</span>
                    <span className={`${currentStats.connected ? 'text-green-400' : 'text-red-400'}`}>
                      {currentStats.connected ? 'connected' : 'disconnected'}
                    </span>
                  </div>
                  {!currentStats.connected ? (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                      <div className="flex items-center justify-between text-red-400 text-sm">
                        <div className="flex items-center">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          {currentStats.station === 'Location unavailable' ? 'Location access needed' : 'Connecting to ocean data...'}
                        </div>
                        {currentStats.station === 'Location unavailable' && (
                          <button
                            onClick={handleRequestLocation}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                          >
                            Allow Location
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                      <div className="space-y-2">
                        <div className="flex items-center text-green-400 text-sm">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Connected and monitoring
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400">Speed:</span>
                            <span className="text-white ml-1">{currentStats.speed.toFixed(1)} kts</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Direction:</span>
                            <span className="text-white ml-1">{currentStats.directionText}</span>
                          </div>
                        </div>
                        {currentStats.distance && (
                          <div className="text-xs text-slate-400">
                            Station: {currentStats.distance}km away
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>


            </div>
          </div>
        );
      
      case 'currents':
        return (
          <div className="space-y-6">
            <EnhancedCurrentMonitor />
          </div>
        );
      
      case 'weather':
        return <WeatherWidget />;
      
      case 'satellite':
        // Use Enhanced Satellite Map with animations and heatmaps
        return (
          <div 
            className="rounded-xl border p-6 transition-all duration-300"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
              boxShadow: 'var(--card-shadow)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 style={{ color: 'var(--text-primary)' }} className="text-lg font-bold flex items-center">
                <Satellite className="w-6 h-6 text-green-500 mr-2" />
                🇮🇳 Indian Coastal Monitoring - Gujarat & Mumbai
              </h3>
              <div style={{ color: 'var(--text-muted)' }} className="text-sm font-medium">
                Arabian Sea real-time satellite with animated heatmaps
              </div>
            </div>
            <div className="h-[720px] rounded-lg overflow-hidden">
              <EnhancedSatelliteMap />
            </div>
          </div>
        );
      
      case 'reports':
        return <CommunityReports />;
        
      case 'analytics':
        return <AnalyticsPage />;
        
      default:
        return (
          <div 
            className="p-6 rounded-xl transition-all duration-300 hover:scale-[1.02]"
            style={{
              backgroundColor: 'var(--card-bg)',
              backdropFilter: 'blur(12px)',
              borderWidth: '1px',
              borderColor: 'var(--card-border)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <h3 
              className="text-lg font-semibold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Overview
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Select a tab to view detailed data and analytics
            </p>
          </div>
        );
    }
  };

  // Handle window resize for responsive layout with improved mobile support
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileView(isMobile);
      
      // Auto-collapse sidebar on mobile by default for better UX
      if (isMobile && !sidebarCollapsed) {
        dispatch(toggleSidebar());
      }
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    
    // Handle orientation change on mobile devices
    window.addEventListener('orientationchange', () => {
      setTimeout(handleResize, 100);
    });
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [dispatch, sidebarCollapsed]);

  return (
    <DashboardProvider>
      <div 
        className="min-h-screen relative gradient-overlay"
        style={{
          background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-tertiary) 100%)'
        }}
      >
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${sidebarCollapsed && !isMobileView ? 'w-20' : 'w-72'} ${isMobileView && sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'}`}>
          {/* Sidebar Content */}
          <div 
            className="h-full backdrop-blur-sm flex flex-col overflow-hidden sidebar-theme"
            style={{
              backgroundColor: 'var(--sidebar-bg)',
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--sidebar-shadow)',
            }}
          >
            {/* Sidebar Header */}
            {!isMobileView && (
              <div 
                className="p-4 border-b"
                style={{
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className={`flex items-center ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-2xl"></span>
                    </div>
                    {!sidebarCollapsed && (
                      <div className="ml-3">
                        <h2 style={{ color: 'var(--text-primary)' }} className="font-bold text-lg">CTAS</h2>
                        <p style={{ color: 'var(--text-muted)' }} className="text-xs">Coastal Monitoring</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSidebarToggle}
                    className="p-1 rounded transition-colors"
                    style={{
                      color: 'var(--text-muted)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'var(--sidebar-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    <ChevronDown className={`w-6 h-6 transform transition-transform ${sidebarCollapsed ? 'rotate-90' : '-rotate-90'}`} />
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
                    className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-200 touch-manipulation min-h-[56px] ${sidebarCollapsed && !isMobileView ? 'justify-center' : ''}`}
                    style={{
                      backgroundColor: activeTab === tab.id ? 'var(--sidebar-active)' : 'transparent',
                      color: activeTab === tab.id ? '#ffffff' : 'var(--sidebar-text)'
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab.id) {
                        e.target.style.backgroundColor = 'var(--sidebar-hover)';
                        e.target.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab.id) {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = 'var(--sidebar-text)';
                      }
                    }}
                    aria-label={`Navigate to ${tab.label}`}
                  >
                    <Icon className={`${isMobileView ? 'w-6 h-6' : 'w-7 h-7'}`} />
                    {(!sidebarCollapsed || isMobileView) && (
                      <span className="font-medium">{tab.label}</span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Desktop User Menu */}
            {!isMobileView && (
              <div 
                className="absolute bottom-0 left-0 right-0 p-4 border-t"
                style={{
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${sidebarCollapsed ? 'justify-center' : ''}`}
                    style={{
                      color: 'var(--sidebar-text)',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'var(--sidebar-hover)';
                      e.target.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = 'var(--sidebar-text)';
                    }}
                  >
                    <UserProfileDisplay variant={sidebarCollapsed ? 'avatar-only' : 'compact'} />
                    {!sidebarCollapsed && (
                      <ChevronDown className="w-5 h-5 ml-auto" />
                    )}
                  </button>
                  
                  {showUserMenu && (
                    <div 
                      className={`absolute ${sidebarCollapsed ? 'left-full ml-2' : 'left-0'} bottom-full mb-2 w-64 rounded-xl border z-50 overflow-hidden backdrop-blur-md transition-all duration-300`}
                      style={{
                        backgroundColor: 'var(--surface-elevated)',
                        borderColor: 'var(--card-border)',
                        boxShadow: 'var(--card-hover-shadow)',
                      }}
                    >
                      <div 
                        className="p-4 border-b"
                        style={{
                          borderColor: 'var(--border-color)',
                          background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))'
                        }}
                      >
                        <UserProfileDisplay variant="full" />
                      </div>
                      <div className="p-2 space-y-1">
                        <button
                          onClick={handleOpenSettings}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group hover:scale-[1.02] font-medium"
                          style={{
                            color: 'var(--text-secondary)',
                            backgroundColor: 'transparent'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'var(--bg-tertiary)';
                            e.target.style.color = 'var(--text-primary)';
                            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = 'var(--text-secondary)';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                          <span>Settings</span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200 group hover:scale-[1.02] font-medium"
                        >
                          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                          <span>Logout</span>
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
                    <UserProfileDisplay variant="compact" />
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  </button>
                  
                  {showUserMenu && (
                    <div 
                      className="absolute left-0 bottom-full mb-2 w-64 rounded-xl border shadow-2xl z-50 overflow-hidden backdrop-blur-sm"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      <div 
                        className="p-4 border-b"
                        style={{
                          borderColor: 'var(--border-color)',
                          background: 'linear-gradient(to right, var(--bg-tertiary), var(--bg-secondary))'
                        }}
                      >
                        <UserProfileDisplay variant="full" />
                      </div>
                      <div className="p-2 space-y-1">
                        <button
                          onClick={handleOpenSettings}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group hover:scale-[1.02]"
                          style={{
                            color: 'var(--text-secondary)',
                            backgroundColor: 'transparent'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'var(--bg-tertiary)';
                            e.target.style.color = 'var(--text-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = 'var(--text-secondary)';
                          }}
                        >
                          <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                          <span className="font-medium">Settings</span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-all duration-200 group hover:scale-[1.02]"
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
              <header 
                className="backdrop-blur-sm border-b p-4 flex items-center justify-between sticky top-0 z-30"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="flex items-center">
                  <button
                    onClick={handleSidebarToggle}
                    className="p-3 mr-3 rounded-xl transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center touch-manipulation"
                    style={{
                      color: 'var(--text-primary)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'var(--bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                    aria-label={sidebarCollapsed ? 'Open navigation menu' : 'Close navigation menu'}
                  >
                    {sidebarCollapsed ? <Menu className="w-6 h-6" /> : <X className="w-6 h-6" />}
                  </button>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg"></span>
                    </div>
                    <h2 style={{ color: 'var(--text-primary)' }} className="font-bold text-lg ml-2">CTAS</h2>
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

        {/* Chatbot Interface - Right Side */}
        {isChatbotOpen && (
          <div className="fixed right-4 bottom-20 top-20 w-80 z-40">
            <ChatbotWidget onClose={() => setIsChatbotOpen(false)} />
          </div>
        )}
      </div>

      {/* Floating Greeting Bubble */}
      {!isChatbotOpen && (
        <div className="fixed bottom-28 right-4 z-[9998] animate-bounce">
          <div 
            className="bg-white rounded-xl px-3 py-2 shadow-xl border border-blue-200 max-w-48"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
              boxShadow: '0 15px 35px rgba(59, 130, 246, 0.2), 0 0 0 1px rgba(59, 130, 246, 0.15)'
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">👋</span>
              <div>
                <p className="text-gray-800 text-sm font-semibold">
                  Hi {user?.name || 'Krish'}!
                </p>
                <p className="text-blue-600 text-xs font-medium">
                  Need coastal insights? 🌊
                </p>
              </div>
            </div>
            {/* Speech bubble arrow */}
            <div 
              className="absolute bottom-0 right-6 w-0 h-0"
              style={{
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid #f0f9ff',
                transform: 'translateY(100%)'
              }}
            />
          </div>
        </div>
      )}

      {/* Floating Chatbot Toggle Button */}
      <button
        onClick={handleToggleChatbot}
        className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center z-[9999] transition-all duration-300 hover:scale-110 border-2 border-blue-400"
        title="Open CTAS Assistant"
        style={{ 
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
          boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3), 0 0 0 2px rgba(147, 197, 253, 0.5)',
          animation: 'pulse 2s infinite'
        }}
      >
        <MessageCircle className="w-8 h-8" />
      </button>
      
      {/* Simple Settings Modal */}
      <SimpleSettingsModal 
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
      />
      
      {/* Overview Page Layout Fix Styles */}
      <style>{`
        /* Chatbot button pulse animation */
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 20px 40px rgba(59, 130, 246, 0.3), 0 0 0 2px rgba(147, 197, 253, 0.5), 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          50% {
            box-shadow: 0 20px 40px rgba(59, 130, 246, 0.4), 0 0 0 2px rgba(147, 197, 253, 0.7), 0 0 0 10px rgba(59, 130, 246, 0);
          }
        }

        /* Greeting bubble animations */
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes gentleBounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }

        /* Apply animations to greeting bubble */
        .fixed.bottom-28.right-4 {
          animation: slideInRight 0.8s ease-out, gentleBounce 2s ease-in-out 1s infinite;
        }

        /* Ensure stable text positioning */
        .card-theme {
          position: relative;
          isolation: isolate;
        }
        
        /* Fix text positioning issues */
        .text-positioning-fix {
          position: relative;
          z-index: 1;
          transform: translateZ(0);
          will-change: auto;
        }
        
        /* Grid layout stability */
        .grid {
          contain: layout;
        }
        
        .grid > div {
          position: relative;
          contain: layout style;
        }
        
        /* Ensure flex containers maintain proper positioning */
        .flex {
          position: relative;
        }
        
        /* Prevent any text shifting in space-y containers */
        .space-y-3 > *,
        .space-y-4 > *,
        .space-y-6 > * {
          position: relative;
          transform: translateZ(0);
        }
        
        /* Button positioning fix */
        button {
          position: relative;
          z-index: 1;
        }
        
        /* Icon positioning */
        svg {
          position: relative;
        }
      `}</style>
    </DashboardProvider>
  );
};

export default InteractiveDashboard;
